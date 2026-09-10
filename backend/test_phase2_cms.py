"""Phase 2 CMS test runner: dedupe bulk, pool, dry-run config, tenant authz, S3 uploads."""
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import httpx
import psycopg
import s3_client
from main import DB_DSN

from testutil import BASE, check, finish, login


def jbody(r):
    """Response body as a dict; non-JSON/empty bodies become an inspectable
    wrapper so a broken endpoint fails a check instead of crashing the runner."""
    try:
        body = r.json()
        return body if isinstance(body, dict) else {"_body": body}
    except Exception:
        return {"_body": f"{r.status_code} {r.text[:200]!r}"}


# Curriculum seed: 'Global Physics' / 'Chapter 4: Thermodynamics' /
# 'PYQ: Thermodynamics 2023' are shared fixtures (also used by other suites)
# that are absent from the current DB — create them idempotently.
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    row = conn.execute(
        "SELECT id FROM subjects WHERE name = 'Global Physics' AND tenant_id IS NULL "
        "ORDER BY created_at LIMIT 1").fetchone()
    if row is None:
        row = conn.execute(
            "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
            "VALUES (NULL, 'Global Physics', 'Grade 11', 10) RETURNING id").fetchone()
    physics = row[0]
    row = conn.execute(
        "SELECT id FROM chapters WHERE subject_id = %s AND name = 'Chapter 4: Thermodynamics'",
        (physics,)).fetchone()
    if row is None:
        seq = conn.execute(
            "SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM chapters WHERE subject_id = %s",
            (physics,)).fetchone()[0]
        row = conn.execute(
            "INSERT INTO chapters (subject_id, name, sequence_order) "
            "VALUES (%s, 'Chapter 4: Thermodynamics', %s) RETURNING id", (physics, seq)).fetchone()
    ch4 = row[0]
    if conn.execute("SELECT 1 FROM modules WHERE title = 'PYQ: Thermodynamics 2023'").fetchone() is None:
        seq = conn.execute(
            "SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM modules WHERE chapter_id = %s",
            (ch4,)).fetchone()[0]
        conn.execute(
            "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
            "VALUES (%s, 'PYQ: Thermodynamics 2023', 'QUIZ', %s, TRUE)", (ch4, seq))
    spring_subject = conn.execute(
        "SELECT id FROM subjects WHERE name = 'Springfield Custom Physics'").fetchone()[0]

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
    # Prior runs' 'Springfield Heat' chapter tree: S3 objects first, then
    # children before parents (payloads -> modules -> chapter).
    stale_mods = [r[0] for r in conn.execute(
        "SELECT m.id FROM modules m JOIN chapters c ON c.id = m.chapter_id "
        "WHERE c.subject_id = %s AND c.sequence_order = 7", (spring_subject,))]
    for mid in stale_mods:
        for key in (s3_client.list_keys(f"uploads/hls/{mid}/")
                    + s3_client.list_keys(f"uploads/labs/{mid}/")):
            s3_client.delete_key(key)
    for table in ("quiz_configurations", "video_payloads", "lab_payloads"):
        conn.execute(
            f"DELETE FROM {table} WHERE module_id = ANY(%s)", (stale_mods,))
    conn.execute("DELETE FROM modules WHERE id = ANY(%s)", (stale_mods,))
    conn.execute("DELETE FROM chapters WHERE subject_id = %s AND sequence_order = 7", (spring_subject,))


def pool_total():
    r = httpx.get(f"{BASE}/admin/pyq/pool",
                  params={"chapter_id": ch4, "difficulty": "EASY", "limit": 1}, headers=PLAT)
    return r.json()["total"]


# Baseline measured BEFORE any inserts: TC2 asserts a delta, not an absolute
# total, so leftovers from other seeds/tests can't couple to this suite.
easy_baseline = pool_total()


# TC1: idempotency / double-click — 10 in, then same 10 again
r1 = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("A", 10)}, headers=PLAT)
r2 = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("A", 10)}, headers=PLAT)
b1, b2 = jbody(r1), jbody(r2)
ok = (r1.status_code == 200 and b1.get("inserted") == 10
      and b2.get("inserted") == 0 and b2.get("duplicates_skipped") == 10)
check("TC1 bulk dedupe: 10 inserted, then 10 skipped", ok,
      f"run1={b1} run2={b2}")

# TC1b: mixed batch with invalid rows
mixed = bulk_q("B", 3)
mixed[1]["difficulty"] = "INSANE"
mixed[2]["correct_answer"] = "Z"
r = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": mixed}, headers=PLAT)
b = jbody(r)
ok = b.get("inserted") == 1 and len(b.get("invalid", [])) == 2
check("TC1b mixed batch: 1 inserted, 2 invalid", ok, f"body={b}")

