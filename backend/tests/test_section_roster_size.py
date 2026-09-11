"""Section roster size ('31/31 touched' on Level 2, plain student count on Level 1's
section cards): total STUDENTs assigned to a section via user_tenant_mappings.section_id,
distinct from 'active students' (who actually generated a mastery_events row). Additive
to both the existing heatmap endpoint (new optional field, default None for non-section
classroom_ids) and the Level-1 overview endpoint's sections[] list."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

CHAPTER_ID = "chapter-05-arithmetic-progressions"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'RosterSizeTest Tenant')")
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'RosterSizeTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'RosterSizeTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'RosterSizeTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'RosterSizeTest Tenant'")
    conn.execute("DELETE FROM users WHERE email LIKE 'rostersizetest.%@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('RosterSizeTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('RosterSizeTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    teacher_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'RS Teacher') RETURNING id",
        ("rostersizetest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                 (teacher_uid, tid))

T = {"Authorization": f"Bearer {login('rostersizetest.teacher@test.dev')}"}
section_id = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "RS-A"}, headers=T).json()["id"]

# 3 students assigned to the roster; only 1 of them will actually generate a mastery
# event -- so roster size (3) must differ from active students (1).
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    student_uids = []
    for i in range(3):
        uid = conn.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id",
            (f"rostersizetest.student{i}@test.dev", hash_password("testpass"), f"RS Student {i}"),
        ).fetchone()[0]
        conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role, section_id) "
                     "VALUES (%s, %s, 'STUDENT', %s)", (uid, tid, section_id))
        student_uids.append(uid)
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
    "classroom_id": section_id, "student_id": str(student_uids[0]), "chapter_id": CHAPTER_ID,
    "concept_id": "AP-01", "event_type": "mastery",
})

# Level 2: existing heatmap endpoint gains section_roster_size, everything else unchanged.
r = httpx.get(f"{BASE}/api/teacher/classroom/{section_id}/heatmap/{CHAPTER_ID}")
check("heatmap endpoint still responds (existing contract intact)", r.status_code == 200,
      f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}
check("section_roster_size = 3 (assigned), distinct from active count", data.get("section_roster_size") == 3,
      f"got={data.get('section_roster_size')}")
check("total_active_students still just the 1 who actually generated an event",
      data.get("total_active_students") == 1, f"got={data.get('total_active_students')}")

# Non-section classroom_id (old-style slug) -> section_roster_size stays None, no regression.
r2 = httpx.get(f"{BASE}/api/teacher/classroom/demo-class-10a/heatmap/{CHAPTER_ID}")
check("non-section classroom_id: section_roster_size is null, no error",
      r2.status_code == 200 and r2.json().get("section_roster_size") is None,
      f"status={r2.status_code} body={r2.text}")

# Level 1: overview endpoint's sections[] list also carries roster_size.
r3 = httpx.get(f"{BASE}/api/teacher/analytics/overview", headers=T)
check("overview endpoint responds", r3.status_code == 200, f"status={r3.status_code} body={r3.text}")
sections = {s["id"]: s for s in r3.json().get("sections", [])} if r3.status_code == 200 else {}
check("Level-1 section entry carries roster_size = 3", sections.get(section_id, {}).get("roster_size") == 3,
      f"got={sections.get(section_id)}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

finish()
