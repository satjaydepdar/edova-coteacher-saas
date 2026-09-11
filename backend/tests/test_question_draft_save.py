"""Authoring Studio 'Save As Draft' button: POST /admin/questions with
save_as_draft=true skips the question_text-required check so an incomplete
question can be saved mid-authoring; the normal 'Add to Bank' path (flag
omitted/false) keeps rejecting empty text as before. Every created question
is already status=DRAFT regardless of this flag (migration_018 default) --
the flag only relaxes validation, it doesn't change status."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'DraftSaveTest Tenant')")
    conn.execute("DELETE FROM tenants WHERE name = 'DraftSaveTest Tenant'")
    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('DraftSaveTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'DraftSaveTest Subject', '10', 911) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'DraftSaveTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

CID = str(cid)

# TC1: empty question_text without the flag -> still 422 (existing "Add to Bank" behavior)
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "",
}, headers=PLAT)
check("TC1 empty text, no flag -> 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")

# TC2: empty question_text WITH save_as_draft=true -> 201, status DRAFT
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "", "save_as_draft": True,
}, headers=PLAT)
ok = r.status_code == 201 and r.json().get("status") == "DRAFT"
QID = r.json().get("question_id") if ok else None
check("TC2 empty text + save_as_draft -> 201 DRAFT", ok, f"{r.status_code} {r.text[:200]}")

# TC3: the saved draft shows up in the bank list with its (empty) text intact
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = match is not None and match["status"] == "DRAFT" and match["question_text"] == ""
check("TC3 draft appears in bank list as DRAFT", ok, f"{match}")

# TC4: a draft can later be completed via the normal PATCH edit path (no flag needed there --
# edit_authored_question never required non-empty text to begin with).
r = httpx.patch(f"{BASE}/admin/questions/{QID}", json={"question_text": "<p>Now complete</p>"}, headers=PLAT)
ok = r.status_code == 200
r2 = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items2 = r2.json().get("questions", []) if r2.status_code == 200 else []
match2 = next((it for it in items2 if it.get("question_id") == QID), None)
ok = ok and match2 is not None and match2["question_text"] == "<p>Now complete</p>"
check("TC4 draft completed via PATCH", ok, f"{match2}")

finish()
