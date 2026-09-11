"""Authored Questions test runner: versioned Question Bank (Authoring Studio) on
top of the legacy flat question_bank table. Requires the API on :8000 and
migration 018 applied."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login, qa_tenant_id

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: tenant-scoped subject (QA tenant, not global) -> chapter ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'AuthoringTest Subject'")  # cascades
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'AuthoringTest Subject', '10', 901) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'AuthoringTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
SID, CID = str(sid), str(cid)

# TC1: create a question -> DRAFT, version 1
body = {
    "chapter_id": CID, "question_type": "MCQ", "question_text": "What is 2+2?",
    "marks": 1, "difficulty": "EASY",
    "options": [{"key": "A", "text": "3", "correct": False}, {"key": "B", "text": "4", "correct": True}],
}
r = httpx.post(f"{BASE}/admin/questions", json=body, headers=PLAT)
ok = r.status_code == 201
data = r.json() if ok else {}
ok = ok and data.get("status") == "DRAFT" and data.get("version_no") == 1 \
    and "question_id" in data and "version_id" in data
check("TC1 create question -> DRAFT v1", ok, f"{r.status_code} {r.text[:200]}")
QID = data.get("question_id")

# TC2: list the Question Bank for this chapter -> created question appears with full content
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
ok = r.status_code == 200
items = r.json().get("questions", []) if ok else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = ok and match is not None and match["question_text"] == "What is 2+2?" \
    and match["question_type"] == "MCQ" and match["status"] == "DRAFT" \
    and len(match["options"]) == 2 and any(o["correct"] for o in match["options"])
check("TC2 list question bank returns created question", ok, f"{r.status_code} {r.text[:300]}")

# TC3: editing creates version 2 — it must NOT mutate version 1 in place.
r = httpx.patch(f"{BASE}/admin/questions/{QID}", json={"question_text": "What is 2+2? (revised)"}, headers=PLAT)
ok = r.status_code == 200
patch_data = r.json() if ok else {}
ok = ok and patch_data.get("version_no") == 2 and patch_data.get("version_id") != data.get("version_id")
check("TC3 edit creates version 2", ok, f"{r.status_code} {r.text[:200]}")

r = httpx.get(f"{BASE}/admin/questions/{QID}/versions", headers=PLAT)
ok = r.status_code == 200
versions = {v["version_no"]: v for v in r.json().get("versions", [])} if ok else {}
ok = ok and versions.get(1, {}).get("question_text") == "What is 2+2?" \
    and versions.get(2, {}).get("question_text") == "What is 2+2? (revised)"
check("TC3b version 1 unchanged after editing to version 2", ok, f"{r.status_code} {r.text[:300]}")

# TC4: a school admin cannot create, list, or edit questions on another tenant's content.
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r1 = httpx.post(f"{BASE}/admin/questions", json=body, headers=SPR)
r2 = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=SPR)
r3 = httpx.patch(f"{BASE}/admin/questions/{QID}", json={"question_text": "Nope"}, headers=SPR)
ok = r1.status_code == 403 and r2.status_code == 403 and r3.status_code == 403
check("TC4 cross-tenant question writes/reads -> 403", ok, f"{r1.status_code} {r2.status_code} {r3.status_code}")

# TC5: a school admin cannot delete a question on global content either.
r = httpx.delete(f"{BASE}/admin/questions/{QID}", headers=SPR)
check("TC5 cross-tenant delete -> 403", r.status_code == 403, f"{r.status_code}")

# TC6: deleting archives (soft-delete) — never a hard delete, so old test references
# and version history survive.
r = httpx.delete(f"{BASE}/admin/questions/{QID}", headers=PLAT)
ok = r.status_code == 200 and r.json().get("status") == "ARCHIVED"
check("TC6 delete -> 200, status ARCHIVED", ok, f"{r.status_code} {r.text[:200]}")

r = httpx.get(f"{BASE}/admin/questions/{QID}/versions", headers=PLAT)
ok = r.status_code == 200 and len(r.json().get("versions", [])) == 2
check("TC6b version history survives archiving", ok, f"{r.status_code}")

# TC7: an archived question is excluded from the default Question Bank listing.
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
ok = r.status_code == 200 and all(it["question_id"] != QID for it in items)
check("TC7 archived question excluded from bank listing", ok, f"{r.status_code} {items}")

finish()
