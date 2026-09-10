"""Practice Questions ad-hoc generation test runner (Phase 1 of the new
subject/chapter -> count practice flow, drawing from authored_questions rather
than the legacy question_bank). Requires the API on :8000 and migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}


def auth(t):
    return {"Authorization": f"Bearer {t}"}


# --- Idempotent fixture: two self-contained tenants (tier 4 quiz-entitled, tier 1
# not) -- doesn't rely on any other test's seed data. The main subject is scoped to
# the quiz tenant (not tenant_id=NULL/global): a global subject would leak into every
# real tenant's Content Shelf, which is exactly the clutter that kept coming back. ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    pw = hash_password("testpass")

    def make_student(tenant_name, tier, allow_quiz, student_email):
        conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                     "(SELECT id FROM users WHERE email = %s)", (student_email,))
        conn.execute("DELETE FROM users WHERE email = %s", (student_email,))
        conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                     "(SELECT id FROM tenants WHERE name = %s)", (tenant_name,))  # cascades chapters
        conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                     "(SELECT id FROM tenants WHERE name = %s)", (tenant_name,))
        conn.execute("DELETE FROM subscription_plans WHERE name = %s", (f"{tenant_name} Plan",))
        conn.execute("DELETE FROM tenants WHERE name = %s", (tenant_name,))
        tid = conn.execute("INSERT INTO tenants (name, type, status) "
                           "VALUES (%s, 'SCHOOL', 'ACTIVE') RETURNING id", (tenant_name,)).fetchone()[0]
        pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                           "VALUES (%s, %s, true, true, %s) RETURNING id",
                           (f"{tenant_name} Plan", tier, allow_quiz)).fetchone()[0]
        conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                     "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
        uid = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id",
                           (student_email, pw, tenant_name)).fetchone()[0]
        conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
                     (uid, tid))
        return tid

    quiz_tid = make_student("PracticeGenTest Quiz Tenant", 4, True, "practicegentest.quiz@test.dev")
    make_student("PracticeGenTest NoQuiz Tenant", 1, False, "practicegentest.noquiz@test.dev")

    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'PracticeGenTest Subject', '10', 906) RETURNING id", (quiz_tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'PracticeGenTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

    # A separate tenant's chapter to prove cross-tenant access is blocked.
    conn.execute("DELETE FROM subjects WHERE name = 'PracticeGenTest Other Subject'")  # cascades; must precede tenant delete
    conn.execute("DELETE FROM tenants WHERE name = 'PracticeGenTest Other Tenant'")
    otid = conn.execute("INSERT INTO tenants (name, type, status) "
                        "VALUES ('PracticeGenTest Other Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    osid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                        "VALUES (%s, 'PracticeGenTest Other Subject', '10', 1) RETURNING id", (otid,)).fetchone()[0]
    ocid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                        "VALUES (%s, 'PracticeGenTest Other Chapter', 1) RETURNING id", (osid,)).fetchone()[0]

SID, CID, OTHER_CID = str(sid), str(cid), str(ocid)

QIDS = []
for i in range(3):
    r = httpx.post(f"{BASE}/admin/questions", json={
        "chapter_id": CID, "question_type": "MCQ", "question_text": f"Practice Q{i}: 2+{i}=?", "marks": 1,
        "options": [{"key": "A", "text": str(2 + i), "correct": True}, {"key": "B", "text": "99", "correct": False}],
    }, headers=PLAT)
    if r.status_code != 201:
        raise RuntimeError(f"fixture question create failed: {r.status_code} {r.text}")
    QIDS.append(r.json()["question_id"])
httpx.delete(f"{BASE}/admin/questions/{QIDS[2]}", headers=PLAT)  # archive one -> pool of 2 live

TOK3 = login("practicegentest.quiz@test.dev")  # tier 4, allow_quiz
TOK1 = login("practicegentest.noquiz@test.dev")  # tier 1, no quiz access

# TC1: generate fewer than the pool -> exact count, no answer keys leaked
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": SID, "chapter_id": CID, "count": 2}, headers=auth(TOK3))
ok = r.status_code == 200
body = r.json() if ok else {}
qs = body.get("questions", [])
ok = ok and len(qs) == 2 and body["metadata"]["total_requested"] == 2 \
    and body["metadata"]["total_delivered"] == 2 and body["metadata"]["shortfall"] is False \
    and all("correct" not in opt for q in qs for opt in q["options"])
check("TC1 generate 2/2, no correct-answer leakage", ok, f"{r.status_code} {r.text[:300]}")

# TC2: shortfall — pool only has 2 live questions (1 archived), asking for 5 returns 2 + flag
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": SID, "chapter_id": CID, "count": 5}, headers=auth(TOK3))
ok = r.status_code == 200
body = r.json() if ok else {}
ok = ok and body["metadata"]["total_requested"] == 5 and body["metadata"]["total_delivered"] == 2 \
    and body["metadata"]["shortfall"] is True and len(body["questions"]) == 2
check("TC2 shortfall: archived excluded from pool, flagged not padded", ok, f"{r.status_code} {body.get('metadata')}")

# TC3: subject_id that doesn't actually own the chapter -> 404 (IDOR-safe mismatch check)
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": OTHER_CID, "chapter_id": CID, "count": 1}, headers=auth(TOK3))
check("TC3 subject/chapter mismatch -> 404", r.status_code == 404, f"{r.status_code}")

# TC4: chapter belonging to a different tenant -> 404 (not 403; IDOR-safe like guarded_module)
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": "00000000-0000-0000-0000-000000000000", "chapter_id": OTHER_CID, "count": 1},
               headers=auth(TOK3))
check("TC4 cross-tenant chapter -> 404", r.status_code == 404, f"{r.status_code}")

# TC5: tier without quiz access -> 403
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": SID, "chapter_id": CID, "count": 1}, headers=auth(TOK1))
check("TC5 tier without quiz access -> 403", r.status_code == 403, f"{r.status_code}")

finish()
