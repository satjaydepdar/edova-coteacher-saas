"""Topics test runner (migration 012): CRUD, module assignment, tree shape, authz.
Requires the API on :8000 and migrations 011+012 applied."""
import httpx
import psycopg
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": "testpass"})
    r.raise_for_status()
    return r.json()["access_token"]


PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}
STU = {"Authorization": f"Bearer {login('tc3.student@test.dev')}"}

# --- Idempotent fixture: global subject -> chapter -> (topics, modules) ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subjects WHERE name = 'TopicTest Subject'")  # cascades all
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (NULL, 'TopicTest Subject', '10', 900) RETURNING id").fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'TopicTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]
SID, CID = str(sid), str(cid)


def tree():
    r = httpx.get(f"{BASE}/api/student/content/subjects/{SID}/tree", headers=STU)
    r.raise_for_status()
    return r.json()


# TC1: create two topics under the chapter
r1 = httpx.post(f"{BASE}/admin/chapters/{CID}/topics", json={"name": "Euclid's Division Lemma", "sequence_order": 1}, headers=PLAT)
r2 = httpx.post(f"{BASE}/admin/chapters/{CID}/topics", json={"name": "Fundamental Theorem of Arithmetic", "sequence_order": 2}, headers=PLAT)
ok = r1.status_code == 201 and r2.status_code == 201
T1, T2 = r1.json()["id"], r2.json()["id"]
check("TC1 create topics", ok, f"{r1.status_code} {r2.status_code}")

# TC2: create modules — one in T1, one ungrouped
r1 = httpx.post(f"{BASE}/admin/chapters/{CID}/modules",
                json={"title": "Lemma Video", "module_type": "VIDEO", "sequence_order": 1,
                      "is_published": True, "topic_id": T1}, headers=PLAT)
r2 = httpx.post(f"{BASE}/admin/chapters/{CID}/modules",
                json={"title": "Loose Quiz", "module_type": "QUIZ", "sequence_order": 2,
                      "is_published": True}, headers=PLAT)
M1, M2 = r1.json()["id"], r2.json()["id"]
check("TC2 create modules (topic + ungrouped)", r1.status_code == 201 or r1.status_code == 200,
      f"{r1.status_code} {r2.status_code}")

# TC3: module in a topic from another chapter -> 422
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    other_ch = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                            "VALUES (%s, 'TopicTest Other Chapter', 2) RETURNING id", (sid,)).fetchone()[0]
    other_t = conn.execute("INSERT INTO topics (chapter_id, name, sequence_order) "
                           "VALUES (%s, 'Other Topic', 1) RETURNING id", (other_ch,)).fetchone()[0]
r = httpx.post(f"{BASE}/admin/chapters/{CID}/modules",
               json={"title": "Bad Module", "module_type": "LAB", "sequence_order": 9,
                     "topic_id": str(other_t)}, headers=PLAT)
check("TC3 cross-chapter topic rejected", r.status_code == 422, f"{r.status_code}")

# TC4: tree groups modules under topics; ungrouped -> topic_id null
t = tree()
ch = t["chapters"][0]
topics = {tp["topic_name"]: tp for tp in ch["topics"]}
lemma = topics.get("Euclid's Division Lemma")
ungrouped = [tp for tp in ch["topics"] if tp["topic_id"] is None]
ok = (lemma and lemma["modules"][0]["title"] == "Lemma Video"
      and ungrouped and ungrouped[0]["modules"][0]["title"] == "Loose Quiz")
check("TC4 tree: topics + ungrouped bucket", ok, f"{[(tp['topic_name'], [m['title'] for m in tp['modules']]) for tp in ch['topics']]}")

# TC5: move the loose quiz into T2 via PATCH; publish toggle off on M1
r1 = httpx.patch(f"{BASE}/admin/modules/{M2}", json={"topic_id": T2}, headers=PLAT)
r2 = httpx.patch(f"{BASE}/admin/modules/{M1}", json={"is_published": False}, headers=PLAT)
t = tree()
ch = t["chapters"][0]
topics = {tp["topic_name"]: tp for tp in ch["topics"]}
fta = topics.get("Fundamental Theorem of Arithmetic")
lemma = topics.get("Euclid's Division Lemma")
ok = (r1.status_code == 200 and r2.status_code == 200
      and fta and fta["modules"][0]["title"] == "Loose Quiz"
      and (not lemma or not lemma["modules"]))  # M1 unpublished -> gone from tree
check("TC5 reassign topic + unpublish", ok, f"{[(tp['topic_name'], [m['title'] for m in tp['modules']]) for tp in ch['topics']]}")

# TC6: rename + reorder topic
r = httpx.patch(f"{BASE}/admin/topics/{T2}", json={"name": "FTA", "sequence_order": 0}, headers=PLAT)
t = tree()
first = t["chapters"][0]["topics"][0]
ok = r.status_code == 200 and first["topic_name"] == "FTA"
check("TC6 rename + reorder topic", ok, f"first={first['topic_name']}")

# TC7: delete topic T2 -> its module falls back to ungrouped, not deleted
r = httpx.request("DELETE", f"{BASE}/admin/topics/{T2}", headers=PLAT)
t = tree()
ungrouped = [tp for tp in t["chapters"][0]["topics"] if tp["topic_id"] is None]
ok = (r.status_code == 200 and ungrouped
      and any(m["title"] == "Loose Quiz" for m in ungrouped[0]["modules"]))
check("TC7 delete topic keeps modules (ungrouped)", ok, f"{r.status_code}")

# TC8: school admin cannot touch global content's topics
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r1 = httpx.post(f"{BASE}/admin/chapters/{CID}/topics", json={"name": "Nope", "sequence_order": 9}, headers=SPR)
r2 = httpx.patch(f"{BASE}/admin/topics/{T1}", json={"name": "Nope"}, headers=SPR)
ok = r1.status_code == 403 and r2.status_code == 403
check("TC8 cross-tenant topic writes -> 403", ok, f"{r1.status_code} {r2.status_code}")

print()
failed = [n for n, ok in results if not ok]
print(f"{len(results) - len(failed)}/{len(results)} passed")
raise SystemExit(1 if failed else 0)
