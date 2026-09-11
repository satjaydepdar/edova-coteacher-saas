"""GET /api/teacher/analytics/overview: the Level-1 'all sections x all chapters'
rollup, built on the mastery_events table via DuckDB. Hand-computed expected values
below -- see the comment block for the arithmetic."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

CHAPTER_ID = "chapter-05-arithmetic-progressions"  # 23 concepts total (AP-01..AP-23)

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsOverviewTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsOverviewTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsOverviewTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'AnalyticsOverviewTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'AnalyticsOverviewTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'analyticsoverviewtest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('AnalyticsOverviewTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('AnalyticsOverviewTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'AO Teacher') RETURNING id",
        ("analyticsoverviewtest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

T = {"Authorization": f"Bearer {login('analyticsoverviewtest.teacher@test.dev')}"}

section_a = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "AO-A"}, headers=T).json()["id"]
section_b = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "AO-B"}, headers=T).json()["id"]

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (section_a, section_b))

# Section A: 2 students master AP-01.
for sid in ("ao_a1", "ao_a2"):
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section_a, "student_id": sid, "chapter_id": CHAPTER_ID,
        "concept_id": "AP-01", "event_type": "mastery",
    })

# Section B: 1 student masters AP-01, 1 different student struggles on AP-05.
httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
    "classroom_id": section_b, "student_id": "ao_b1", "chapter_id": CHAPTER_ID,
    "concept_id": "AP-01", "event_type": "mastery",
})
httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
    "classroom_id": section_b, "student_id": "ao_b2", "chapter_id": CHAPTER_ID,
    "concept_id": "AP-05", "event_type": "struggle", "error_detail": "overview test",
})

# Expected arithmetic (23 concepts total in this chapter's curriculum graph):
# Pooled across both sections: AP-01 mastered by 3/3 students (100%) -> 1 mastered concept.
#   AP-05 struggled by 1/1 (100% >= 30% threshold) -> 1 bottleneck concept. Other 21 concepts
#   untouched -> in-progress, not mastered. overall_mastery_pct = round(1/23*100, 1) = 4.3
# Section A alone: only AP-01 touched, mastered -> 1/23 = 4.3% ; active_students = 2
# Section B alone: AP-01 mastered + AP-05 hotspot, still only 1 mastered concept /23 = 4.3% ; active_students = 2
# active_students (tenant-wide, this chapter) = 4 distinct students (a1, a2, b1, b2)
# students_needing_intervention = 1 (only ao_b2 currently struggling)
# concepts_flagged = 1 (AP-05)

r = httpx.get(f"{BASE}/api/teacher/analytics/overview", headers=T)
check("overview endpoint responds", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}

check("overall_mastery_pct", data.get("overall_mastery_pct") == 4.3, f"got={data.get('overall_mastery_pct')}")
check("active_students tenant-wide", data.get("active_students") == 4, f"got={data.get('active_students')}")
check("concepts_flagged", data.get("concepts_flagged") == 1, f"got={data.get('concepts_flagged')}")
check("students_needing_intervention", data.get("students_needing_intervention") == 1,
      f"got={data.get('students_needing_intervention')}")

sections_by_id = {s["id"]: s for s in data.get("sections", [])}
check("section A present with correct mastery + active students",
      sections_by_id.get(section_a, {}).get("mastery_pct") == 4.3
      and sections_by_id.get(section_a, {}).get("active_students") == 2,
      f"section_a={sections_by_id.get(section_a)}")
check("section B present with correct mastery + active students",
      sections_by_id.get(section_b, {}).get("mastery_pct") == 4.3
      and sections_by_id.get(section_b, {}).get("active_students") == 2,
      f"section_b={sections_by_id.get(section_b)}")

chapters = data.get("chapters", [])
chapter_row = next((c for c in chapters if c["chapter_id"] == CHAPTER_ID), None)
check("chapter rollup present with correct mastery_pct",
      chapter_row is not None and chapter_row["mastery_pct"] == 4.3, f"chapter_row={chapter_row}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (section_a, section_b))

finish()
