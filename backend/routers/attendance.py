from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta, timezone
import json
import psycopg

from core import db, q, current_user_id, single_tenant_or_raise

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

class StudentAttendanceItem(BaseModel):
    student_id: str
    student_name: str
    roll_no: str
    status: str  # present, absent, late, excused
    note: Optional[str] = ""

class SaveAttendancePayload(BaseModel):
    section_name: str
    attendance_date: str  # YYYY-MM-DD
    records: List[StudentAttendanceItem]

DEFAULT_ROSTERS = {
    "10-A": [
        {"student_id": "std-10a-01", "student_name": "Aarav Patel", "roll_no": "10A-01"},
        {"student_id": "std-10a-02", "student_name": "Diya Sharma", "roll_no": "10A-02"},
        {"student_id": "std-10a-03", "student_name": "Rohan Gupta", "roll_no": "10A-03"},
        {"student_id": "std-10a-04", "student_name": "Ananya Iyer", "roll_no": "10A-04"},
        {"student_id": "std-10a-05", "student_name": "Ishaan Verma", "roll_no": "10A-05"},
        {"student_id": "std-10a-06", "student_name": "Tanvi Nair", "roll_no": "10A-06"},
        {"student_id": "std-10a-07", "student_name": "Aditya Rao", "roll_no": "10A-07"},
        {"student_id": "std-10a-08", "student_name": "Kavya Joshi", "roll_no": "10A-08"},
        {"student_id": "std-10a-09", "student_name": "Vihaan Kulkarni", "roll_no": "10A-09"},
        {"student_id": "std-10a-10", "student_name": "Meera Sen", "roll_no": "10A-10"},
        {"student_id": "std-10a-11", "student_name": "Arjun Singhal", "roll_no": "10A-11"},
        {"student_id": "std-10a-12", "student_name": "Pooja Reddy", "roll_no": "10A-12"},
        {"student_id": "std-10a-13", "student_name": "Siddharth Das", "roll_no": "10A-13"},
        {"student_id": "std-10a-14", "student_name": "Rhea Menon", "roll_no": "10A-14"},
        {"student_id": "std-10a-15", "student_name": "Kabir Bose", "roll_no": "10A-15"}
    ],
    "10-B": [
        {"student_id": "std-10b-01", "student_name": "Advait Deshmukh", "roll_no": "10B-01"},
        {"student_id": "std-10b-02", "student_name": "Sneha Banerjee", "roll_no": "10B-02"},
        {"student_id": "std-10b-03", "student_name": "Pranav Pillai", "roll_no": "10B-03"},
        {"student_id": "std-10b-04", "student_name": "Nisha Agarwal", "roll_no": "10B-04"},
        {"student_id": "std-10b-05", "student_name": "Varun Bhat", "roll_no": "10B-05"},
        {"student_id": "std-10b-06", "student_name": "Anika Trivedi", "roll_no": "10B-06"},
        {"student_id": "std-10b-07", "student_name": "Dhruv Nambiar", "roll_no": "10B-07"},
        {"student_id": "std-10b-08", "student_name": "Shreya Kapoor", "roll_no": "10B-08"},
        {"student_id": "std-10b-09", "student_name": "Kunal Mehrotra", "roll_no": "10B-09"},
        {"student_id": "std-10b-10", "student_name": "Tara Chawla", "roll_no": "10B-10"}
    ]
}

