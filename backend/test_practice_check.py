"""Practice Questions answer-check endpoint: student selects an option per question
after generating a set, submits selections, gets correct/incorrect + the correct key
back per question. Stateless like practice_generate (nothing persisted). Requires the
API on :8001 and migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}


def auth(t):
    return {"Authorization": f"Bearer {t}"}


with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email = 'practicechecktest.student@test.dev')")
    conn.execute("DELETE FROM users WHERE email = 'practicechecktest.student@test.dev'")
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeCheckTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeCheckTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'PracticeCheckTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'PracticeCheckTest Tenant'")
    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('PracticeCheckTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                       "VALUES ('PracticeCheckTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'PCheck Student') "
                       "RETURNING id", ("practicechecktest.student@test.dev", hash_password("testpass"))).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')", (uid, tid))

    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'PracticeCheckTest Subject', '10', 909) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'PracticeCheckTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

    # A separate tenant's question -> proves a foreign version_id can't be used to
    # probe another tenant's answer key.
    conn.execute("DELETE FROM subjects WHERE name = 'PracticeCheckTest Other Subject'")
    conn.execute("DELETE FROM tenants WHERE name = 'PracticeCheckTest Other Tenant'")
    otid = conn.execute("INSERT INTO tenants (name, type, status) "
                        "VALUES ('PracticeCheckTest Other Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    osid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                        "VALUES (%s, 'PracticeCheckTest Other Subject', '10', 1) RETURNING id", (otid,)).fetchone()[0]
    ocid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                        "VALUES (%s, 'PracticeCheckTest Other Chapter', 1) RETURNING id", (osid,)).fetchone()[0]

CID, OTHER_CID = str(cid), str(ocid)

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "2+2=?", "marks": 1,
    "options": [{"key": "A", "text": "4", "correct": True}, {"key": "B", "text": "5", "correct": False}],
}, headers=PLAT)
if r.status_code != 201:
    raise RuntimeError(f"fixture question create failed: {r.status_code} {r.text}")
VID = r.json()["version_id"]

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": OTHER_CID, "question_type": "MCQ", "question_text": "3+3=?", "marks": 1,
    "options": [{"key": "A", "text": "6", "correct": True}, {"key": "B", "text": "7", "correct": False}],
}, headers=PLAT)
if r.status_code != 201:
    raise RuntimeError(f"fixture question create failed: {r.status_code} {r.text}")
OTHER_VID = r.json()["version_id"]

TOK = login("practicechecktest.student@test.dev")

# TC1: correct selection -> correct=True, correct_key returned
r = httpx.post(f"{BASE}/api/student/practice/check",
               json={"answers": [{"version_id": VID, "selected_key": "A"}]}, headers=auth(TOK))
ok = r.status_code == 200
results = r.json().get("results", []) if ok else []
ok = ok and len(results) == 1 and results[0]["version_id"] == VID \
    and results[0]["correct"] is True and results[0]["correct_key"] == "A"
check("TC1 correct selection scored true with correct_key", ok, f"{r.status_code} {results}")

# TC2: wrong selection -> correct=False, correct_key still returned
r = httpx.post(f"{BASE}/api/student/practice/check",
               json={"answers": [{"version_id": VID, "selected_key": "B"}]}, headers=auth(TOK))
results = r.json().get("results", []) if r.status_code == 200 else []
ok = r.status_code == 200 and len(results) == 1 and results[0]["correct"] is False and results[0]["correct_key"] == "A"
check("TC2 wrong selection scored false", ok, f"{r.status_code} {results}")

# TC3: cross-tenant version_id is silently dropped, not leaked as a result
r = httpx.post(f"{BASE}/api/student/practice/check",
               json={"answers": [{"version_id": OTHER_VID, "selected_key": "A"}]}, headers=auth(TOK))
results = r.json().get("results", []) if r.status_code == 200 else []
check("TC3 cross-tenant version_id yields no result", r.status_code == 200 and results == [], f"{r.status_code} {results}")

finish()
