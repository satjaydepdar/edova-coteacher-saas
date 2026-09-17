import sys
import json
from datetime import date, timedelta
import psycopg

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import DB_DSN

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    resource_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    assigned_sections JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ready',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_tenant ON learning_resources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_chapter ON learning_resources(chapter_id);

CREATE TABLE IF NOT EXISTS student_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    records JSONB NOT NULL DEFAULT '[]'::jsonb,
    present_count INT NOT NULL DEFAULT 0,
    absent_count INT NOT NULL DEFAULT 0,
    late_count INT NOT NULL DEFAULT 0,
    excused_count INT NOT NULL DEFAULT 0,
    total_students INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, section_name, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON student_attendance(tenant_id, section_name, attendance_date);
"""

MATH_SUBJECT_ID = '3bceffeb-9732-4cf9-aea9-cbb2032d3c04'
SCIENCE_SUBJECT_ID = '3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5'

CHAPTER_MAP = {
    'Real Numbers': '728c369b-303b-4f08-b3ee-19ab8cdcd703',
    'Polynomials': '3ac8b215-4403-42f4-8a8a-8928092f0136',
    'Pair of Linear Equations': '99abce2e-4ac3-469d-9f36-376086a11aeb',
    'Quadratic Equations': '70230b14-0a20-4359-93ce-92c5b0edf645',
    'Trigonometry': '1595ab67-66b1-4d3e-b8d2-594466190d7d',
    'Light': '166329af-e61b-492f-89a6-d379fdb3a052',
    'Acids': 'fff653c7-0029-45f2-897c-586de430efe7'
}

SAMPLE_RESOURCES = [
    {
        "title": "NCERT Chapter 1: Real Numbers (Official Textbook PDF)",
        "description": "Fundamental Theorem of Arithmetic, revisiting irrational numbers, decimal expansions.",
        "resource_type": "textbook",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Real Numbers'],
        "file_url": "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
        "meta": {"format": "PDF", "file_size": "3.4 MB", "pages": 18, "author": "NCERT"},
        "assigned_sections": ["10-A"],
        "status": "assigned"
    },
    {
        "title": "Real Numbers: Quick Formula & Theorem Cheat-Sheet",
        "description": "One-page revision sheet with Euclid's division algorithm and prime factorisation rules.",
        "resource_type": "formula_sheet",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Real Numbers'],
        "file_url": "/assets/docs/real_numbers_cheat_sheet.pdf",
        "meta": {"format": "PDF", "file_size": "850 KB", "pages": 2, "author": "Edova Co-Teacher"},
        "assigned_sections": ["10-A", "10-B"],
        "status": "assigned"
    },
    {
        "title": "Polynomials: Classroom Presentation Slides (Zeroes & Graphing)",
        "description": "High-contrast classroom slides for teaching geometric representation of quadratic and cubic zeroes.",
        "resource_type": "slides",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Polynomials'],
        "file_url": "/assets/docs/polynomials_slides.pptx",
        "meta": {"format": "PPTX", "file_size": "6.1 MB", "slides_count": 28, "author": "Edova Studio"},
        "assigned_sections": [],
        "status": "ready"
    },
    {
        "title": "Pair of Linear Equations: Practice Worksheet with Detailed Solutions",
        "description": "Graded problem set containing 15 graphical and algebraic elimination method problems.",
        "resource_type": "worksheet",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Pair of Linear Equations'],
        "file_url": "/assets/docs/linear_equations_ws.pdf",
        "meta": {"format": "PDF", "file_size": "1.2 MB", "questions_count": 15, "author": "Edova Curated"},
        "assigned_sections": ["10-A"],
        "status": "assigned"
    },
    {
        "title": "Quadratic Equations: Complete Derivation & Discriminant Concept Notes",
        "description": "Detailed notes on completing the square, quadratic formula derivation, and nature of roots.",
        "resource_type": "notes",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Quadratic Equations'],
        "file_url": "/assets/docs/quadratic_notes.pdf",
        "meta": {"format": "PDF", "file_size": "2.1 MB", "pages": 8, "author": "Senior Faculty"},
        "assigned_sections": [],
        "status": "ready"
    },
    {
        "title": "Trigonometric Ratios & Standard Angles Reference Card",
        "description": "Pocket reference card with sine, cosine, tangent values for 0, 30, 45, 60, and 90 degrees.",
        "resource_type": "formula_sheet",
        "subject_id": MATH_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Trigonometry'],
        "file_url": "/assets/docs/trig_formula_card.pdf",
        "meta": {"format": "PDF", "file_size": "450 KB", "pages": 1, "author": "Edova Math Lab"},
        "assigned_sections": ["10-A", "10-B"],
        "status": "assigned"
    },
    {
        "title": "Light - Reflection & Refraction: Ray Diagrams & Cartesian Sign Convention",
        "description": "Comprehensive visual guide to concave/convex mirror ray tracings and mirror/lens equations.",
        "resource_type": "notes",
        "subject_id": SCIENCE_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Light'],
        "file_url": "/assets/docs/light_ray_diagrams.pdf",
        "meta": {"format": "PDF", "file_size": "4.5 MB", "pages": 14, "author": "Edova Science Dept"},
        "assigned_sections": [],
        "status": "ready"
    },
    {
        "title": "Acids, Bases and Salts: Laboratory Safety & Neutralisation Reactions Handout",
        "description": "Practical indicator color changes, pH scale chart, and common salts preparation guide.",
        "resource_type": "worksheet",
        "subject_id": SCIENCE_SUBJECT_ID,
        "chapter_id": CHAPTER_MAP['Acids'],
        "file_url": "/assets/docs/acids_bases_handout.pdf",
        "meta": {"format": "PDF", "file_size": "1.8 MB", "pages": 4, "author": "Edova Chemistry"},
        "assigned_sections": [],
        "status": "ready"
    }
]

STUDENT_ROSTERS = {
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

def run():
    with psycopg.connect(DB_DSN) as conn:
        print("Executing migration SQL...")
        conn.execute(MIGRATION_SQL)
        
        # Get teachers across tenants
        teachers = conn.execute("""
            SELECT u.id, utm.tenant_id 
            FROM users u 
            JOIN user_tenant_mappings utm ON u.id = utm.user_id 
            WHERE utm.role = 'TEACHER'
        """).fetchall()
        
        print(f"Found {len(teachers)} teacher accounts across tenants.")
        
        for user_id, tenant_id in teachers:
            # Seed resources if none exist
            count_res = conn.execute(
                "SELECT count(*) FROM learning_resources WHERE tenant_id = %s", (tenant_id,)
            ).fetchone()[0]
            
            if count_res == 0:
                print(f"Seeding {len(SAMPLE_RESOURCES)} learning resources for tenant {tenant_id}...")
                for item in SAMPLE_RESOURCES:
                    conn.execute("""
                        INSERT INTO learning_resources (
                            tenant_id, created_by, subject_id, chapter_id, title,
                            description, resource_type, file_url, meta, assigned_sections, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        tenant_id, user_id, item["subject_id"], item["chapter_id"],
                        item["title"], item["description"], item["resource_type"],
                        item["file_url"], json.dumps(item["meta"]), json.dumps(item["assigned_sections"]),
                        item["status"]
                    ))
            
            # Seed attendance for today and yesterday
            today = date.today()
            yesterday = today - timedelta(days=1)
            
            for att_date in [yesterday, today]:
                for sec_name, roster in STUDENT_ROSTERS.items():
                    exists = conn.execute("""
                        SELECT id FROM student_attendance 
                        WHERE tenant_id = %s AND section_name = %s AND attendance_date = %s
                    """, (tenant_id, sec_name, att_date)).fetchone()
                    
                    if not exists:
                        records = []
                        present_count = 0
                        absent_count = 0
                        late_count = 0
                        excused_count = 0
                        
                        for idx, s in enumerate(roster):
                            # realistic sample distribution
                            if idx == 2 and att_date == today:
                                status = "absent"
                                note = "Fever / unwell"
                                absent_count += 1
                            elif idx == 4 and att_date == today:
                                status = "late"
                                note = "School bus delay"
                                late_count += 1
                            elif idx == 5 and att_date == yesterday:
                                status = "absent"
                                note = "Family event"
                                absent_count += 1
                            elif idx == 8 and att_date == yesterday:
                                status = "excused"
                                note = "District athletics trial"
                                excused_count += 1
                            else:
                                status = "present"
                                note = ""
                                present_count += 1
                                
                            records.append({
                                "student_id": s["student_id"],
                                "student_name": s["student_name"],
                                "roll_no": s["roll_no"],
                                "status": status,
                                "note": note
                            })
                            
                        conn.execute("""
                            INSERT INTO student_attendance (
                                tenant_id, recorded_by, section_name, attendance_date,
                                records, present_count, absent_count, late_count, excused_count, total_students
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            tenant_id, user_id, sec_name, att_date,
                            json.dumps(records), present_count, absent_count, late_count, excused_count, len(roster)
                        ))
                        
        conn.commit()
        print("Milestone 5 database migration and seed completed successfully!")

if __name__ == '__main__':
    run()