# TC2: pool endpoint + pagination — delta over the pre-insert baseline
# (11 = 10 batch A + 1 valid row from mixed batch B), never an absolute total.
r = httpx.get(f"{BASE}/admin/pyq/pool", params={"chapter_id": ch4, "difficulty": "EASY", "limit": 5}, headers=PLAT)
p = jbody(r)
r_off = httpx.get(f"{BASE}/admin/pyq/pool", params={"chapter_id": ch4, "difficulty": "EASY", "limit": 5, "offset": 5}, headers=PLAT)
p_off = jbody(r_off)
ok = (r.status_code == 200 and p.get("total") == easy_baseline + 11
      and len(p.get("questions", [])) == 5 and len(p_off.get("questions", [])) == 5)
check("TC2 pool: baseline + 11, pages of 5", ok,
      f"baseline={easy_baseline} total={p.get('total')} p1={len(p.get('questions', []))} "
      f"p2={len(p_off.get('questions', []))}")

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
spr_ch = jbody(r).get("id")
r = httpx.post(f"{BASE}/admin/chapters/{spr_ch}/modules",
               json={"title": "Springfield Quiz", "module_type": "QUIZ", "sequence_order": 1, "is_published": True}, headers=SPR)
spr_quiz_mod = jbody(r).get("id")
r = httpx.post(f"{BASE}/admin/modules/{spr_quiz_mod}/quiz-config",
               json={"selection_rules": {"years": [2023], "difficulty": "HARD", "total_questions": 50},
                     "time_limit_minutes": 30, "passing_percentage": 60, "max_attempts": 3}, headers=SPR)
b = jbody(r)
ok = (r.status_code == 200 and b.get("saved") is True
      and b.get("available") == 0 and b.get("requested") == 50)
check("TC5 school CRUD + dry-run {saved, available, requested}", ok, f"body={b}")

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
spr_vid_mod = jbody(r).get("id")
r = httpx.post(f"{BASE}/admin/chapters/{spr_ch}/modules",
               json={"title": "Springfield Heat Lab", "module_type": "LAB", "sequence_order": 3, "is_published": True}, headers=SPR)
spr_lab_mod = jbody(r).get("id")

with tempfile.TemporaryDirectory() as tmp:
    mp4 = Path(tmp) / "test.mp4"
    # Same resolution rule as main.py (EDOVA_FFMPEG_DIR), with a fallback to
    # the repo-bundled tools/ffmpeg/bin for dev shells without the env var.
    ffmpeg = (shutil.which("ffmpeg", path=os.getenv("EDOVA_FFMPEG_DIR") or None)
              or shutil.which("ffmpeg", path=str(Path(__file__).resolve().parent.parent / "tools" / "ffmpeg" / "bin"))
              or "ffmpeg")
    subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i", "testsrc=duration=8:size=320x240:rate=15",
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

# Cleanup: delete the uploaded HLS segments; verify no residue via list_keys.
hls_prefix = st.get("s3_key_prefix") or f"uploads/hls/{spr_vid_mod}/"
hls_keys = s3_client.list_keys(hls_prefix)
for key in hls_keys:
    s3_client.delete_key(key)
hls_left = s3_client.list_keys(hls_prefix)
check("TC6 S3 cleanup: HLS segments deleted, prefix empty", len(hls_keys) > 0 and hls_left == [],
      f"deleted={len(hls_keys)} left={hls_left}")

r = httpx.post(f"{BASE}/admin/modules/{spr_lab_mod}/lab-upload",
               files={"file": ("sim.html", b"<html><body>SPRINGFIELD_SIM</body></html>", "text/html")},
               data={"environment_type": "VIRTUAL_LAB", "instructions_markdown": "Do the thing"}, headers=SPR)
b = jbody(r)
ok = r.status_code == 200 and (b.get("s3_file_key") or "").endswith("sim.html")
check("TC6 lab upload -> s3_file_key written", ok, f"body={b}")

# Cleanup: delete the uploaded lab HTML; verify no residue.
lab_key = b.get("s3_file_key") or f"uploads/labs/{spr_lab_mod}/sim.html"
s3_client.delete_key(lab_key)
check("TC6 S3 cleanup: lab sim deleted", not s3_client.object_exists(lab_key), f"key={lab_key}")

# TC6b: bad file type rejected
r = httpx.post(f"{BASE}/admin/modules/{spr_lab_mod}/lab-upload",
               files={"file": ("evil.exe", b"MZ", "application/octet-stream")}, headers=SPR)
check("TC6b .exe lab upload -> 400", r.status_code == 400, f"status={r.status_code}")

# TC7: student token on /admin/* -> 403
r = httpx.post(f"{BASE}/admin/pyq/bulk", json={"questions": bulk_q("D", 1)}, headers=STU)
check("TC7 student on /admin -> 403", r.status_code == 403, f"status={r.status_code}")

finish()
