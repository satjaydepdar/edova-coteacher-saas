"""Proves a real section_id (from the sections table) works as classroom_id in the
existing teacher-analytics telemetry/heatmap endpoints, with zero changes to
teacher_analytics.py -- classroom_id was always a generic string key."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionsAnalyticsTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionsAnalyticsTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SectionsAnalyticsTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'SectionsAnalyticsTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'SectionsAnalyticsTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'sectionsanalyticstest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('SectionsAnalyticsTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('SectionsAnalyticsTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute(
        "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
        "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid)
    )
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SA Teacher') RETURNING id",
        ("sectionsanalyticstest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                 (uid, tid))

T = {"Authorization": f"Bearer {login('sectionsanalyticstest.teacher@test.dev')}"}

# Create a real section through the Step 3 endpoint -- this is the id we'll use as classroom_id.
r = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "9-Z"}, headers=T)
check("section created for integration test", r.status_code == 201, f"status={r.status_code} body={r.text}")
section_id = r.json()["id"]

CHAPTER_ID = "chapter-05-arithmetic-progressions"  # same fixture chapter test_teacher_analytics.py uses

# 3 students master AP-01 under this section_id used AS classroom_id
for i in range(1, 4):
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section_id, "student_id": f"sa_student_{i}", "student_name": f"SA Student {i}",
        "chapter_id": CHAPTER_ID, "concept_id": "AP-01", "event_type": "mastery",
    })

# 2 students struggle with AP-05 under the same section_id
for i in range(1, 3):
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section_id, "student_id": f"sa_student_{i}", "student_name": f"SA Student {i}",
        "chapter_id": CHAPTER_ID, "concept_id": "AP-05", "event_type": "struggle",
        "error_detail": "integration test error",
    })

r = httpx.get(f"{BASE}/api/teacher/classroom/{section_id}/heatmap/{CHAPTER_ID}")
ok = r.status_code == 200
check("heatmap fetched by real section_id as classroom_id", ok, f"status={r.status_code} body={r.text}")
data = r.json() if ok else {}

check("classroom_id round-trips as the section_id", data.get("classroom_id") == section_id,
      f"classroom_id={data.get('classroom_id')}")

ap01 = next((c for c in data.get("concept_heatmaps", []) if c["concept_id"] == "AP-01"), None)
check("AP-01 mastered_count reflects this section only", ap01 is not None and ap01["mastered_count"] == 3,
      f"ap01={ap01}")

ap05 = next((c for c in data.get("concept_heatmaps", []) if c["concept_id"] == "AP-05"), None)
check("AP-05 is a struggling hotspot for this section", ap05 is not None and ap05["status"] == "struggling-hotspot",
      f"ap05={ap05}")

check("bottleneck alert raised for AP-05 under this section_id",
      any(a["concept_id"] == "AP-05" for a in data.get("bottleneck_alerts", [])),
      f"bottleneck_alerts={data.get('bottleneck_alerts')}")

# classroom_name should show the real section name, not a mangled UUID
check("classroom_name shows the real section name", data.get("classroom_name") == "9-Z",
      f"classroom_name={data.get('classroom_name')!r}")

# backward compatibility: a non-UUID classroom_id (old-style slug) still falls back
# to the title-cased display name -- no regression for callers not using real sections.
SLUG = "demo-class-10a"
r = httpx.get(f"{BASE}/api/teacher/classroom/{SLUG}/heatmap/{CHAPTER_ID}")
expected = SLUG.replace("-", " ").title()
check("non-section classroom_id falls back to slug title-casing",
      r.status_code == 200 and r.json().get("classroom_name") == expected,
      f"status={r.status_code} classroom_name={r.json().get('classroom_name') if r.status_code == 200 else None!r} expected={expected!r}")

finish()
