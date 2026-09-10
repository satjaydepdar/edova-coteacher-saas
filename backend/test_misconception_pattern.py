"""misconception_pattern on GET /api/teacher/analytics/student/{student_id}: only
attempted with >=2 struggling topics that have an error_detail (cost control -- no
LLM call otherwise), and the LLM is allowed to honestly find no pattern, so exact
wording is never asserted, only presence/shape. Requires a live GEMINI_API_KEY."""

import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

CHAPTER_ID = "chapter-05-arithmetic-progressions"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'MisconceptionPatternTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'MisconceptionPatternTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'MisconceptionPatternTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'MisconceptionPatternTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'MisconceptionPatternTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'misconceptionpatterntest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('MisconceptionPatternTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('MisconceptionPatternTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'MP Teacher') RETURNING id",
        ("misconceptionpatterntest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

T = {"Authorization": f"Bearer {login('misconceptionpatterntest.teacher@test.dev')}"}
section_id = httpx.post(f"{BASE}/api/teacher/sections", json={"name": "MP-A"}, headers=T).json()["id"]


def record(student_id, concept_id, error_detail):
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section_id, "student_id": student_id, "chapter_id": CHAPTER_ID,
        "concept_id": concept_id, "event_type": "struggle", "error_detail": error_detail,
    })


with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

# TC1: only 1 struggling topic with an error_detail -- below the clustering threshold.
record("mp_student_one", "AP-01", "Confused the term's position number with its value")
r1 = httpx.get(f"{BASE}/api/teacher/analytics/student/mp_student_one", headers=T)
check("single struggling topic -> no pattern, no LLM call attempted", r1.status_code == 200
      and r1.json().get("misconception_pattern") is None,
      f"status={r1.status_code} pattern={r1.json().get('misconception_pattern') if r1.status_code == 200 else None}")

# TC2: 2 struggling topics sharing an obvious underlying mistake (sign error, subtracting
# backwards) across two differently-named concepts -- a real Gemini call should find this.
record("mp_student_two", "AP-05", "Subtracted a1 - a2 instead of a2 - a1, got the sign of d backwards")
record("mp_student_two", "AP-11", "Moved terms across the equals sign with the wrong sign, "
                                   "same backwards-subtraction habit as the common difference mistake")
r2 = httpx.get(f"{BASE}/api/teacher/analytics/student/mp_student_two", headers=T, timeout=30.0)
check("endpoint responds for the 2-topic case", r2.status_code == 200, f"status={r2.status_code} body={r2.text}")
pattern = r2.json().get("misconception_pattern") if r2.status_code == 200 else None
check("misconception_pattern is a non-empty string when a real shared mistake exists",
      isinstance(pattern, str) and len(pattern) > 10, f"pattern={pattern!r}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

finish()