@router.get("")
def get_daily_attendance(
    section_name: str = Query("10-A"),
    attendance_date: Optional[str] = Query(None),
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    if not attendance_date:
        attendance_date = date.today().isoformat()

    with db() as conn:
        row = q(conn, """
            SELECT 
                id, section_name, attendance_date, records,
                present_count, absent_count, late_count, excused_count, total_students,
                created_at, updated_at
            FROM student_attendance
            WHERE tenant_id = %s AND section_name = %s AND attendance_date = %s
        """, (tenant_id, section_name, attendance_date)).fetchone()

        if row:
            records = row[3] if isinstance(row[3], list) else json.loads(row[3] or "[]")
            return {
                "is_saved": True,
                "id": str(row[0]),
                "section_name": row[1],
                "attendance_date": row[2].isoformat() if hasattr(row[2], 'isoformat') else str(row[2]),
                "records": records,
                "present_count": row[4],
                "absent_count": row[5],
                "late_count": row[6],
                "excused_count": row[7],
                "total_students": row[8],
                "created_at": row[9].isoformat() if row[9] else None,
                "updated_at": row[10].isoformat() if row[10] else None
            }

        # If not saved yet, get roster from any past record for this section, or fall back to default
        past_record = q(conn, """
            SELECT records FROM student_attendance 
            WHERE tenant_id = %s AND section_name = %s 
            ORDER BY attendance_date DESC LIMIT 1
        """, (tenant_id, section_name)).fetchone()

        if past_record and past_record[0]:
            base_roster = past_record[0] if isinstance(past_record[0], list) else json.loads(past_record[0])
            roster = [{"student_id": s["student_id"], "student_name": s["student_name"], "roll_no": s["roll_no"]} for s in base_roster]
        else:
            roster = DEFAULT_ROSTERS.get(section_name, DEFAULT_ROSTERS["10-A"])

        default_records = [
            {
                "student_id": s["student_id"],
                "student_name": s["student_name"],
                "roll_no": s["roll_no"],
                "status": "present",
                "note": ""
            }
            for s in roster
        ]

        return {
            "is_saved": False,
            "id": None,
            "section_name": section_name,
            "attendance_date": attendance_date,
            "records": default_records,
            "present_count": len(default_records),
            "absent_count": 0,
            "late_count": 0,
            "excused_count": 0,
            "total_students": len(default_records),
            "created_at": None,
            "updated_at": None
        }

@router.post("", status_code=200)
def save_daily_attendance(
    payload: SaveAttendancePayload,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    present_count = 0
    absent_count = 0
    late_count = 0
    excused_count = 0

    record_dicts = []
    for r in payload.records:
        st = r.status.lower()
        if st == "present":
            present_count += 1
        elif st == "absent":
            absent_count += 1
        elif st == "late":
            late_count += 1
        elif st == "excused":
            excused_count += 1
        else:
            st = "present"
            present_count += 1

        record_dicts.append({
            "student_id": r.student_id,
            "student_name": r.student_name,
            "roll_no": r.roll_no,
            "status": st,
            "note": r.note or ""
        })

    total_students = len(record_dicts)

    with db() as conn:
        row = q(conn, """
            INSERT INTO student_attendance (
                tenant_id, recorded_by, section_name, attendance_date,
                records, present_count, absent_count, late_count, excused_count, total_students,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (tenant_id, section_name, attendance_date)
            DO UPDATE SET 
                recorded_by = EXCLUDED.recorded_by,
                records = EXCLUDED.records,
                present_count = EXCLUDED.present_count,
                absent_count = EXCLUDED.absent_count,
                late_count = EXCLUDED.late_count,
                excused_count = EXCLUDED.excused_count,
                total_students = EXCLUDED.total_students,
                updated_at = NOW()
            RETURNING id, updated_at
        """, (
            tenant_id, user_id, payload.section_name, payload.attendance_date,
            json.dumps(record_dicts), present_count, absent_count, late_count, excused_count, total_students
        )).fetchone()
        conn.commit()

        return {
            "status": "ok",
            "id": str(row[0]),
            "section_name": payload.section_name,
            "attendance_date": payload.attendance_date,
            "present_count": present_count,
            "absent_count": absent_count,
            "late_count": late_count,
            "excused_count": excused_count,
            "total_students": total_students,
            "updated_at": row[1].isoformat()
        }

@router.get("/summary")
def get_attendance_summary(
    section_name: Optional[str] = Query(None),
    days: int = Query(30),
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        sql = """
            SELECT 
                section_name, attendance_date,
                present_count, absent_count, late_count, excused_count, total_students
            FROM student_attendance
            WHERE tenant_id = %s
        """
        params = [tenant_id]

        if section_name and section_name != "ALL":
            sql += " AND section_name = %s"
            params.append(section_name)

        sql += " ORDER BY attendance_date DESC LIMIT %s"
        params.append(days)

        rows = q(conn, sql, params).fetchall()

        daily = []
        tot_p = 0
        tot_s = 0
        for r in rows:
            p = r[2]
            tot = r[6]
            tot_p += p
            tot_s += tot
            daily.append({
                "section_name": r[0],
                "date": r[1].isoformat() if hasattr(r[1], "isoformat") else str(r[1]),
                "present": p,
                "absent": r[3],
                "late": r[4],
                "excused": r[5],
                "total": tot,
                "rate": round((p / tot * 100), 1) if tot > 0 else 0
            })

        avg_rate = round((tot_p / tot_s * 100), 1) if tot_s > 0 else 0

        return {
            "average_rate": avg_rate,
            "total_sessions": len(rows),
            "history": daily
        }
