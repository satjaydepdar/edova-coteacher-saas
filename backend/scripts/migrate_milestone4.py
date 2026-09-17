import sys
import json
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import db

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'Mathematics',
    class_label VARCHAR(50) NOT NULL DEFAULT 'Class 10',
    section_name VARCHAR(50) DEFAULT '10-A',
    blueprint_type VARCHAR(50) NOT NULL DEFAULT 'cbse_80m',
    duration_minutes INT NOT NULL DEFAULT 180,
    total_marks INT NOT NULL DEFAULT 80,
    instructions TEXT NOT NULL DEFAULT '',
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_date DATE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_tenant ON assessments(tenant_id, created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_scheduled ON assessments(scheduled_date);
"""

SAMPLE_CBSE_SECTIONS = [
    {
        "section_id": "sec-a",
        "name": "Section A",
        "type": "mcq",
        "marks_per_q": 1,
        "instructions": "Questions 1 to 20 are Multiple Choice Questions carrying 1 mark each.",
        "questions": [
            {
                "id": "q-a-1",
                "text": "If two positive integers a and b are written as a = x^3 y^2 and b = x y^3, where x, y are prime numbers, then HCF(a, b) is:",
                "options": [
                    {"key": "A", "text": "x y", "correct": False},
                    {"key": "B", "text": "x y^2", "correct": True},
                    {"key": "C", "text": "x^3 y^3", "correct": False},
                    {"key": "D", "text": "x^2 y^2", "correct": False}
                ],
                "difficulty": "Easy",
                "bloom": "Understand",
                "marks": 1
            },
            {
                "id": "q-a-2",
                "text": "The discriminant of the quadratic equation 2x^2 - 4x + 3 = 0 is:",
                "options": [
                    {"key": "A", "text": "-8", "correct": True},
                    {"key": "B", "text": "10", "correct": False},
                    {"key": "C", "text": "-16", "correct": False},
                    {"key": "D", "text": "8", "correct": False}
                ],
                "difficulty": "Easy",
                "bloom": "Remember",
                "marks": 1
            },
            {
                "id": "q-a-3",
                "text": "If sin theta + cos theta = sqrt(2) cos theta, then (cos theta - sin theta) is equal to:",
                "options": [
                    {"key": "A", "text": "-sqrt(2) cos theta", "correct": False},
                    {"key": "B", "text": "sqrt(2) sin theta", "correct": True},
                    {"key": "C", "text": "sqrt(2) cos theta", "correct": False},
                    {"key": "D", "text": "2 sin theta", "correct": False}
                ],
                "difficulty": "Medium",
                "bloom": "Apply",
                "marks": 1
            }
        ]
    },
    {
        "section_id": "sec-b",
        "name": "Section B",
        "type": "short_answer_1",
        "marks_per_q": 2,
        "instructions": "Questions 21 to 25 carry 2 marks each with very short answers.",
        "questions": [
            {
                "id": "q-b-1",
                "text": "Prove that 3 + 2*sqrt(5) is an irrational number, given that sqrt(5) is irrational.",
                "difficulty": "Medium",
                "bloom": "Understand",
                "rubric": "1 mark for assumption and contradiction setup; 1 mark for concluding statement.",
                "marks": 2
            },
            {
                "id": "q-b-2",
                "text": "Find the roots of the quadratic equation sqrt(3)x^2 + 10x + 7*sqrt(3) = 0 by factorisation.",
                "difficulty": "Medium",
                "bloom": "Apply",
                "rubric": "1 mark for splitting middle term 3x + 7x; 1 mark for correct roots x = -sqrt(3), -7/sqrt(3).",
                "marks": 2
            }
        ]
    },
    {
        "section_id": "sec-c",
        "name": "Section C",
        "type": "short_answer_2",
        "marks_per_q": 3,
        "instructions": "Questions 26 to 31 carry 3 marks each with short answers.",
        "questions": [
            {
                "id": "q-c-1",
                "text": "Prove that: (sin theta - 2 sin^3 theta) / (2 cos^3 theta - cos theta) = tan theta.",
                "difficulty": "Medium",
                "bloom": "Analyze",
                "rubric": "1 mark for taking common terms; 1 mark for identity substitution; 1 mark for simplifying to tan theta.",
                "marks": 3
            }
        ]
    },
    {
        "section_id": "sec-d",
        "name": "Section D",
        "type": "long_answer",
        "marks_per_q": 5,
        "instructions": "Questions 32 to 35 carry 5 marks each with detailed step-by-step working.",
        "questions": [
            {
                "id": "q-d-1",
                "text": "A motor boat whose speed is 18 km/h in still water takes 1 hour more to go 24 km upstream than to return downstream to the same spot. Find the speed of the stream.",
                "difficulty": "Hard",
                "bloom": "Evaluate",
                "rubric": "2 marks for formulating equation 24/(18-s) - 24/(18+s) = 1; 2 marks for solving quadratic s^2 + 48s - 324 = 0; 1 mark for s = 6 km/h.",
                "marks": 5
            }
        ]
    },
    {
        "section_id": "sec-e",
        "name": "Section E",
        "type": "case_study",
        "marks_per_q": 4,
        "instructions": "Case study based questions are compulsory. Questions 36 to 38 carry 4 marks each with sub-parts.",
        "questions": [
            {
                "id": "q-e-1",
                "text": "Case Study: India Gate Shadow Measurement. A student standing 30 m away observes top of monument at 60 deg elevation. Sub-part (i) Find height of monument (2M). Sub-part (ii) Find distance if angle becomes 45 deg (2M).",
                "difficulty": "Hard",
                "bloom": "Create",
                "rubric": "2 marks for sub-part (i) h = 30*sqrt(3) m; 2 marks for sub-part (ii) distance = 30*sqrt(3) m.",
                "marks": 4
            }
        ]
    }
]

SAMPLE_ASSESSMENTS = [
    {
        "title": "CBSE Class 10 Model Examination: Mathematics",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "10-A",
        "blueprint_type": "cbse_80m",
        "duration_minutes": 180,
        "total_marks": 80,
        "instructions": "This question paper contains 38 questions divided into 5 Sections A, B, C, D and E. All questions are compulsory.",
        "sections": SAMPLE_CBSE_SECTIONS,
        "scheduled_date": (date.today() + timedelta(days=7)).isoformat(),
        "status": "ready"
    },
    {
        "title": "Term 1 Periodic Assessment: Units I & II",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "10-A",
        "blueprint_type": "periodic_40m",
        "duration_minutes": 90,
        "total_marks": 40,
        "instructions": "Periodic Test covering Real Numbers, Polynomials, and Quadratic Equations.",
        "sections": SAMPLE_CBSE_SECTIONS[:3],
        "scheduled_date": (date.today() + timedelta(days=12)).isoformat(),
        "status": "scheduled"
    },
    {
        "title": "Unit Diagnostic Quiz: Trigonometry & Heights",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "10-B",
        "blueprint_type": "unit_20m",
        "duration_minutes": 40,
        "total_marks": 20,
        "instructions": "Quick 40-minute diagnostic check on trigonometric ratios and values.",
        "sections": SAMPLE_CBSE_SECTIONS[:2],
        "scheduled_date": None,
        "status": "draft"
    }
]

def main():
    print("1. Running assessments migration...")
    with db() as conn:
        conn.execute(MIGRATION_SQL)
        conn.commit()
    print("Migration executed successfully.")

    print("2. Fetching all active teachers...")
    with db() as conn:
        teachers = conn.execute("""
            SELECT u.id, u.email, utm.tenant_id
            FROM users u
            JOIN user_tenant_mappings utm ON u.id = utm.user_id
            WHERE utm.role = 'TEACHER'
        """).fetchall()

    print(f"Found {len(teachers)} teachers. Seeding initial assessments...")
    seeded_count = 0
    with db() as conn:
        for user_id, email, tenant_id in teachers:
            existing = conn.execute(
                "SELECT COUNT(*) FROM assessments WHERE created_by = %s AND tenant_id = %s",
                (user_id, tenant_id)
            ).fetchone()[0]

            if existing == 0:
                for asg in SAMPLE_ASSESSMENTS:
                    cal_id = None
                    if asg["status"] == "scheduled" and asg["scheduled_date"]:
                        # Create exam event in calendar_events
                        cal_row = conn.execute("""
                            INSERT INTO calendar_events (
                                tenant_id, user_id, title, description, event_type,
                                start_at, end_at, all_day, location
                            ) VALUES (
                                %s, %s, %s, %s, 'exam',
                                %s, %s, FALSE, 'Examination Hall A'
                            ) RETURNING id
                        """, (
                            tenant_id, user_id,
                            f"Exam: {asg['title']} ({asg['section_name']})",
                            f"Total Marks: {asg['total_marks']} | Duration: {asg['duration_minutes']} mins",
                            f"{asg['scheduled_date']}T09:30:00",
                            f"{asg['scheduled_date']}T12:30:00"
                        )).fetchone()
                        cal_id = cal_row[0]

                    conn.execute("""
                        INSERT INTO assessments (
                            tenant_id, created_by, title, subject, class_label, section_name,
                            blueprint_type, duration_minutes, total_marks, instructions,
                            sections, scheduled_date, calendar_event_id, status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                    """, (
                        tenant_id, user_id, asg["title"], asg["subject"], asg["class_label"], asg["section_name"],
                        asg["blueprint_type"], asg["duration_minutes"], asg["total_marks"], asg["instructions"],
                        json.dumps(asg["sections"]), asg["scheduled_date"], cal_id, asg["status"]
                    ))
                    seeded_count += 1
        conn.commit()

    print(f"Successfully seeded {seeded_count} assessments across teachers!")

if __name__ == "__main__":
    main()
