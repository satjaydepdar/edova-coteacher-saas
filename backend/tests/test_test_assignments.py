"""Test assignments (migration 028, Feature B Phase 1): which section(s) a
published test is visible to, for what window, and student-facing access to its
content (correct answers stripped). Requires the API on :8001 and migration 028
applied."""
import httpx
import psycopg
from datetime import datetime, timedelta, timezone
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}


def auth(t):
    return {"Authorization": f"Bearer {t}"}


def iso(dt):
    return dt.isoformat()


now = datetime.now(timezone.utc)

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email LIKE 'testassigntest.%')")
    conn.execute("DELETE FROM users WHERE email LIKE 'testassigntest.%'")
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'TestAssignTest Tenant')")
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'TestAssignTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'TestAssignTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'TestAssignTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'TestAssignTest Tenant'")

    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('TestAssignTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                       "VALUES ('TestAssignTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))

    sec_a = conn.execute("INSERT INTO sections (tenant_id, name) VALUES (%s, '9-A') RETURNING id", (tid,)).fetchone()[0]
    sec_b = conn.execute("INSERT INTO sections (tenant_id, name) VALUES (%s, '9-B') RETURNING id", (tid,)).fetchone()[0]

    pw = hash_password("testpass")
    uid_a = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES "
                        "('testassigntest.studentA@test.dev', %s, 'Student A') RETURNING id", (pw,)).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role, section_id) VALUES (%s, %s, 'STUDENT', %s)",
                 (uid_a, tid, sec_a))
    uid_b = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES "
                        "('testassigntest.studentB@test.dev', %s, 'Student B') RETURNING id", (pw,)).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role, section_id) VALUES (%s, %s, 'STUDENT', %s)",
                 (uid_b, tid, sec_b))

    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'TestAssignTest Subject', '9', 940) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'TestAssignTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

TID, SEC_A, SEC_B, CID = str(tid), str(sec_a), str(sec_b), str(cid)
TOK_A = login("testassigntest.studentA@test.dev")
TOK_B = login("testassigntest.studentB@test.dev")

# One authored question with a passage, to build tests from and check content shape.
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "CASE_STUDY", "question_text": "<p>What is d?</p>",
    "passage": "<p>A short passage.</p>", "marks": 2,
    "options": [{"key": "A", "text": "2", "correct": True}, {"key": "B", "text": "3", "correct": False}],
}, headers=PLAT)
VID = r.json()["version_id"]


def publish(title, assignments):
    r = httpx.post(f"{BASE}/admin/tests", json={
        "chapter_id": CID, "title": title, "timer_minutes": 30,
        "questions": [{"version_id": VID, "marks": 2}],
        "assignments": assignments,
    }, headers=PLAT)
    if r.status_code != 201:
        raise RuntimeError(f"fixture test publish failed: {r.status_code} {r.text}")
    return r.json()["test_id"]


TEST_A = publish("Section-only Test", [{"section_id": SEC_A, "opens_at": iso(now - timedelta(hours=1)), "closes_at": iso(now + timedelta(days=2))}])
TEST_B = publish("Tenant-wide Test", [{"section_id": None, "opens_at": iso(now - timedelta(hours=1)), "closes_at": iso(now + timedelta(days=2))}])
TEST_C = publish("Upcoming Test", [{"section_id": SEC_A, "opens_at": iso(now + timedelta(days=1)), "closes_at": iso(now + timedelta(days=3))}])
TEST_D = publish("Closed Test", [{"section_id": SEC_A, "opens_at": iso(now - timedelta(days=5)), "closes_at": iso(now - timedelta(days=1))}])

# TC1: student in section 9-A sees all 4 (section-specific ones + the tenant-wide one), correctly statused
r = httpx.get(f"{BASE}/api/student/tests", headers=auth(TOK_A))
ok = r.status_code == 200
by_id = {t["test_id"]: t for t in r.json().get("tests", [])} if ok else {}
ok = ok and set([TEST_A, TEST_B, TEST_C, TEST_D]) <= set(by_id.keys())
ok = ok and by_id[TEST_A]["status"] == "OPEN" and by_id[TEST_B]["status"] == "OPEN" \
    and by_id[TEST_C]["status"] == "UPCOMING" and by_id[TEST_D]["status"] == "CLOSED"
check("TC1 section-9A student sees section + tenant-wide tests, correctly statused", ok, f"{r.status_code} {by_id}")

# TC2: student in section 9-B sees ONLY the tenant-wide test, not the 9-A-specific ones
r = httpx.get(f"{BASE}/api/student/tests", headers=auth(TOK_B))
ids = {t["test_id"] for t in r.json().get("tests", [])} if r.status_code == 200 else set()
ok = TEST_B in ids and TEST_A not in ids and TEST_C not in ids and TEST_D not in ids
check("TC2 section-9B student sees only the tenant-wide test", ok, f"{r.status_code} {ids}")

# TC3: an unsectioned caller (device-token stand-in -- same code path as no section_id)
# behaves like TC2: tenant-wide visible, section-specific not.
uid_c = None
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    uid_c = conn.execute("SELECT id FROM users WHERE email = 'testassigntest.studentC@test.dev'").fetchone()
    if uid_c is None:
        pw = hash_password("testpass")
        uid_c = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES "
                            "('testassigntest.studentC@test.dev', %s, 'Student C') RETURNING id", (pw,)).fetchone()[0]
        conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role, section_id) VALUES (%s, %s, 'STUDENT', NULL)",
                     (uid_c, tid))
    else:
        uid_c = uid_c[0]
TOK_C = login("testassigntest.studentC@test.dev")
r = httpx.get(f"{BASE}/api/student/tests", headers=auth(TOK_C))
ids = {t["test_id"] for t in r.json().get("tests", [])} if r.status_code == 200 else set()
ok = TEST_B in ids and TEST_A not in ids
check("TC3 unsectioned student sees only the tenant-wide test", ok, f"{r.status_code} {ids}")

# TC4: content fetch for an OPEN test -- correct flag stripped, passage included, no explanation
r = httpx.get(f"{BASE}/api/student/tests/{TEST_A}", headers=auth(TOK_A))
ok = r.status_code == 200
body = r.json() if ok else {}
qs = body.get("questions", [])
ok = ok and len(qs) == 1 and qs[0]["passage"] == "<p>A short passage.</p>" \
    and all("correct" not in o for o in qs[0]["options"]) and "explanation" not in qs[0]
check("TC4 open test content: passage included, correct/explanation withheld", ok, f"{r.status_code} {body}")

# TC5: content fetch for an UPCOMING test -> 403 (would leak questions before the window opens)
r = httpx.get(f"{BASE}/api/student/tests/{TEST_C}", headers=auth(TOK_A))
check("TC5 upcoming test content -> 403", r.status_code == 403, f"{r.status_code}")

# TC6: content fetch for a test not assigned to this caller at all -> 404 (IDOR-safe)
r = httpx.get(f"{BASE}/api/student/tests/{TEST_A}", headers=auth(TOK_B))
check("TC6 unassigned test content -> 404", r.status_code == 404, f"{r.status_code}")

# TC7: a CLOSED test's content is still fetchable (stays downloadable after the window closes)
r = httpx.get(f"{BASE}/api/student/tests/{TEST_D}", headers=auth(TOK_A))
check("TC7 closed test content still fetchable -> 200", r.status_code == 200, f"{r.status_code}")

finish()
