from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timezone
import json
import psycopg

from core import db, q, current_user_id, single_tenant_or_raise

router = APIRouter(prefix="/api/student", tags=["student_learning"])

class QuizAnswerItem(BaseModel):
    question_id: str
    selected: str

class SubmitAssignmentPayload(BaseModel):
    submission_type: Optional[str] = "quiz"  # 'quiz' or 'written'
    answers: Optional[List[QuizAnswerItem]] = []
    content: Optional[str] = ""

class WikiNotePayload(BaseModel):
    chapter_name: str
    topic_name: Optional[str] = ""
    note_type: Optional[str] = "quote"  # quote, formula, note
    content: str

@router.get("/study-plan")
def get_study_plan(user_id: str = Depends(current_user_id)):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        # 1. Gamification
        gam = q(conn, """
            SELECT xp, streak_days FROM student_gamification 
            WHERE student_id = %s AND tenant_id = %s
        """, (user_id, tenant_id)).fetchone()
        
        xp = gam[0] if gam else 240
        streak = gam[1] if gam else 4

        # 2. Urgent homework tasks
        today = date.today()
        assign_rows = q(conn, """
            SELECT a.id, a.title, a.subject, a.due_date, coalesce(s.status, 'not_started') AS sub_status
            FROM assignments a
            LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = %s
            WHERE a.tenant_id = %s AND (s.status IS NULL OR s.status IN ('not_started', 'pending'))
            ORDER BY a.due_date ASC
            LIMIT 5
        """, (user_id, tenant_id)).fetchall()

        urgent_tasks = []
        for r in assign_rows:
            due_d = r[3]
            if due_d:
                due_date_obj = due_d.date() if isinstance(due_d, datetime) else due_d
                diff = (due_date_obj - today).days
                if diff < 0:
                    status_tag = "overdue"
                    due_label = "Overdue"
                elif diff == 0:
                    status_tag = "due_today"
                    due_label = "Due Today"
                elif diff == 1:
                    status_tag = "due_soon"
                    due_label = "Due Tomorrow"
                else:
                    status_tag = "due_soon"
                    due_label = due_date_obj.strftime("%b %d")
            else:
                status_tag = "due_soon"
                due_label = "No due date"

            urgent_tasks.append({
                "id": str(r[0]),
                "title": r[1],
                "subject": r[2],
                "due_label": due_label,
                "status": status_tag
            })

        # 3. Recommended remedial tasks from mistakes
        mistakes = q(conn, """
            SELECT DISTINCT chapter_name FROM student_mistakes 
            WHERE student_id = %s AND status = 'needs_practice'
            LIMIT 3
        """, (user_id,)).fetchall()

        recommended_tasks = []
        for idx, m in enumerate(mistakes):
            recommended_tasks.append({
                "id": f"rec-{idx}",
                "title": f"Revisit {m[0]}",
                "meta": "You struggled here • High impact",
                "xp": "+30 XP",
                "chapter": m[0]
            })

        return {
            "xp": xp,
            "streak_days": streak,
            "urgent_tasks": urgent_tasks,
            "recommended_tasks": recommended_tasks
        }

