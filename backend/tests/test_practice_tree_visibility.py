"""Locks in the Content Shelf / Practice Questions split: subject_tree() (Content
Shelf) must show chapters with published modules ONLY -- a chapter whose sole
content is a live question bank must NOT appear here, even though it correctly
appears in GET /api/student/practice/chapters (see test_practice_chapters.py).
These two endpoints must never share a visibility rule again. Requires the API on
:8001 and migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, qa_tenant_id

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'TreeVisTest Subject'")  # cascades
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'TreeVisTest Subject', '10', 907) RETURNING id", (tid,)).fetchone()[0]
    # Chapter with only questions, zero modules -> must stay hidden from Content Shelf.
    cid_a = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                         "VALUES (%s, 'TreeVisTest Chapter With Questions', 1) RETURNING id", (sid,)).fetchone()[0]
    # Chapter with nothing at all -> must also stay hidden (unchanged "empty shell" rule).
    cid_b = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                         "VALUES (%s, 'TreeVisTest Empty Chapter', 2) RETURNING id", (sid,)).fetchone()[0]

    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email = 'treevistest.student@test.dev')")
    conn.execute("DELETE FROM users WHERE email = 'treevistest.student@test.dev'")
    uid = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'TreeVis Student') "
                       "RETURNING id", ("treevistest.student@test.dev", hash_password("testpass"))).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')", (uid, tid))

    # This tenant needs its own quiz-entitled subscription (qa_tenant_id() doesn't set one up).
    conn.execute("DELETE FROM subscriptions WHERE tenant_id = %s", (tid,))
    pid = conn.execute("SELECT id FROM subscription_plans WHERE name = 'TreeVisTest Plan'").fetchone()
    pid = pid[0] if pid else conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('TreeVisTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
SID, CID_A, CID_B = str(sid), str(cid_a), str(cid_b)

admin_tok = httpx.post(f"{BASE}/auth/login", json={"email": "admin@edova.dev", "password": "testpass"}).json()["access_token"]
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID_A, "question_type": "SHORT_ANSWER", "question_text": "Placeholder", "marks": 1,
}, headers={"Authorization": f"Bearer {admin_tok}"})
if r.status_code != 201:
    raise RuntimeError(f"fixture question create failed: {r.status_code} {r.text}")

student_tok = httpx.post(f"{BASE}/auth/login", json={"email": "treevistest.student@test.dev", "password": "testpass"}).json()["access_token"]

r = httpx.get(f"{BASE}/api/student/content/subjects/{SID}/tree", headers={"Authorization": f"Bearer {student_tok}"})
ok = r.status_code == 200
names = {c["chapter_id"] for c in r.json().get("chapters", [])} if ok else set()
ok = ok and CID_A not in names and CID_B not in names
check("subject_tree() shows neither chapter: no modules on either, question bank irrelevant here", ok, f"{r.status_code} {names}")

finish()
