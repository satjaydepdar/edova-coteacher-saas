"""POST /api/teacher/sections + POST /api/teacher/sections/{id}/students:
create a section and assign an in-tenant student to it. Requires migration 021."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    for tname, tplan in (("SectionsWriteTest Tenant", "SectionsWriteTest Plan"),
                         ("SectionsWriteTest Other Tenant", "SectionsWriteTest Other Plan")):
        # user_tenant_mappings.section_id references sections -- clear it first or the
        # DELETE FROM sections below hits a ForeignKeyViolation on any rerun.
        conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                     "(SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM sections WHERE tenant_id IN (SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM subscription_plans WHERE name = %s", (tplan,))
        conn.execute("DELETE FROM tenants WHERE name = %s", (tname,))
    conn.execute("DELETE FROM users WHERE email IN "
                 "('sectionswritetest.teacher@test.dev', 'sectionswritetest.other-teacher@test.dev', "
                 "'sectionswritetest.student@test.dev', 'sectionswritetest.other-student@test.dev')")

    def make_tenant(tname, tplan, teacher_email):
        tid = conn.execute(
            "INSERT INTO tenants (name, type, status) VALUES (%s, 'SCHOOL', 'ACTIVE') RETURNING id", (tname,)
        ).fetchone()[0]
        pid = conn.execute(
            "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
            "VALUES (%s, 4, true, true, true) RETURNING id", (tplan,)
        ).fetchone()[0]
        conn.execute(
            "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
            "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid)
        )
        uid = conn.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SW Teacher') RETURNING id",
            (teacher_email, hash_password("testpass")),
        ).fetchone()[0]
        conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                     (uid, tid))
        return tid

    tid = make_tenant("SectionsWriteTest Tenant", "SectionsWriteTest Plan", "sectionswritetest.teacher@test.dev")
    other_tid = make_tenant("SectionsWriteTest Other Tenant", "SectionsWriteTest Other Plan",
                             "sectionswritetest.other-teacher@test.dev")

    student_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SW Student') RETURNING id",
        ("sectionswritetest.student@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
                 (student_uid, tid))

    other_student_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SW Other Student') RETURNING id",
        ("sectionswritetest.other-student@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
                 (other_student_uid, other_tid))

T = {"Authorization": f"Bearer {login('sectionswritetest.teacher@test.dev')}"}

# TC1: create a section
r = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "9-A"}, headers=T)
ok = r.status_code == 201 and r.json().get("name") == "9-A"
check("section created via API", ok, f"status={r.status_code} body={r.text}")
section_id = r.json().get("id") if ok else None

# TC2: duplicate name in same tenant -> clean 409, not a raw DB error
r = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "9-A"}, headers=T)
check("duplicate section name rejected with 409", r.status_code == 409, f"status={r.status_code} body={r.text}")

# TC3: assign an in-tenant student to the section
r = httpx.post(f"{BASE}/api/teacher/sections/{section_id}/students",
               json={"student_user_id": str(student_uid)}, headers=T)
check("in-tenant student assigned", r.status_code == 200, f"status={r.status_code} body={r.text}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    row = conn.execute("SELECT section_id FROM user_tenant_mappings WHERE user_id = %s", (student_uid,)).fetchone()
    check("assignment reflected in DB", row is not None and str(row[0]) == section_id, f"row={row}")

# TC4: assigning a student from another tenant is rejected
r = httpx.post(f"{BASE}/api/teacher/sections/{section_id}/students",
               json={"student_user_id": str(other_student_uid)}, headers=T)
check("cross-tenant student assignment rejected", r.status_code == 404, f"status={r.status_code} body={r.text}")

finish()
