"""suggested_next_steps on GET /api/teacher/analytics/student/{student_id}: top 2
struggling topics, ranked by attempts_count (most attempts = most urgent), each with
the concept's real curriculum-authored guiding question -- no LLM call, deterministic,
reuses the exact same hermes_guiding_question field the Level-2 bottleneck alerts
already use (teacher_analytics.py), just at the per-student grain."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

CHAPTER_ID = "chapter-05-arithmetic-progressions"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SuggestedNextStepsTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SuggestedNextStepsTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SuggestedNextStepsTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'SuggestedNextStepsTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'SuggestedNextStepsTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'suggestednextstepstest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('SuggestedNextStepsTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('SuggestedNextStepsTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'NS Teacher') RETURNING id",
        ("suggestednextstepstest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

T = {"Authorization": f"Bearer {login('suggestednextstepstest.teacher@test.dev')}"}
section_id = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "NS-A"}, headers=T).json()["id"]

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))


def struggle(concept_id, times):
    for _ in range(times):
        httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
            "classroom_id": section_id, "student_id": "ns_student_1", "chapter_id": CHAPTER_ID,
            "concept_id": concept_id, "event_type": "struggle", "error_detail": f"stuck on {concept_id}",
        })


struggle("AP-05", 3)   # most attempts -> most urgent, should rank #1
struggle("AP-11", 2)   # #2
struggle("AP-02", 1)   # 3rd struggling concept -- should be EXCLUDED (only top 2 returned)

r = httpx.get(f"{BASE}/api/teacher/analytics/student/ns_student_1", headers=T, timeout=30.0)
check("endpoint responds", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}
steps = data.get("suggested_next_steps", [])

check("exactly 2 suggested next steps (top-2 cap)", len(steps) == 2, f"got={len(steps)} steps={steps}")
check("ranked by attempts_count descending: AP-05 (3) then AP-11 (2)",
      [s.get("concept_id") for s in steps] == ["AP-05", "AP-11"],
      f"got={[s.get('concept_id') for s in steps]}")
check("AP-02 (only 1 attempt) excluded from top-2", "AP-02" not in [s.get("concept_id") for s in steps],
      f"steps={steps}")
check("each step carries a non-empty action from the real curriculum guidance",
      all(isinstance(s.get("action"), str) and len(s["action"]) > 5 for s in steps), f"steps={steps}")
check("each step reports its own attempts_count", steps[0].get("attempts_count") == 3
      and steps[1].get("attempts_count") == 2, f"steps={steps}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

finish()
