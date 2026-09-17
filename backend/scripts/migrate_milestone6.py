import sys
import psycopg
from datetime import date

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import DB_DSN

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS student_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp INT NOT NULL DEFAULT 120,
    streak_days INT NOT NULL DEFAULT 4,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_gamification ON student_gamification(tenant_id, student_id);

CREATE TABLE IF NOT EXISTS student_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_name VARCHAR(100) NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    student_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    solution_explanation TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'needs_practice',
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_mistakes ON student_mistakes(tenant_id, student_id);

CREATE TABLE IF NOT EXISTS student_wiki_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_name VARCHAR(100) NOT NULL,
    topic_name VARCHAR(100) DEFAULT '',
    note_type VARCHAR(20) NOT NULL DEFAULT 'quote',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_wiki ON student_wiki_notes(tenant_id, student_id);
"""

SAMPLE_MISTAKES = [
    {
        "chapter": "Quadratic Equations",
        "topic": "Quadratic Formula & Nature of Roots",
        "question": "Find the roots of 2x^2 - 7x + 3 = 0 using the quadratic formula.",
        "your_ans": "x = 2, 1/3",
        "correct_ans": "x = 3, 1/2",
        "solution": "Using x = (-b +- sqrt(b^2 - 4ac)) / (2a): b^2 - 4ac = 49 - 24 = 25. Thus x = (7 +- 5) / 4 => x = 3 or x = 1/2."
    },
    {
        "chapter": "Light — Reflection and Refraction",
        "topic": "Mirror Formula and Sign Conventions",
        "question": "A convex mirror with focal length 15 cm forms an image 10 cm behind the mirror. What is the object distance?",
        "your_ans": "u = -20 cm",
        "correct_ans": "u = -30 cm",
        "solution": "Mirror formula: 1/f = 1/v + 1/u. For convex mirror, f = +15 cm, v = +10 cm. 1/u = 1/15 - 1/10 = -1/30. So u = -30 cm."
    },
    {
        "chapter": "Introduction to Trigonometry",
        "topic": "Trigonometric Ratios of Specific Angles",
        "question": "Evaluate: (sin 30° + tan 45° - cosec 60°) / (sec 30° + cos 60° + cot 45°).",
        "your_ans": "1",
        "correct_ans": "(43 - 24√3) / 11",
        "solution": "Substitute sin 30° = 1/2, tan 45° = 1, cosec 60° = 2/√3, sec 30° = 2/√3, cos 60° = 1/2, cot 45° = 1, and rationalize the denominator."
    }
]

SAMPLE_WIKI_NOTES = [
    {
        "chapter": "Real Numbers",
        "topic": "Fundamental Theorem of Arithmetic",
        "type": "quote",
        "content": "Fundamental Theorem of Arithmetic: Every composite number can be expressed (factorised) as a product of primes, and this factorisation is unique, apart from the order in which the prime factors occur."
    },
    {
        "chapter": "Introduction to Trigonometry",
        "topic": "Trigonometric Identities",
        "type": "formula",
        "content": "Standard Pythagorean Identities:\n1) sin²(θ) + cos²(θ) = 1\n2) 1 + tan²(θ) = sec²(θ)\n3) 1 + cot²(θ) = cosec²(θ)"
    },
    {
        "chapter": "Light — Reflection and Refraction",
        "topic": "New Cartesian Sign Convention",
        "type": "note",
        "content": "Rule of thumb for ray optics: Object distance u is always NEGATIVE. Focal length of concave mirror/lens is NEGATIVE; convex mirror/lens is POSITIVE."
    }
]

def run():
    with psycopg.connect(DB_DSN) as conn:
        print("Executing migration SQL...")
        conn.execute(MIGRATION_SQL)

        # Find all students across tenants
        students = conn.execute("""
            SELECT u.id, u.email, utm.tenant_id 
            FROM users u 
            JOIN user_tenant_mappings utm ON u.id = utm.user_id 
            WHERE utm.role = 'STUDENT'
        """).fetchall()

        print(f"Found {len(students)} student accounts.")

        for student_id, email, tenant_id in students:
            # 1. Gamification
            conn.execute("""
                INSERT INTO student_gamification (tenant_id, student_id, xp, streak_days, last_active_date)
                VALUES (%s, %s, 240, 4, CURRENT_DATE)
                ON CONFLICT (tenant_id, student_id) DO NOTHING
            """, (tenant_id, student_id))

            # 2. Mistakes
            has_mistakes = conn.execute("""
                SELECT count(*) FROM student_mistakes WHERE student_id = %s
            """, (student_id,)).fetchone()[0]

            if has_mistakes == 0:
                for m in SAMPLE_MISTAKES:
                    conn.execute("""
                        INSERT INTO student_mistakes (
                            tenant_id, student_id, chapter_name, topic_name,
                            question_text, student_answer, correct_answer, solution_explanation, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'needs_practice')
                    """, (
                        tenant_id, student_id, m["chapter"], m["topic"],
                        m["question"], m["your_ans"], m["correct_ans"], m["solution"]
                    ))

            # 3. Wiki notes
            has_wiki = conn.execute("""
                SELECT count(*) FROM student_wiki_notes WHERE student_id = %s
            """, (student_id,)).fetchone()[0]

            if has_wiki == 0:
                for w in SAMPLE_WIKI_NOTES:
                    conn.execute("""
                        INSERT INTO student_wiki_notes (
                            tenant_id, student_id, chapter_name, topic_name, note_type, content
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        tenant_id, student_id, w["chapter"], w["topic"], w["type"], w["content"]
                    ))

        conn.commit()
        print("Milestone 6 database migration and seed completed successfully!")

if __name__ == '__main__':
    run()
