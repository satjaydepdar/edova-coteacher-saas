"""Published mock tests (Create Test page's "Publish" action) test runner.
Requires the API on :8000 and migration 020 applied. Each published question is
pinned to a specific authored_question_versions row, mirroring the immutability
rule from test_authored_questions.py."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login, qa_tenant_id

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: tenant-scoped subject (QA tenant) -> chapter -> two questions ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'TestPublishTest Subject'")  # cascades
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'TestPublishTest Subject', '10', 904) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'TestPublishTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
CID = str(cid)

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "2+2=?", "marks": 1,
    "options": [{"key": "A", "text": "3", "correct": False}, {"key": "B", "text": "4", "correct": True}],
}, headers=PLAT)
V1 = r.json()["version_id"]

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "SHORT_ANSWER", "question_text": "State Euclid's lemma.", "marks": 3,
}, headers=PLAT)
Q2 = r.json()["question_id"]
V2 = r.json()["version_id"]

# TC1: publish a test -> 201, total_marks computed server-side from the pinned marks
body = {
    "chapter_id": CID, "title": "Number Systems Mock Test", "timer_minutes": 60,
    "questions": [{"version_id": V1, "marks": 1}, {"version_id": V2, "marks": 3}],
}
r = httpx.post(f"{BASE}/admin/tests", json=body, headers=PLAT)
ok = r.status_code == 201
data = r.json() if ok else {}
ok = ok and data.get("total_marks") == 4 and data.get("question_count") == 2 and "test_id" in data
check("TC1 publish test -> 201, total_marks summed server-side", ok, f"{r.status_code} {r.text[:200]}")
TEST_ID = data.get("test_id")

# TC2: fetch the published test -> full question content, in the order submitted
r = httpx.get(f"{BASE}/admin/tests/{TEST_ID}", headers=PLAT)
ok = r.status_code == 200
detail = r.json() if ok else {}
qs = detail.get("questions", [])
ok = ok and detail.get("title") == "Number Systems Mock Test" and detail.get("timer_minutes") == 60 \
    and len(qs) == 2 and qs[0]["question_text"] == "2+2=?" and qs[0]["marks"] == 1 \
    and qs[1]["question_text"] == "State Euclid's lemma." and qs[1]["marks"] == 3
check("TC2 fetch published test -> full ordered question content", ok, f"{r.status_code} {r.text[:400]}")

# TC3: editing question 2 after publishing must NOT change the already-published test
# (it's pinned to the version, not the live question) — same guarantee as authored_questions.
httpx.patch(f"{BASE}/admin/questions/{Q2}", json={"question_text": "State Euclid's division lemma. (revised)"}, headers=PLAT)
r = httpx.get(f"{BASE}/admin/tests/{TEST_ID}", headers=PLAT)
qs = r.json().get("questions", []) if r.status_code == 200 else []
ok = r.status_code == 200 and qs[1]["question_text"] == "State Euclid's lemma."
check("TC3 published test is pinned to the version, unaffected by later edits", ok, f"{r.status_code}")

# TC4: list tests for the chapter -> the published test appears with a summary shape
r = httpx.get(f"{BASE}/admin/tests", params={"chapter_id": CID}, headers=PLAT)
ok = r.status_code == 200
items = r.json().get("tests", []) if ok else []
match = next((t for t in items if t["test_id"] == TEST_ID), None)
ok = ok and match is not None and match["title"] == "Number Systems Mock Test" \
    and match["total_marks"] == 4 and match["question_count"] == 2
check("TC4 list tests for chapter includes the published test", ok, f"{r.status_code} {items}")

# TC5: a version_id from a different chapter is rejected (can't publish mismatched content)
OTHER_SUBJECT = None
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'TestPublishTest Other Subject'")
    osid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                        "VALUES (%s, 'TestPublishTest Other Subject', '10', 905) RETURNING id", (tid,)).fetchone()[0]
    ocid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                        "VALUES (%s, 'TestPublishTest Other Chapter', 1) RETURNING id", (osid,)).fetchone()[0]
r = httpx.post(f"{BASE}/admin/tests", json={
    "chapter_id": str(ocid), "title": "Mismatched", "timer_minutes": 30,
    "questions": [{"version_id": V1, "marks": 1}],
}, headers=PLAT)
check("TC5 version from another chapter -> 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")

# TC6: cross-tenant publish is rejected
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r = httpx.post(f"{BASE}/admin/tests", json=body, headers=SPR)
check("TC6 cross-tenant publish -> 403", r.status_code == 403, f"{r.status_code}")

finish()
