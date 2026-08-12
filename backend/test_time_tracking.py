"""Time-tracking tests: cumulative rollup + heartbeat idempotency."""
import sys
import uuid

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
    vid_mod = conn.execute("SELECT id FROM modules WHERE title = 'Intro to Heat'").fetchone()[0]

tok = login("tc3.student@test.dev")
H = {"Authorization": f"Bearer {tok}"}
body = {"module_id": str(vid_mod), "progress_pct": 50, "time_spent_delta": 120,
        "client_event_id": str(uuid.uuid4())}

# baseline (phase7 tests already added time via events)
r0 = httpx.post(f"{BASE}/api/student/progress",
                json={"module_id": str(vid_mod), "progress_pct": 50}, headers=H)
base = r0.json()["time_spent"]

# TC1: first heartbeat counts
r1 = httpx.post(f"{BASE}/api/student/progress", json=body, headers=H)
ok = r1.status_code == 200 and r1.json()["time_spent"] == base + 120 and r1.json()["time_counted"] is True
check("heartbeat counted (+120)", ok, f"time_spent={r1.json().get('time_spent')} (base {base})")

# TC2: exact retry of the same heartbeat is NOT double-counted
r2 = httpx.post(f"{BASE}/api/student/progress", json=body, headers=H)
ok = r2.status_code == 200 and r2.json()["time_spent"] == base + 120 and r2.json()["time_counted"] is False
check("duplicate heartbeat idempotent", ok, f"time_spent={r2.json().get('time_spent')} counted={r2.json().get('time_counted')}")

# TC3: new event id counts again (cumulative, not MAX)
body3 = {**body, "time_spent_delta": 90, "client_event_id": str(uuid.uuid4())}
r3 = httpx.post(f"{BASE}/api/student/progress", json=body3, headers=H)
ok = r3.status_code == 200 and r3.json()["time_spent"] == base + 210
check("second distinct heartbeat accumulates (+90)", ok, f"time_spent={r3.json().get('time_spent')}")

# TC4: delta without a valid UUID event id -> 422
r4 = httpx.post(f"{BASE}/api/student/progress",
                json={"module_id": str(vid_mod), "progress_pct": 60,
                      "time_spent_delta": 10, "client_event_id": "not-a-uuid"}, headers=H)
check("delta with bad event id -> 422", r4.status_code == 422, f"status={r4.status_code}")

# TC5: quiz attempt time lands in the rollup exactly once (event id = attempt id).
# Bob submits fresh (tc3 already hit max_attempts in earlier runs).
with psycopg.connect(DB_DSN) as conn:
    quiz_mod = conn.execute("SELECT id FROM modules WHERE title = 'PYQ: Thermodynamics 2023'").fetchone()[0]
    letters = dict(conn.execute(
        "SELECT id::text, correct_answer FROM question_bank WHERE chapter_id = "
        "(SELECT chapter_id FROM modules WHERE id = %s)", (quiz_mod,)
    ).fetchall())

# Fixture reset: Bob's quiz state must be pristine for the rollup assertion.
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    for tbl in ("student_quiz_attempts", "quiz_generated_sets", "progress_events", "student_progress"):
        conn.execute(
            f"DELETE FROM {tbl} WHERE module_id = %s AND student_id = "
            "(SELECT id FROM users WHERE email = 'bob@tc3.dev')", (quiz_mod,))
tok_bob = login("bob@tc3.dev")
HB = {"Authorization": f"Bearer {tok_bob}"}
g = httpx.post(f"{BASE}/api/v1/engine/quiz/generate", json={"module_id": str(quiz_mod)}, headers=HB).json()
answers = [{"qid": q["qid"], "selected_index": (ord(letters[q["qid"]].upper()) - 65 + 1) % 4}
           for q in g["questions"]]
r5 = httpx.post(f"{BASE}/api/student/quiz/submit",
                json={"module_id": str(quiz_mod), "answers": answers, "time_spent": 180}, headers=HB)
attempt_id = r5.json().get("attempt_id")
with psycopg.connect(DB_DSN) as conn:
    ev = conn.execute(
        "SELECT delta_seconds FROM progress_events WHERE client_event_id = %s", (attempt_id,)
    ).fetchone()
    rollup = conn.execute(
        "SELECT time_spent FROM student_progress WHERE student_id = "
        "(SELECT id FROM users WHERE email = 'bob@tc3.dev') AND module_id = %s", (quiz_mod,)
    ).fetchone()
ok = (r5.status_code == 200 and ev is not None and ev[0] == 180
      and rollup is not None and rollup[0] == 180)
check("attempt time rolled up exactly once (event id = attempt id)", ok,
      f"status={r5.status_code} event={ev} rollup={rollup}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
