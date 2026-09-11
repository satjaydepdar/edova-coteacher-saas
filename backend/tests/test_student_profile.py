"""GET /api/teacher/analytics/student/{student_id}: Level-3 per-student rollup, honest
about what the mastery_events model can actually say -- status is mastered/struggling/
attempted per concept (binary, from event_type), not a fabricated per-topic percentage.
Only counts events under sections belonging to the caller's own tenant (isolation)."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

CHAPTER_ID = "chapter-05-arithmetic-progressions"  # 23 concepts total
STUDENT_ID = "l3_student_1"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentProfileTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentProfileTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentProfileTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'StudentProfileTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'StudentProfileTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'studentprofiletest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('StudentProfileTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('StudentProfileTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'L3 Teacher') RETURNING id",
        ("studentprofiletest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

T = {"Authorization": f"Bearer {login('studentprofiletest.teacher@test.dev')}"}

section_id = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "L3-A"}, headers=T).json()["id"]
OUTSIDE_CLASSROOM_ID = "outside-tenant-classroom-l3"  # not one of this tenant's sections

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (section_id, OUTSIDE_CLASSROOM_ID))


def record(classroom_id, concept_id, event_type, error_detail=None):
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": classroom_id, "student_id": STUDENT_ID, "chapter_id": CHAPTER_ID,
        "concept_id": concept_id, "event_type": event_type,
        **({"error_detail": error_detail} if error_detail else {}),
    })


record(section_id, "AP-01", "mastery")                                    # mastered, 1 attempt
record(section_id, "AP-02", "struggle", "confuses term value and position")  # struggling, 1 attempt
record(section_id, "AP-03", "attempt")                                     # attempted only
record(section_id, "AP-03", "attempt")                                     # 2nd attempt, same concept
record(section_id, "AP-05", "struggle", "old error")                       # struggle then...
record(section_id, "AP-05", "mastery")                                     # ...mastery -> latest status wins: mastered, 2 attempts

# Events under a classroom_id NOT belonging to this tenant's sections -- must be excluded.
record(OUTSIDE_CLASSROOM_ID, "AP-10", "mastery")

r = httpx.get(f"{BASE}/api/teacher/analytics/student/{STUDENT_ID}", headers=T)
check("student profile endpoint responds", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}

check("mastery_pct = 2 mastered / 23 curriculum concepts", data.get("mastery_pct") == 8.7,
      f"got={data.get('mastery_pct')}")
check("concepts_stuck counts only currently-struggling", data.get("concepts_stuck") == 1,
      f"got={data.get('concepts_stuck')}")

topics_by_concept = {t["concept_id"]: t for t in data.get("topics", [])}
check("exactly 4 topics from this tenant (AP-10 excluded)", set(topics_by_concept.keys()) == {"AP-01", "AP-02", "AP-03", "AP-05"},
      f"got={sorted(topics_by_concept.keys())}")

check("AP-01 mastered, 1 attempt", topics_by_concept.get("AP-01", {}).get("status") == "mastered"
      and topics_by_concept["AP-01"]["attempts_count"] == 1, f"AP-01={topics_by_concept.get('AP-01')}")
check("AP-02 struggling with error detail", topics_by_concept.get("AP-02", {}).get("status") == "struggling"
      and topics_by_concept["AP-02"]["last_error_detail"] == "confuses term value and position",
      f"AP-02={topics_by_concept.get('AP-02')}")
check("AP-03 attempted only, 2 attempts", topics_by_concept.get("AP-03", {}).get("status") == "attempted"
      and topics_by_concept["AP-03"]["attempts_count"] == 2, f"AP-03={topics_by_concept.get('AP-03')}")
check("AP-05 latest-status-wins -> mastered despite earlier struggle", topics_by_concept.get("AP-05", {}).get("status") == "mastered"
      and topics_by_concept["AP-05"]["attempts_count"] == 2, f"AP-05={topics_by_concept.get('AP-05')}")

strengths = {t["concept_id"] for t in data.get("strengths", [])}
struggling = {t["concept_id"] for t in data.get("struggling", [])}
check("strengths = AP-01, AP-05", strengths == {"AP-01", "AP-05"}, f"strengths={strengths}")
check("struggling = AP-02 only", struggling == {"AP-02"}, f"struggling={struggling}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (section_id, OUTSIDE_CLASSROOM_ID))

finish()
