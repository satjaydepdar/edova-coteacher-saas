"""Practice Questions' own chapter-list endpoint -- independent of Content Shelf's
subject_tree(), which is scoped to published modules only. A chapter with a live
question bank but zero modules must appear here (and must NOT need to appear in
Content Shelf at all). Requires the API on :8001 and migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email = 'practicechapterstest.student@test.dev')")
    conn.execute("DELETE FROM users WHERE email = 'practicechapterstest.student@test.dev'")
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeChaptersTest Tenant')")  # cascades chapters
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeChaptersTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'PracticeChaptersTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'PracticeChaptersTest Tenant'")
    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('PracticeChaptersTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                       "VALUES ('PracticeChaptersTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'PC Student') "
                       "RETURNING id", ("practicechapterstest.student@test.dev", hash_password("testpass"))).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')", (uid, tid))

    # Subject scoped to this dedicated tenant, not tenant_id=NULL/global -- a global
    # subject would leak into every real tenant's Content Shelf.
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'PracticeChaptersTest Subject', '10', 908) RETURNING id", (tid,)).fetchone()[0]
    # Chapter A: has a live question, zero modules -> must appear here.
    cid_a = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                         "VALUES (%s, 'Has Questions', 1) RETURNING id", (sid,)).fetchone()[0]
    # Chapter B: no questions at all -> must NOT appear here.
    cid_b = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                         "VALUES (%s, 'No Questions', 2) RETURNING id", (sid,)).fetchone()[0]
SID, CID_A, CID_B = str(sid), str(cid_a), str(cid_b)

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID_A, "question_type": "SHORT_ANSWER", "question_text": "Placeholder", "marks": 1,
}, headers=PLAT)
if r.status_code != 201:
    raise RuntimeError(f"fixture question create failed: {r.status_code} {r.text}")

TOK = login("practicechapterstest.student@test.dev")

# TC1: only the question-bearing chapter appears; the empty one doesn't.
r = httpx.get(f"{BASE}/api/student/practice/chapters", params={"subject_id": SID},
              headers={"Authorization": f"Bearer {TOK}"})
ok = r.status_code == 200
names = {c["chapter_id"]: c["chapter_name"] for c in r.json().get("chapters", [])} if ok else {}
ok = ok and CID_A in names and CID_B not in names
check("TC1 only question-bearing chapter listed", ok, f"{r.status_code} {names}")

# TC2: cross-tenant subject -> 404
r = httpx.get(f"{BASE}/api/student/practice/chapters", params={"subject_id": "00000000-0000-0000-0000-000000000000"},
              headers={"Authorization": f"Bearer {TOK}"})
check("TC2 unknown subject -> 404", r.status_code == 404, f"{r.status_code}")

finish()
