"""Rich-text fields on authored questions (migration 026): passage + explanation,
plus server-side HTML sanitization applied to question_text/options/passage/
explanation on every write. Requires the API on :8001 and migration 026 applied."""
import httpx
import psycopg
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}


def auth(t):
    return {"Authorization": f"Bearer {t}"}


with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email = 'richtexttest.student@test.dev')")
    conn.execute("DELETE FROM users WHERE email = 'richtexttest.student@test.dev'")
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'RichTextTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'RichTextTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'RichTextTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'RichTextTest Tenant'")
    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('RichTextTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                       "VALUES ('RichTextTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute("INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'RichText Student') "
                       "RETURNING id", ("richtexttest.student@test.dev", hash_password("testpass"))).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')", (uid, tid))

    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'RichTextTest Subject', '10', 910) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'RichTextTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

SID, CID = str(sid), str(cid)
STUDENT_TOK = login("richtexttest.student@test.dev")

# TC1: create with passage + explanation -> both persisted and returned by list
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "CASE_STUDY", "question_text": "<p>What is <strong>x</strong>?</p>",
    "marks": 2, "passage": "<p>A long comprehension passage.</p>", "explanation": "<p>Because algebra.</p>",
    "options": [{"key": "A", "text": "<em>2</em>", "correct": True}, {"key": "B", "text": "3", "correct": False}],
}, headers=PLAT)
ok = r.status_code == 201
data = r.json() if ok else {}
QID = data.get("question_id")
check("TC1 create with passage+explanation -> 201", ok, f"{r.status_code} {r.text[:200]}")

r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = match is not None and match["passage"] == "<p>A long comprehension passage.</p>" \
    and match["explanation"] == "<p>Because algebra.</p>" \
    and match["question_text"] == "<p>What is <strong>x</strong>?</p>" \
    and next(o["text"] for o in match["options"] if o["key"] == "A") == "<em>2</em>"
check("TC2 list returns passage/explanation/formatted text+options intact", ok, f"{match}")

# TC3: allowed math-node markup survives sanitization untouched
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "marks": 1,
    "question_text": '<p>Solve <span class="qmath" data-latex="x^2+1=0"></span></p>',
    "options": [{"key": "A", "text": "ok", "correct": True}],
}, headers=PLAT)
qid2 = r.json().get("question_id") if r.status_code == 201 else None
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match2 = next((it for it in items if it.get("question_id") == qid2), None)
ok = match2 is not None and match2["question_text"] == '<p>Solve <span class="qmath" data-latex="x^2+1=0"></span></p>'
check("TC3 math-node span survives sanitization", ok, f"{match2}")

# TC4: disallowed/malicious markup is stripped on create -- question_text, option text,
# passage, and explanation are all sanitized, not just question_text.
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "marks": 1,
    "question_text": '<p onclick="evil()">Q<script>alert(1)</script></p>',
    "passage": '<img src=x onerror="alert(2)"><p>Passage</p>',
    "explanation": '<a href="javascript:alert(3)">click</a><p>Explains</p>',
    "options": [{"key": "A", "text": '<script>alert(4)</script>Opt A', "correct": True}],
}, headers=PLAT)
ok = r.status_code == 201
qid3 = r.json().get("question_id") if ok else None
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match3 = next((it for it in items if it.get("question_id") == qid3), None)
ok = match3 is not None \
    and "<script>" not in match3["question_text"] and "onclick" not in match3["question_text"] \
    and "onerror" not in match3["passage"] \
    and "javascript:" not in match3["explanation"] \
    and "<script>" not in next(o["text"] for o in match3["options"] if o["key"] == "A")
check("TC4 script/event-handler/javascript-uri markup stripped everywhere", ok, f"{match3}")

# TC5: editing updates passage/explanation on the new version without touching version 1
r = httpx.patch(f"{BASE}/admin/questions/{QID}",
                 json={"explanation": "<p>Updated explanation.</p>"}, headers=PLAT)
ok = r.status_code == 200
r2 = httpx.get(f"{BASE}/admin/questions/{QID}/versions", headers=PLAT)
versions = {v["version_no"]: v for v in r2.json().get("versions", [])} if r2.status_code == 200 else {}
ok = ok and versions.get(1, {}).get("explanation") == "<p>Because algebra.</p>" \
    and versions.get(2, {}).get("explanation") == "<p>Updated explanation.</p>" \
    and versions.get(2, {}).get("passage") == "<p>A long comprehension passage.</p>"  # untouched field carries forward
check("TC5 edit updates explanation on new version, carries passage forward, v1 unchanged", ok,
      f"{r.status_code} {versions}")

# TC6: practice_generate includes passage (needed to render the question) but never
# explanation (would leak reasoning before the student answers).
r = httpx.post(f"{BASE}/api/student/practice/generate",
               json={"subject_id": SID, "chapter_id": CID, "count": 3}, headers=auth(STUDENT_TOK))
ok = r.status_code == 200
qs = r.json().get("questions", []) if ok else []
gen_match = next((x for x in qs if x["version_id"] == versions.get(2, {}).get("version_id")), None)
ok = ok and gen_match is not None and gen_match.get("passage") == "<p>A long comprehension passage.</p>" \
    and "explanation" not in gen_match
check("TC6 practice_generate exposes passage, withholds explanation", ok, f"{r.status_code} {gen_match}")

# TC7: practice_check reveals explanation only after the student answers
vid2 = versions.get(2, {}).get("version_id")
r = httpx.post(f"{BASE}/api/student/practice/check",
               json={"answers": [{"version_id": vid2, "selected_key": "A"}]}, headers=auth(STUDENT_TOK))
ok = r.status_code == 200
results = r.json().get("results", []) if ok else []
ok = ok and len(results) == 1 and results[0]["explanation"] == "<p>Updated explanation.</p>"
check("TC7 practice_check reveals explanation post-answer", ok, f"{r.status_code} {results}")

finish()
