"""Section model tests: create, assign, uniqueness, and the no-section-yet regression case."""

import psycopg
from main import DB_DSN
from testutil import check, finish, qa_tenant_id

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tenant_id = qa_tenant_id(conn)
    conn.execute("DELETE FROM sections WHERE tenant_id = %s", (tenant_id,))

    # TC1: a section can be created under a tenant
    section_id = conn.execute(
        "INSERT INTO sections (tenant_id, name) VALUES (%s, '9-A') RETURNING id", (tenant_id,)
    ).fetchone()[0]
    check("section created", section_id is not None, f"section_id={section_id}")

    # TC2: UNIQUE(tenant_id, name) is enforced
    dup_ok = False
    try:
        conn.execute("INSERT INTO sections (tenant_id, name) VALUES (%s, '9-A')", (tenant_id,))
    except psycopg.errors.UniqueViolation:
        dup_ok = True
    check("duplicate section name in same tenant rejected", dup_ok, "expected UniqueViolation")

    # TC3: a student (user_tenant_mappings row) can be assigned to a section
    user_id = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) "
        "VALUES ('sections-tc3@qa.dev', 'x', 'QA Student') "
        "ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id"
    ).fetchone()[0]
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id = %s", (user_id,))
    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role, section_id) "
        "VALUES (%s, %s, 'STUDENT', %s)", (user_id, tenant_id, section_id)
    )
    row = conn.execute(
        "SELECT section_id FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s",
        (user_id, tenant_id),
    ).fetchone()
    check("student assigned to section", row[0] == section_id, f"section_id={row[0]}")

    # TC4: regression — a student with NO section (section_id NULL) still inserts and reads fine.
    # This is the "don't break existing behavior" case: every student today has no section_id.
    user_id2 = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) "
        "VALUES ('sections-tc4@qa.dev', 'x', 'QA Student No Section') "
        "ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id"
    ).fetchone()[0]
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id = %s", (user_id2,))
    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
        (user_id2, tenant_id),
    )
    row2 = conn.execute(
        "SELECT section_id FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s",
        (user_id2, tenant_id),
    ).fetchone()
    check("student with no section_id still inserts/reads (regression)", row2[0] is None, f"section_id={row2[0]}")

    # cleanup
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN (%s, %s)", (user_id, user_id2))
    conn.execute("DELETE FROM users WHERE id IN (%s, %s)", (user_id, user_id2))
    conn.execute("DELETE FROM sections WHERE tenant_id = %s", (tenant_id,))

finish()
