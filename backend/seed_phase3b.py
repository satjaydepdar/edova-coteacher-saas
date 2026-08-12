"""Seed Phase 3B fixtures: quiz module, coming-soon video, draft-only chapter, Shelbyville."""
import psycopg
from main import DB_DSN

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    ch4 = conn.execute("SELECT id FROM chapters WHERE name = 'Chapter 4: Thermodynamics'").fetchone()[0]
    physics = conn.execute("SELECT id FROM subjects WHERE name = 'Global Physics'").fetchone()[0]

    # Published QUIZ module (no quiz_config needed for the tree)
    conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'PYQ: Thermodynamics 2023', 'QUIZ', 5, TRUE) "
        "ON CONFLICT (chapter_id, sequence_order) DO NOTHING",
        (ch4,),
    )

    # Published VIDEO module with NO video_payload -> thumbnail_url NULL ("Coming Soon")
    conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'Coming Soon: Advanced Heat', 'VIDEO', 6, TRUE) "
        "ON CONFLICT (chapter_id, sequence_order) DO NOTHING",
        (ch4,),
    )

    # Chapter whose only module is a draft -> must be stripped from the student tree
    draft_ch = conn.execute(
        "INSERT INTO chapters (subject_id, name, sequence_order) "
        "VALUES (%s, 'Draft-Only Chapter', 100) "
        "ON CONFLICT (subject_id, sequence_order) DO NOTHING RETURNING id",
        (physics,),
    ).fetchone()
    draft_ch_id = draft_ch[0] if draft_ch else conn.execute(
        "SELECT id FROM chapters WHERE subject_id = %s AND sequence_order = 100", (physics,)
    ).fetchone()[0]
    conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'Unpublished Draft Video', 'VIDEO', 1, FALSE) "
        "ON CONFLICT (chapter_id, sequence_order) DO NOTHING",
        (draft_ch_id,),
    )

    # Shelbyville: another school's tenant + private subject (IDOR target)
    shelby = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('Shelbyville School', 'SCHOOL', 'ACTIVE') "
        "ON CONFLICT DO NOTHING RETURNING id"
    ).fetchone()
    shelby_id = shelby[0] if shelby else conn.execute(
        "SELECT id FROM tenants WHERE name = 'Shelbyville School'"
    ).fetchone()[0]
    conn.execute(
        "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
        "VALUES (%s, 'Shelbyville Secret Science', '10th Grade', 1) ON CONFLICT DO NOTHING",
        (shelby_id,),
    )
    print("seeded: phase3b fixtures ready")
