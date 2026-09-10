"""Question ingestion test runner: bulk-creates DRAFT authored_questions from raw
PDF-extracted records (see the llamaextract pipeline's questions_with_images.json
shape). Requires the API on :8000 and migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login, qa_tenant_id

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: tenant-scoped subject (QA tenant) -> chapter for ingestion tests ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'IngestionTest Subject'")  # cascades
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'IngestionTest Subject', '10', 902) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'IngestionTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
CID = str(cid)

# TC1: bulk ingest — MCQ text parsed via heuristic, plain text falls back to
# SHORT_ANSWER, empty text is skipped rather than creating a junk question.
body = {
    "chapter_id": CID,
    "questions": [
        {"question_no": 1, "text": "The shortest distance of (2,3) from y-axis is "
                                    "(A) 2 (B) 3 (C) 5 (D) 1", "images": []},
        {"question_no": 2, "text": "State Euclid's division lemma.", "images": []},
        {"question_no": 3, "text": "   ", "images": []},
    ],
}
r = httpx.post(f"{BASE}/admin/questions/ingest", json=body, headers=PLAT)
ok = r.status_code == 200
result = r.json() if ok else {}
created = result.get("created", [])
ok = (ok and len(created) == 2 and result.get("skipped_question_numbers") == [3]
      and created[0]["question_type"] == "MCQ" and created[0]["option_count"] == 4
      and created[0]["classification_method"] == "heuristic"
      and created[1]["question_type"] == "SHORT_ANSWER" and created[1]["option_count"] == 0)
check("TC1 bulk ingest: MCQ parsed, plain text fallback, empty skipped", ok, f"{r.status_code} {r.text[:400]}")

# TC2: ingested questions are real DRAFT authored_questions, visible via the bank list
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
ids = {c["question_id"] for c in created}
ok = r.status_code == 200 and {it["question_id"] for it in items} == ids \
     and all(it["status"] == "DRAFT" for it in items)
check("TC2 ingested questions appear as DRAFT in the bank", ok, f"{r.status_code}")

# TC3: cross-tenant ingestion is rejected, same as manual create
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r = httpx.post(f"{BASE}/admin/questions/ingest", json=body, headers=SPR)
check("TC3 cross-tenant ingestion -> 403", r.status_code == 403, f"{r.status_code}")

finish()
