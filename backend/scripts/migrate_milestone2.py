import sys
import json
from datetime import datetime, date, timedelta

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import db

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'Mathematics',
    class_label VARCHAR(50) NOT NULL DEFAULT 'Class 10',
    section_name VARCHAR(50) DEFAULT 'Section A',
    unit_id VARCHAR(100),
    chapter_id VARCHAR(100),
    topic_id VARCHAR(100),
    duration_minutes INT NOT NULL DEFAULT 45,
    objective TEXT NOT NULL DEFAULT '',
    outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
    bloom_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
    nep_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    phases JSONB NOT NULL DEFAULT '{"warmup": "", "instruction": "", "activity": "", "assessment": "", "homework": ""}'::jsonb,
    materials JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_date DATE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_tenant_user ON lesson_plans(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_scheduled ON lesson_plans(scheduled_date);
"""

SAMPLE_PLANS = [
    {
        "title": "Quadratic Equations: Factorisation & Roots",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "Section A",
        "unit_id": "unit-2",
        "chapter_id": "ch-2-2",
        "topic_id": "topic-2-2-1",
        "duration_minutes": 45,
        "objective": "Understand the standard form ax^2 + bx + c = 0 and solve quadratic equations by splitting the middle term.",
        "outcomes": [
            "Identify real-world scenarios that produce quadratic models",
            "Factorise quadratic polynomials with integer coefficients",
            "State the zero-product property and solve for roots"
        ],
        "bloom_levels": ["Understand", "Apply"],
        "nep_tags": ["Concept", "Application"],
        "phases": {
            "warmup": "Review multiplication of binomials (x+a)(x+b) with 3 quick mental math prompts on whiteboard.",
            "instruction": "Derive the splitting-the-middle-term technique using product p*q = a*c and sum p+q = b. Address common sign error misconceptions.",
            "activity": "Paired problem set: Students solve 4 equations with varied sign patterns (+/+, -/+, +/-). Peer check steps.",
            "assessment": "Exit ticket: Solve 2x^2 - 5x + 3 = 0. Verify roots by substitution.",
            "homework": "NCERT Exercise 4.2: Questions 1(i-v), 3, and 5."
        },
        "materials": ["Graph paper", "Equation Board", "NCERT Class 10 Textbook"],
        "scheduled_date": date.today().isoformat(),
        "status": "scheduled"
    },
    {
        "title": "Real Numbers: Fundamental Theorem of Arithmetic",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "Section A",
        "unit_id": "unit-1",
        "chapter_id": "ch-1-1",
        "topic_id": "topic-1-1-1",
        "duration_minutes": 45,
        "objective": "Express composite numbers as products of primes uniquely and apply prime factorisation to determine HCF and LCM.",
        "outcomes": [
            "State the Fundamental Theorem of Arithmetic precisely",
            "Find HCF(a, b) and LCM(a, b) using prime factorisation",
            "Verify the relationship HCF(a, b) * LCM(a, b) = a * b"
        ],
        "bloom_levels": ["Remember", "Understand", "Apply"],
        "nep_tags": ["Concept", "Critical thinking"],
        "phases": {
            "warmup": "Factor tree puzzle: decompose 144 and 216 into prime powers within 3 minutes.",
            "instruction": "Formal proof overview of uniqueness of prime factorisation. Demonstrate why 4^n cannot end with 0.",
            "activity": "Group activity: prove or disprove whether HCF * LCM = a * b holds for three numbers.",
            "assessment": "Formative question: If HCF(306, 657) = 9, calculate LCM(306, 657).",
            "homework": "NCERT Exercise 1.2: Problems 2, 4, and 7 (circular track word problem)."
        },
        "materials": ["Prime factor cards", "NCERT Textbook"],
        "scheduled_date": (date.today() + timedelta(days=2)).isoformat(),
        "status": "planned"
    },
    {
        "title": "Introduction to Trigonometric Ratios",
        "subject": "Mathematics",
        "class_label": "Class 10",
        "section_name": "Section B",
        "unit_id": "unit-5",
        "chapter_id": "ch-5-1",
        "topic_id": "topic-5-1-1",
        "duration_minutes": 45,
        "objective": "Define sine, cosine, tangent, cosecant, secant, and cotangent in a right-angled triangle.",
        "outcomes": [
            "Identify opposite, adjacent, and hypotenuse relative to an acute angle",
            "Calculate basic trig ratios given two sides of a right triangle",
            "Recognize reciprocal relationships among ratios"
        ],
        "bloom_levels": ["Remember", "Understand"],
        "nep_tags": ["Concept", "Application"],
        "phases": {
            "warmup": "Display right triangle shadow measurement of a flagpole. Ask how height can be found without climbing.",
            "instruction": "Introduce mnemonic SOH CAH TOA / Pandit Badri Prasad. Emphasize that ratios depend only on angle, not triangle size.",
            "activity": "Trig ratio matching game using triangles of varying orientations.",
            "assessment": "Given tan A = 4/3, calculate sin A and cos A.",
            "homework": "NCERT Exercise 8.1: Questions 1 to 5."
        },
        "materials": ["Protractor", "Right triangle cutouts", "Interactive Virtual Lab"],
        "scheduled_date": None,
        "status": "draft"
    }
]

def main():
    print("1. Running lesson_plans migration...")
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

    print(f"Found {len(teachers)} teachers. Seeding initial lesson plans...")
    seeded_count = 0
    with db() as conn:
        for user_id, email, tenant_id in teachers:
            # Check existing plans for this teacher
            existing = conn.execute(
                "SELECT COUNT(*) FROM lesson_plans WHERE user_id = %s AND tenant_id = %s",
                (user_id, tenant_id)
            ).fetchone()[0]

            if existing == 0:
                for plan in SAMPLE_PLANS:
                    conn.execute("""
                        INSERT INTO lesson_plans (
                            tenant_id, user_id, title, subject, class_label, section_name,
                            unit_id, chapter_id, topic_id, duration_minutes, objective,
                            outcomes, bloom_levels, nep_tags, phases, materials,
                            scheduled_date, status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s,
                            %s, %s
                        )
                    """, (
                        tenant_id, user_id, plan["title"], plan["subject"], plan["class_label"], plan["section_name"],
                        plan["unit_id"], plan["chapter_id"], plan["topic_id"], plan["duration_minutes"], plan["objective"],
                        json.dumps(plan["outcomes"]), json.dumps(plan["bloom_levels"]), json.dumps(plan["nep_tags"]),
                        json.dumps(plan["phases"]), json.dumps(plan["materials"]),
                        plan["scheduled_date"], plan["status"]
                    ))
                    seeded_count += 1
        conn.commit()

    print(f"Successfully seeded {seeded_count} lesson plans across teachers.")

if __name__ == "__main__":
    main()
