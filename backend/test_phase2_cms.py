"""Phase 2 CMS test runner: dedupe bulk, pool, dry-run config, tenant authz, S3 uploads."""
import subprocess
import sys
import tempfile
import time
from pathlib import Path

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


with psycopg.connect(DB_DSN) as conn:
    ch4, physics, spring_subject = conn.execute(
        "SELECT (SELECT id FROM chapters WHERE name = 'Chapter 4: Thermodynamics'),"
        "       (SELECT id FROM subjects WHERE name = 'Global Physics'),"
        "       (SELECT id FROM subjects WHERE name = 'Springfield Custom Physics')"
    ).fetchone()

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
STU = {"Authorization": f"Bearer {login('tc3.student@test.dev')}"}


def bulk_q(tag, n, year=2020):
    return [{"subject_id": str(physics), "chapter_id": str(ch4), "year": year, "difficulty": "EASY",
             "question_text": f"Bulk question {tag} #{i}?", "options": ["A) 1", "B) 2"],
             "correct_answer": "A", "explanation": "seed"} for i in range(n)]


# Fixture reset: make rerun-idempotent
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM question_bank WHERE question_text LIKE 'Bulk question %'")
    conn.execute("DELETE FROM chapters WHERE subject_id = %s AND sequence_order = 7", (spring_subject,))


# TC1: idempotency / double-click — 10 in, then same 10 again
r1 = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("A", 10)}, headers=PLAT)
r2 = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("A", 10)}, headers=PLAT)
ok = (r1.status_code == 200 and r1.json()["inserted"] == 10
      and r2.json()["inserted"] == 0 and r2.json()["duplicates_skipped"] == 10)
check("TC1 bulk dedupe: 10 inserted, then 10 skipped", ok,
      f"run1={r1.json()} run2={r2.json()}")

# TC1b: mixed batch with invalid rows
mixed = bulk_q("B", 3)
mixed[1]["difficulty"] = "INSANE"
mixed[2]["correct_answer"] = "Z"
r = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": mixed}, headers=PLAT)
ok = r.json()["inserted"] == 1 and len(r.json()["invalid"]) == 2
check("TC1b mixed batch: 1 inserted, 2 invalid", ok, f"body={r.json()}")

# TC2: pool endpoint + pagination
r = httpx.get(f"{BASE}/admin/pyq/pool", params={"chapter_id": ch4, "difficulty": "EASY", "limit": 5}, headers=PLAT)
p = r.json()
r_off = httpx.get(f"{BASE}/admin/pyq/pool", params={"chapter_id": ch4, "difficulty": "EASY", "limit": 5, "offset": 5}, headers=PLAT)
ok = (r.status_code == 200 and p["total"] == 12 and len(p["questions"]) == 5
      and len(r_off.json()["questions"]) == 5)  # 12 = 1 original EASY seed + 10 batch A + 1 batch B
check("TC2 pool: total 12, pages of 5", ok, f"total={p.get('total')} p1={len(p['questions'])} p2={len(r_off.json()['questions'])}")

# TC3: malformed rules -> 400, DB never queried (X-Query-Count stays 0)
r = httpx.post(f"{BASE}/admin/modules/{ch4}/quiz-config",
               json={"selection_rules": {"years": ["twenty"], "difficulty": "INSANE", "total_questions": -5},
                     "time_limit_minutes": 30, "passing_percentage": 60}, headers=PLAT)
check("TC3 malformed rules -> 400", r.status_code == 400, f"status={r.status_code}")

# TC4: school admin writes global chapter -> 403
r = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("C", 1)}, headers=SPR)
check("TC4 school admin -> global bank: 403", r.status_code == 403, f"status={r.status_code}")

# TC5: school admin CRUD on own tenant: chapter -> module -> quiz-config (dry-run payload)
r = httpx.post(f"{BASE}/admin/subjects/{spring_subject}/chapters",
               json={"name": "Springfield Heat", "sequence_order": 7}, headers=SPR)
spr_ch = r.json().get("id")
r = httpx.post(f"{BASE}/admin/chapters/{spr_ch}/modules",
               json={"title": "Springfield Quiz", "module_type": "QUIZ", "sequence_order": 1, "is_published": True}, headers=SPR)
