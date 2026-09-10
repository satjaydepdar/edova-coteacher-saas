"""GET /api/teacher/sections: lists a teacher's own tenant's sections, empty until any
exist, and never leaks another tenant's sections. Requires migration 021 applied."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    for tname, tplan in (("SectionsEndpointTest Tenant", "SectionsEndpointTest Plan"),
                         ("SectionsEndpointTest Other Tenant", "SectionsEndpointTest Other Plan")):
        conn.execute("DELETE FROM sections WHERE tenant_id IN (SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                     "(SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name = %s)", (tname,))
        conn.execute("DELETE FROM subscription_plans WHERE name = %s", (tplan,))
        conn.execute("DELETE FROM tenants WHERE name = %s", (tname,))
    conn.execute("DELETE FROM users WHERE email IN "
                 "('sectionsendpointtest.teacher@test.dev', 'sectionsendpointtest.other-teacher@test.dev')")

    def make_teacher_tenant(tname, tplan, email):
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
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SE Teacher') RETURNING id",
            (email, hash_password("testpass")),
        ).fetchone()[0]
        conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                     (uid, tid))
        return tid

    tid = make_teacher_tenant("SectionsEndpointTest Tenant", "SectionsEndpointTest Plan",
                               "sectionsendpointtest.teacher@test.dev")
    other_tid = make_teacher_tenant("SectionsEndpointTest Other Tenant", "SectionsEndpointTest Other Plan",
                                     "sectionsendpointtest.other-teacher@test.dev")

T = {"Authorization": f"Bearer {login('sectionsendpointtest.teacher@test.dev')}"}
OTHER_T = {"Authorization": f"Bearer {login('sectionsendpointtest.other-teacher@test.dev')}"}

# TC1: no sections yet -> empty list
r = httpx.get(f"{BASE}/api/teacher/sections", headers=T)
check("empty tenant returns []", r.status_code == 200 and r.json() == [], f"status={r.status_code} body={r.text}")

# TC2: sections exist -> returned, name-sorted
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("INSERT INTO sections (tenant_id, name) VALUES (%s, '9-B'), (%s, '9-A')", (tid, tid))

r = httpx.get(f"{BASE}/api/teacher/sections", headers=T)
names = [s["name"] for s in r.json()] if r.status_code == 200 else None
check("sections listed, sorted by name", r.status_code == 200 and names == ["9-A", "9-B"],
      f"status={r.status_code} names={names}")

# TC3: another tenant's teacher sees no sections (isolation)
r = httpx.get(f"{BASE}/api/teacher/sections", headers=OTHER_T)
check("cross-tenant isolation: other tenant sees none", r.status_code == 200 and r.json() == [],
      f"status={r.status_code} body={r.text}")

finish()