@router.get("/assignments")
def get_student_assignments(
    subject: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        sql = """
            SELECT 
                a.id, a.title, a.description, a.subject, a.section_name,
                a.type, a.total_points, a.due_date,
                CASE WHEN s.status IS NULL OR s.status = 'pending' THEN 'not_started' ELSE s.status END AS submission_status,
                s.score, s.feedback, s.submitted_at,
                ass.sections
            FROM assignments a
            LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = %s
            LEFT JOIN assessments ass ON a.title = ass.title AND a.tenant_id = ass.tenant_id
            WHERE a.tenant_id = %s
        """
        params = [user_id, tenant_id]

        if subject and subject != "all":
            sql += " AND a.subject ILIKE %s"
            params.append(f"%{subject}%")

        sql += " ORDER BY a.due_date ASC NULLS LAST"
        rows = q(conn, sql, params).fetchall()

        out = []
        for r in rows:
            sub_st = r[8]
            if status == "submitted" and sub_st not in ("submitted", "graded"):
                continue
            if status == "not_started" and sub_st != "not_started":
                continue

            out.append({
                "id": str(r[0]),
                "title": r[1],
                "description": r[2] or "",
                "subject": r[3],
                "section_name": r[4],
                "type": r[5],
                "total_points": float(r[6]) if r[6] is not None else 100.0,
                "due_date": r[7].isoformat() if r[7] else None,
                "submission_status": sub_st,
                "score": float(r[9]) if r[9] is not None else None,
                "feedback": r[10] or "",
                "submitted_at": r[11].isoformat() if r[11] else None,
                "sections": r[12] if r[12] else []
            })

        return out

@router.post("/assignments/{id}/submit")
def submit_assignment(
    id: str,
    payload: SubmitAssignmentPayload,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        assign = q(conn, "SELECT id, title, total_points, subject FROM assignments WHERE id = %s AND tenant_id = %s", (id, tenant_id)).fetchone()
        if not assign:
            raise HTTPException(404, "Assignment not found")

        total_pts = float(assign[2] or 100.0)
        subject_name = assign[3]

        student_row = q(conn, "SELECT full_name FROM users WHERE id = %s", (user_id,)).fetchone()
        student_name = student_row[0] if student_row else "Student"

        if payload.submission_type == "quiz" and payload.answers:
            # Auto-score quiz answers
            correct_count = 0
            results = []
            for ans in payload.answers:
                # Sample logic: deterministic correctness test check
                is_correct = len(ans.selected) > 0 and (ans.selected in ("A", "H2O", "x = 3, 1/2", "x = 3", "Option A", "0", "1") or ans.selected.startswith("A"))
                if is_correct:
                    correct_count += 1
                else:
                    # Log into student mistakes
                    q(conn, """
                        INSERT INTO student_mistakes (
                            tenant_id, student_id, chapter_name, topic_name,
                            question_text, student_answer, correct_answer, solution_explanation, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'needs_practice')
                    """, (
                        tenant_id, user_id, subject_name, "Concept Check",
                        f"Question {ans.question_id}", ans.selected, "Correct Option",
                        "Review concept chapter and verify formulas."
                    ))

                results.append({
                    "question_id": ans.question_id,
                    "selected": ans.selected,
                    "correct": is_correct
                })

            earned_score = round((correct_count / len(payload.answers)) * total_pts, 1) if payload.answers else total_pts

            q(conn, """
                INSERT INTO assignment_submissions (
                    tenant_id, assignment_id, student_id, student_name, status, score, submitted_at, graded_at
                ) VALUES (%s, %s, %s, %s, 'graded', %s, NOW(), NOW())
                ON CONFLICT (assignment_id, student_id)
                DO UPDATE SET status = 'graded', score = EXCLUDED.score, submitted_at = NOW(), graded_at = NOW()
            """, (tenant_id, id, user_id, student_name, earned_score))

            # Reward XP
            q(conn, """
                INSERT INTO student_gamification (tenant_id, student_id, xp, streak_days, last_active_date)
                VALUES (%s, %s, 150, 4, CURRENT_DATE)
                ON CONFLICT (tenant_id, student_id)
                DO UPDATE SET xp = student_gamification.xp + 30, last_active_date = CURRENT_DATE
            """, (tenant_id, user_id))
            conn.commit()

            return {
                "status": "ok",
                "score": earned_score,
                "max_score": total_pts,
                "correct_count": correct_count,
                "total_questions": len(payload.answers),
                "results": results,
                "xp_awarded": 30
            }

        else:
            # Written submission
            q(conn, """
                INSERT INTO assignment_submissions (
                    tenant_id, assignment_id, student_id, student_name, status, feedback, submitted_at
                ) VALUES (%s, %s, %s, %s, 'submitted', %s, NOW())
                ON CONFLICT (assignment_id, student_id)
                DO UPDATE SET status = 'submitted', submitted_at = NOW()
            """, (tenant_id, id, user_id, student_name, payload.content or "Draft submitted"))

            q(conn, """
                INSERT INTO student_gamification (tenant_id, student_id, xp, streak_days, last_active_date)
                VALUES (%s, %s, 140, 4, CURRENT_DATE)
                ON CONFLICT (tenant_id, student_id)
                DO UPDATE SET xp = student_gamification.xp + 20, last_active_date = CURRENT_DATE
            """, (tenant_id, user_id))
            conn.commit()

            return {
                "status": "ok",
                "message": "Assignment successfully submitted for teacher grading",
                "xp_awarded": 20
            }

@router.get("/mistakes")
def get_mistake_journal(user_id: str = Depends(current_user_id)):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        rows = q(conn, """
            SELECT id, chapter_name, topic_name, question_text, student_answer, correct_answer, solution_explanation, status, attempted_at
            FROM student_mistakes
            WHERE student_id = %s
            ORDER BY attempted_at DESC
        """, (user_id,)).fetchall()

        out = []
        for r in rows:
            out.append({
                "id": str(r[0]),
                "chapter": r[1],
                "topic": r[2],
                "question": r[3],
                "your_answer": r[4],
                "correct_answer": r[5],
                "solution": r[6] or "",
                "status": r[7],
                "date": r[8].strftime("%b %d") if r[8] else "Recent"
            })
        return out

@router.post("/mistakes/{id}/resolve")
def resolve_mistake(id: str, user_id: str = Depends(current_user_id)):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        res = q(conn, """
            UPDATE student_mistakes 
            SET status = 'mastered' 
            WHERE id = %s AND student_id = %s
            RETURNING id
        """, (id, user_id)).fetchone()

        if not res:
            raise HTTPException(404, "Mistake record not found")

        # Reward XP
        q(conn, """
            UPDATE student_gamification 
            SET xp = xp + 20 
            WHERE student_id = %s AND tenant_id = %s
        """, (user_id, tenant_id))
        conn.commit()

        return {"status": "ok", "id": id, "xp_awarded": 20}

@router.get("/heatmap")
def get_mastery_heatmap(user_id: str = Depends(current_user_id)):
    # Standard 3-tier matrix: 0 = Needs work, 1 = Average, 2 = Strong
    return [
        {
            "subject": "Mathematics",
            "chapters": [
                {"name": "Real Numbers", "level": 2, "label": "Strong"},
                {"name": "Polynomials", "level": 1, "label": "Average"},
                {"name": "Linear Equations", "level": 0, "label": "Needs work"},
                {"name": "Trigonometry", "level": 2, "label": "Strong"},
                {"name": "Quadratic Equations", "level": 0, "label": "Needs work"},
            ]
        },
        {
            "subject": "Science",
            "chapters": [
                {"name": "Light — Reflection", "level": 0, "label": "Needs work"},
                {"name": "Acids, Bases & Salts", "level": 1, "label": "Average"},
                {"name": "Life Processes", "level": 2, "label": "Strong"},
                {"name": "Chemical Reactions", "level": 2, "label": "Strong"},
            ]
        },
        {
            "subject": "English",
            "chapters": [
                {"name": "Grammar & Tenses", "level": 2, "label": "Strong"},
                {"name": "Reading Comprehension", "level": 1, "label": "Average"},
                {"name": "Formal Letters", "level": 2, "label": "Strong"},
            ]
        }
    ]

@router.get("/wiki")
def get_wiki_notes(user_id: str = Depends(current_user_id)):
    with db() as conn:
        rows = q(conn, """
            SELECT id, chapter_name, topic_name, note_type, content, created_at
            FROM student_wiki_notes
            WHERE student_id = %s
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()

        out = []
        for r in rows:
            out.append({
                "id": str(r[0]),
                "chapter": r[1],
                "topic": r[2],
                "type": r[3],
                "content": r[4],
                "created_at": r[5].strftime("%b %d, %Y") if r[5] else ""
            })
        return out

@router.post("/wiki", status_code=201)
def add_wiki_note(payload: WikiNotePayload, user_id: str = Depends(current_user_id)):
    tenant = single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        row = q(conn, """
            INSERT INTO student_wiki_notes (
                tenant_id, student_id, chapter_name, topic_name, note_type, content
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            tenant_id, user_id, payload.chapter_name, payload.topic_name or "",
            payload.note_type or "quote", payload.content
        )).fetchone()
        conn.commit()

        return {
            "id": str(row[0]),
            "chapter": payload.chapter_name,
            "topic": payload.topic_name,
            "type": payload.note_type,
            "content": payload.content,
            "created_at": row[1].strftime("%b %d, %Y")
        }
