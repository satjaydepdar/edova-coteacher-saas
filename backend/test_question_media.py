"""Question media test runner: diagram/image uploads for authored questions.
Hits the REAL S3 bucket (small 1x1 PNG, self-cleaning) — same integration-test
convention as the rest of this suite (test_video_pipeline.py does the same for
video). Requires the API on :8000 and migration 019 applied."""
import httpx
import psycopg
from main import DB_DSN

import s3_client
from testutil import BASE, check, finish, login, qa_tenant_id

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: tenant-scoped subject (QA tenant) -> chapter -> one question ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = qa_tenant_id(conn)
    conn.execute("DELETE FROM subjects WHERE name = 'MediaTest Subject'")  # cascades
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'MediaTest Subject', '10', 903) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'MediaTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
CID = str(cid)

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "SHORT_ANSWER", "question_text": "Refer to the diagram.",
}, headers=PLAT)
QID = r.json()["question_id"]

# 1x1 transparent PNG
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753"
    "de0000000c4944415478da6360000002000155527ab60000000049454e44ae426082"
)

# TC1: upload a diagram -> stored in S3, metadata persisted, presigned URL round-trips
files = {"file": ("diagram.png", PNG_BYTES, "image/png")}
r = httpx.post(f"{BASE}/admin/questions/{QID}/media", files=files, data={"caption": "Figure 1"}, headers=PLAT)
ok = r.status_code == 201
upload = r.json() if ok else {}
check("TC1 upload media -> 201 with media_id + url", ok and "media_id" in upload and "url" in upload,
      f"{r.status_code} {r.text[:200]}")

fetched = httpx.get(upload["url"]).content if ok else b""
check("TC1b presigned URL round-trips the exact bytes", fetched == PNG_BYTES, f"{len(fetched)} bytes")

# TC2: media list for the question includes it
r = httpx.get(f"{BASE}/admin/questions/{QID}/media", headers=PLAT)
items = r.json().get("media", []) if r.status_code == 200 else []
match = next((m for m in items if m["media_id"] == upload.get("media_id")), None)
ok = r.status_code == 200 and match is not None and match["caption"] == "Figure 1" and match["file_name"] == "diagram.png"
check("TC2 media list includes the upload", ok, f"{r.status_code} {items}")

# TC3: cross-tenant upload is rejected
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r = httpx.post(f"{BASE}/admin/questions/{QID}/media", files=files, headers=SPR)
check("TC3 cross-tenant media upload -> 403", r.status_code == 403, f"{r.status_code}")

# --- cleanup: leave the real bucket clean ---
if ok and "storage_key" in upload:
    s3_client.delete_key(upload["storage_key"])

finish()
