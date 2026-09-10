"""Topic + source-papers tagging on authored questions (migration 027). Both
live on authored_questions (not the versioned table) -- edits to them alone
must NOT create a new content version. Requires the API on :8001 and
migration 027 applied."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tid = conn.execute("SELECT id FROM tenants WHERE name = 'QA Fixtures Tenant'").fetchone()
    tid = tid[0] if tid else conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('QA Fixtures Tenant', 'SCHOOL', 'ACTIVE') RETURNING id"
    ).fetchone()[0]
    conn.execute("DELETE FROM subjects WHERE name = 'TopicPapersTest Subject'")  # cascades chapters/topics
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'TopicPapersTest Subject', '10', 911) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'TopicPapersTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
    other_cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                             "VALUES (%s, 'TopicPapersTest Other Chapter', 2) RETURNING id", (sid,)).fetchone()[0]
SID, CID, OTHER_CID = str(sid), str(cid), str(other_cid)

# Fixture topics via the real admin endpoint -- one in this question's chapter,
# one in a different chapter (to prove cross-chapter topic assignment is rejected).
r = httpx.post(f"{BASE}/admin/chapters/{CID}/topics", json={"name": "Common Difference", "sequence_order": 1}, headers=PLAT)
TOPIC_ID = r.json()["id"]
r = httpx.post(f"{BASE}/admin/chapters/{OTHER_CID}/topics", json={"name": "Wrong Chapter Topic", "sequence_order": 1}, headers=PLAT)
OTHER_TOPIC_ID = r.json()["id"]

# TC1: create with topic_id + source_papers -> both persisted, returned by list with topic_name resolved
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "What is d?", "marks": 1,
    "topic_id": TOPIC_ID, "source_papers": ["NCERT Exemplar", "CBSE 2023"],
    "options": [{"key": "A", "text": "ok", "correct": True}],
}, headers=PLAT)
ok = r.status_code == 201
data = r.json() if ok else {}
QID = data.get("question_id")
check("TC1 create with topic_id + source_papers -> 201", ok, f"{r.status_code} {r.text[:200]}")

r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = match is not None and match["topic_id"] == TOPIC_ID and match["topic_name"] == "Common Difference" \
    and match["source_papers"] == ["NCERT Exemplar", "CBSE 2023"]
check("TC2 list resolves topic_name and returns source_papers", ok, f"{match}")

# TC3: a topic belonging to a DIFFERENT chapter is rejected on create
r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "MCQ", "question_text": "Cross-chapter topic", "marks": 1,
    "topic_id": OTHER_TOPIC_ID, "options": [{"key": "A", "text": "ok", "correct": True}],
}, headers=PLAT)
check("TC3 cross-chapter topic_id rejected on create -> 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")

# TC4: editing ONLY topic_id/source_papers does NOT create a new version
r = httpx.patch(f"{BASE}/admin/questions/{QID}", json={"source_papers": ["CBSE 2024"]}, headers=PLAT)
ok = r.status_code == 200
patch_data = r.json() if ok else {}
ok = ok and patch_data.get("version_no") == 1  # unchanged -- v1 still current
check("TC4 metadata-only edit does not bump version", ok, f"{r.status_code} {patch_data}")

r = httpx.get(f"{BASE}/admin/questions/{QID}/versions", headers=PLAT)
versions = r.json().get("versions", []) if r.status_code == 200 else []
check("TC4b metadata-only edit created no new version row", len(versions) == 1, f"{len(versions)} versions")

r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
check("TC4c source_papers updated in place", match is not None and match["source_papers"] == ["CBSE 2024"], f"{match}")

# TC5: editing a content field (question_text) alongside topic_id -> new version AND topic_id updated together
r = httpx.post(f"{BASE}/admin/chapters/{CID}/topics", json={"name": "nth Term", "sequence_order": 2}, headers=PLAT)
TOPIC_ID_2 = r.json()["id"]
r = httpx.patch(f"{BASE}/admin/questions/{QID}",
                 json={"question_text": "What is the nth term?", "topic_id": TOPIC_ID_2}, headers=PLAT)
ok = r.status_code == 200 and r.json().get("version_no") == 2
check("TC5 content edit + topic_id change -> version bumped", ok, f"{r.status_code} {r.json()}")

r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = match is not None and match["topic_id"] == TOPIC_ID_2 and match["topic_name"] == "nth Term" \
    and match["question_text"] == "What is the nth term?"
check("TC5b topic_id and question_text both reflect the update", ok, f"{match}")

# TC6: script/markup in a source paper name is stripped down to bare text (no formatting allowed there at all)
r = httpx.patch(f"{BASE}/admin/questions/{QID}",
                 json={"source_papers": ["<script>alert(1)</script>Board Paper", "  ", "<b>Bold</b> Paper"]}, headers=PLAT)
ok = r.status_code == 200
r = httpx.get(f"{BASE}/admin/questions", params={"chapter_id": CID}, headers=PLAT)
items = r.json().get("questions", []) if r.status_code == 200 else []
match = next((it for it in items if it.get("question_id") == QID), None)
ok = ok and match is not None and match["source_papers"] == ["alert(1)Board Paper", "Bold Paper"]
check("TC6 source_papers sanitized to bare text, blanks dropped", ok, f"{match}")

finish()
