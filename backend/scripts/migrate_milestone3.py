import sys
import json
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import db

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    section_name VARCHAR(50) NOT NULL DEFAULT '10-A',
    subject VARCHAR(100) NOT NULL DEFAULT 'Mathematics',
    lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'homework',
    total_points NUMERIC(6, 2) NOT NULL DEFAULT 100.0,
    due_date TIMESTAMPTZ,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    score NUMERIC(6, 2),
    feedback TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_tenant ON assignments(tenant_id, created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_section ON assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
"""

SAMPLE_STUDENTS = [
    {"name": "Aarav Sharma", "email": "aarav.sharma@school.dev"},
    {"name": "Ananya Patel", "email": "ananya.patel@school.dev"},
    {"name": "Rohan Gupta", "email": "rohan.gupta@school.dev"},
    {"name": "Priya Nair", "email": "priya.nair@school.dev"},
    {"name": "Aditya Verma", "email": "aditya.verma@school.dev"},
    {"name": "Sneha Kulkarni", "email": "sneha.kulkarni@school.dev"},
    {"name": "Vikram Singh", "email": "vikram.singh@school.dev"},
    {"name": "Ishita Rao", "email": "ishita.rao@school.dev"},
]

def main():
    print("1. Running assignments & assignment_submissions migration...")
    with db() as conn:
        conn.execute(MIGRATION_SQL)
        conn.commit()
    print("Migration executed successfully.")

    print("2. Ensuring sample students exist for testing...")
    with db() as conn:
        # Get a sample tenant (e.g. TC3 or Greenwood)
        tenants = conn.execute("SELECT id, name FROM tenants WHERE type = 'SCHOOL' LIMIT 5").fetchall()
        for tenant_id, tenant_name in tenants:
            for s in SAMPLE_STUDENTS:
                existing_u = conn.execute("SELECT id FROM users WHERE email = %s", (s["email"],)).fetchone()
                if not existing_u:
                    u_row = conn.execute("""
                        INSERT INTO users (email, password_hash, full_name)
                        VALUES (%s, 'testpass_hash', %s)
                        RETURNING id
                    """, (s["email"], s["name"])).fetchone()
                    student_uid = u_row[0]
                else:
                    student_uid = existing_u[0]

                # Map student to tenant
                mapped = conn.execute("""
                    SELECT id FROM user_tenant_mappings 
                    WHERE user_id = %s AND tenant_id = %s
                """, (student_uid, tenant_id)).fetchone()
                if not mapped:
                    conn.execute("""
                        INSERT INTO user_tenant_mappings (user_id, tenant_id, role)
                        VALUES (%s, %s, 'STUDENT')
                    """, (student_uid, tenant_id))
        conn.commit()

    print("3. Seeding sample assignments across teachers...")
    with db() as conn:
        teachers = conn.execute("""
            SELECT u.id, u.email, utm.tenant_id
            FROM users u
            JOIN user_tenant_mappings utm ON u.id = utm.user_id
            WHERE utm.role = 'TEACHER'
        """).fetchall()

        now = datetime.now(timezone.utc)
        assignments_seeded = 0

        for t_uid, t_email, t_tenant in teachers:
            existing_count = conn.execute("""
                SELECT COUNT(*) FROM assignments WHERE tenant_id = %s AND created_by = %s
            """, (t_tenant, t_uid)).fetchone()[0]

            if existing_count == 0:
                # 1. Quadratic Equations Homework
                due1 = now + timedelta(days=2)
                # Create corresponding calendar event
                cal1 = conn.execute("""
                    INSERT INTO calendar_events (
                        tenant_id, user_id, title, description, event_type,
                        start_at, end_at, all_day, location
                    ) VALUES (
                        %s, %s, %s, %s, 'homework',
                        %s, %s, TRUE, 'Submission Portal'
                    ) RETURNING id
                """, (
                    t_tenant, t_uid, "HW Due: Quadratic Equations Set 1 (10-A)",
                    "Factorisation and roots practice exercises",
                    due1.isoformat(), due1.isoformat()
                )).fetchone()[0]

                asg1 = conn.execute("""
                    INSERT INTO assignments (
                        tenant_id, created_by, section_name, subject, title,
                        description, type, total_points, due_date, calendar_event_id, status
                    ) VALUES (
                        %s, %s, '10-A', 'Mathematics', 'Quadratic Equations: Factorisation Practice',
                        'Complete NCERT Exercise 4.2 Questions 1 to 5. Show step-by-step middle term splitting.',
                        'homework', 100.0, %s, %s, 'published'
                    ) RETURNING id
                """, (t_tenant, t_uid, due1, cal1)).fetchone()[0]

                # 2. Real Numbers Worksheet
                due2 = now + timedelta(days=5)
                cal2 = conn.execute("""
                    INSERT INTO calendar_events (
                        tenant_id, user_id, title, description, event_type,
                        start_at, end_at, all_day, location
                    ) VALUES (
                        %s, %s, %s, %s, 'homework',
                        %s, %s, TRUE, 'Submission Portal'
                    ) RETURNING id
                """, (
                    t_tenant, t_uid, "HW Due: Real Numbers Proofs (10-A)",
                    "Irrationality proofs for sqrt(2) and sqrt(3)",
                    due2.isoformat(), due2.isoformat()
                )).fetchone()[0]

                asg2 = conn.execute("""
                    INSERT INTO assignments (
                        tenant_id, created_by, section_name, subject, title,
                        description, type, total_points, due_date, calendar_event_id, status
                    ) VALUES (
                        %s, %s, '10-A', 'Mathematics', 'Real Numbers: Fundamental Theorem & Proofs',
                        'Write formal proofs for irrationality of sqrt(2) and complete HCF/LCM application word problems.',
                        'worksheet', 50.0, %s, %s, 'published'
                    ) RETURNING id
                """, (t_tenant, t_uid, due2, cal2)).fetchone()[0]

                # 3. Trigonometry Lab Reflection
                due3 = now - timedelta(days=1) # Past due
                asg3 = conn.execute("""
                    INSERT INTO assignments (
                        tenant_id, created_by, section_name, subject, title,
                        description, type, total_points, due_date, status
                    ) VALUES (
                        %s, %s, '10-B', 'Mathematics', 'Trigonometric Ratios Virtual Lab Reflection',
                        'Submit your observation table and angle-ratio calculation sheet from the virtual lab.',
                        'practice', 50.0, %s, 'closed'
                    ) RETURNING id
                """, (t_tenant, t_uid, due3)).fetchone()[0]

                assignments_seeded += 3

                # Seed sample submissions for assignment 1
                students = conn.execute("""
                    SELECT u.id, u.full_name
                    FROM users u
                    JOIN user_tenant_mappings utm ON u.id = utm.user_id
                    WHERE utm.tenant_id = %s AND utm.role = 'STUDENT'
                    LIMIT 6
                """, (t_tenant,)).fetchall()

                scores = [92.0, 85.0, 78.0, 95.0, None, None]
                statuses = ['graded', 'graded', 'graded', 'graded', 'submitted', 'pending']
                feedbacks = [
                    'Excellent step-by-step factorization!',
                    'Good work, watch sign in Q3.',
                    'Check middle term calculation in question 2.',
                    'Flawless derivations and neat presentation.',
                    '',
                    ''
                ]

                for idx, (stu_id, stu_name) in enumerate(students):
                    st = statuses[idx % len(statuses)]
                    sc = scores[idx % len(scores)]
                    fb = feedbacks[idx % len(feedbacks)]
                    sub_time = now - timedelta(hours=idx*4 + 2) if st != 'pending' else None

                    conn.execute("""
                        INSERT INTO assignment_submissions (
                            assignment_id, tenant_id, student_id, student_name,
                            status, score, feedback, submitted_at, graded_at
                        ) VALUES (
                            %s, %s, %s, %s,
                            %s, %s, %s, %s, %s
                        ) ON CONFLICT (assignment_id, student_id) DO NOTHING
                    """, (
                        asg1, t_tenant, stu_id, stu_name,
                        st, sc, fb, sub_time, (now if st == 'graded' else None)
                    ))
        conn.commit()

    print(f"Successfully seeded {assignments_seeded} assignments with submissions!")

if __name__ == "__main__":
    main()