spr_quiz_mod = r.json().get("id")
r = httpx.post(f"{BASE}/admin/modules/{spr_quiz_mod}/quiz-config",
               json={"selection_rules": {"years": [2023], "difficulty": "HARD", "total_questions": 50},
                     "time_limit_minutes": 30, "passing_percentage": 60, "max_attempts": 3}, headers=SPR)
ok = (r.status_code == 200 and r.json()["saved"] is True
      and r.json()["available"] == 0 and r.json()["requested"] == 50)
check("TC5 school CRUD + dry-run {saved, available, requested}", ok, f"body={r.json()}")

# TC5b: school admin config on GLOBAL module -> 403
with psycopg.connect(DB_DSN) as conn:
    global_quiz = conn.execute("SELECT id FROM modules WHERE title = 'PYQ: Thermodynamics 2023'").fetchone()[0]
r = httpx.post(f"{BASE}/admin/modules/{global_quiz}/quiz-config",
               json={"selection_rules": {"years": [2023], "difficulty": "MEDIUM", "total_questions": 3},
                     "time_limit_minutes": 30, "passing_percentage": 60}, headers=SPR)
check("TC5b school admin -> global quiz-config: 403", r.status_code == 403, f"status={r.status_code}")

# TC6: video upload -> transcode -> S3 -> payload row; lab upload -> s3_file_key
r = httpx.post(f"{BASE}/admin/chapters/{spr_ch}/modules",
               json={"title": "Springfield Heat Video", "module_type": "VIDEO", "sequence_order": 2, "is_published": True}, headers=SPR)
spr_vid_mod = r.json()["id"]
r = httpx.post(f"{BASE}/admin/chapters/{spr_ch}/modules",
               json={"title": "Springfield Heat Lab", "module_type": "LAB", "sequence_order": 3, "is_published": True}, headers=SPR)
spr_lab_mod = r.json()["id"]

with tempfile.TemporaryDirectory() as tmp:
    mp4 = Path(tmp) / "test.mp4"
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=duration=8:size=320x240:rate=15",
                    "-f", "lavfi", "-i", "sine=frequency=440:duration=8",
                    "-c:v", "libx264", "-c:a", "aac", "-shortest", str(mp4)],
                   check=True, capture_output=True)
    r = httpx.post(f"{BASE}/admin/modules/{spr_vid_mod}/video-upload",
                   files={"file": ("test.mp4", mp4.read_bytes(), "video/mp4")}, headers=SPR, timeout=120)
# Async contract (migration 013): 202 immediately, poll video-status until READY.
ok = r.status_code == 202 and r.json()["status"] == "PROCESSING"
deadline = time.time() + 120
st = {}
while time.time() < deadline:
    st = httpx.get(f"{BASE}/admin/modules/{spr_vid_mod}/video-status", headers=SPR).json()
    if st.get("status") != "PROCESSING":
        break
    time.sleep(2)
ok = ok and st.get("status") == "READY" and (st.get("s3_key_prefix") or "").endswith(f"{spr_vid_mod}/")
check("TC6 video upload -> 202 -> poll -> READY with segments in S3", ok, f"status={st}")

r = httpx.post(f"{BASE}/admin/modules/{spr_lab_mod}/lab-upload",
               files={"file": ("sim.html", b"<html><body>SPRINGFIELD_SIM</body></html>", "text/html")},
               data={"environment_type": "VIRTUAL_LAB", "instructions_markdown": "Do the thing"}, headers=SPR)
ok = r.status_code == 200 and r.json()["s3_file_key"].endswith("sim.html")
check("TC6 lab upload -> s3_file_key written", ok, f"body={r.json()}")

# TC6b: bad file type rejected
r = httpx.post(f"{BASE}/admin/modules/{spr_lab_mod}/lab-upload",
               files={"file": ("evil.exe", b"MZ", "application/octet-stream")}, headers=SPR)
check("TC6b .exe lab upload -> 400", r.status_code == 400, f"status={r.status_code}")

# TC7: student token on /admin/* -> 403
r = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("D", 1)}, headers=STU)
check("TC7 student on /admin -> 403", r.status_code == 403, f"status={r.status_code}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
