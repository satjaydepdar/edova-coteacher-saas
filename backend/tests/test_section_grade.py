"""sections.grade (migration 025): the Level-1 'Class' filter. Additive -- a section
created without a grade still works exactly as before (grade = None)."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionGradeTest Tenant')")
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionGradeTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionGradeTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'SectionGradeTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'SectionGradeTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'sectiongradetest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('SectionGradeTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('SectionGradeTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SG Teacher') RETURNING id",
        ("sectiongradetest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

T = {"Authorization": f"Bearer {login('sectiongradetest.teacher@test.dev')}"}

# TC1: create with no grade -> null, unchanged from before this migration
r1 = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "SG-NoGrade"}, headers=T)
check("section created without grade", r1.status_code == 201 and r1.json().get("grade") is None,
      f"status={r1.status_code} body={r1.text}")

# TC2: create with a grade
r2 = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "SG-9A", "grade": "9"}, headers=T)
check("section created with grade 9", r2.status_code == 201 and r2.json().get("grade") == "9",
      f"status={r2.status_code} body={r2.text}")

r3 = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "SG-9B", "grade": "9"}, headers=T)
check("second section with grade 9", r3.status_code == 201, f"status={r3.status_code} body={r3.text}")

r4 = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "SG-10A", "grade": "10"}, headers=T)
check("section with grade 10", r4.status_code == 201, f"status={r4.status_code} body={r4.text}")

# TC3: listing carries grade for every section, including the ungraded one
r5 = httpx.get(f"{BASE}/api/teacher/sections", headers=T)
by_name = {s["name"]: s for s in r5.json()} if r5.status_code == 200 else {}
check("list carries correct grades", r5.status_code == 200
      and by_name.get("SG-NoGrade", {}).get("grade") is None
      and by_name.get("SG-9A", {}).get("grade") == "9"
      and by_name.get("SG-10A", {}).get("grade") == "10",
      f"status={r5.status_code} body={by_name}")

finish()
