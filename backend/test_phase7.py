"""Phase 7 test runner: generate -> submit -> review, attempts cap, gates, progress machine."""
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


def auth(t):
    return {"Authorization": f"Bearer {t}"}


with psycopg.connect(DB_DSN) as conn:
    quiz_mod, lab_mod, vid_mod = conn.execute(
        "SELECT (SELECT id FROM modules WHERE title = 'PYQ: Thermodynamics 2023'),"
        "       (SELECT id FROM modules WHERE title = 'Heat Transfer Virtual Lab'),"
        "       (SELECT id FROM modules WHERE title = 'Intro to Heat')"
    ).fetchone()
    letters = dict(conn.execute(
        "SELECT id::text, correct_answer FROM question_bank WHERE chapter_id = "
        "(SELECT chapter_id FROM modules WHERE id = %s)", (quiz_mod,)
    ).fetchall())

# Fixture reset: attempts persist, so reruns would hit max_attempts=2.
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute(
        "DELETE FROM student_quiz_attempts WHERE module_id = %s AND student_id IN "
        "(SELECT id FROM users WHERE email IN ('tc3.student@test.dev', 'bob@tc3.dev'))", (quiz_mod,))
    conn.execute(
        "DELETE FROM quiz_generated_sets WHERE module_id = %s AND student_id IN "
        "(SELECT id FROM users WHERE email IN ('tc3.student@test.dev', 'bob@tc3.dev'))", (quiz_mod,))

tok3 = login("tc3.student@test.dev")  # tier 4
tok1 = login("tc1.student@test.dev")  # tier 1
tok_bob = login("bob@tc3.dev")        # tier 4, different student

# --- generate: served set persisted, shortfall from pool math ---
r = httpx.post(f"{BASE}/api/v1/engine/quiz/generate", json={"module_id": str(quiz_mod)}, headers=auth(tok3))
g = r.json()
served = [q["qid"] for q in g["questions"]]
ok = (r.status_code == 200 and g["metadata"]["total_requested"] == 5
      and g["metadata"]["total_delivered"] == 3 and g["metadata"]["shortfall"] is True
      and all("correct_answer" not in q for q in g["questions"]))
check("generate: 3/5 served, shortfall flagged, no answers leaked", ok,
      f"status={r.status_code} meta={g.get('metadata')}")

# --- submit #1: exactly 1 of 3 correct -> graded against SERVED set (denominator 3) ---
answers = []
for i, qid in enumerate(served):
    correct_idx = ord(letters[qid].upper()) - 65
    answers.append({"qid": qid, "selected_index": correct_idx if i == 0 else (correct_idx + 1) % 4})
r = httpx.post(f"{BASE}/api/student/quiz/submit",
               json={"module_id": str(quiz_mod), "answers": answers, "time_spent": 300}, headers=auth(tok3))
ok = (r.status_code == 200 and r.json()["score"] == 1 and r.json()["total_questions"] == 3
      and r.json()["shortfall_flag"] is True)
attempt_id = r.json().get("attempt_id")
check("submit #1 graded against served set (1/3)", ok,
      f"status={r.status_code} score={r.json().get('score')}/{r.json().get('total_questions')}")

# --- extra qid -> 422 (does not consume an attempt) ---
bad = answers + [{"qid": str(uuid.uuid4()), "selected_index": 0}]
r = httpx.post(f"{BASE}/api/student/quiz/submit",
               json={"module_id": str(quiz_mod), "answers": bad, "time_spent": 10}, headers=auth(tok3))
check("extra qid -> 422", r.status_code == 422, f"status={r.status_code}")

# --- review: owner sees correct_index + explanation ---
r = httpx.get(f"{BASE}/api/student/quiz/{attempt_id}/review", headers=auth(tok3))
qs = r.json()["questions"] if r.status_code == 200 else []
ok = (r.status_code == 200 and len(qs) == 3
      and all(q["correct_index"] is not None and q["explanation"] for q in qs)
      and sum(1 for q in qs if q["is_correct"]) == 1)
check("review: owner gets correct_index + explanations", ok, f"status={r.status_code} n={len(qs)}")

# --- review ownership: Bob gets 404 (IDOR-safe, not 403) ---
r = httpx.get(f"{BASE}/api/student/quiz/{attempt_id}/review", headers=auth(tok_bob))
check("review: other student -> 404", r.status_code == 404, f"status={r.status_code}")

# --- max_attempts: submit #2 ok, #3 -> 409 ---
r2 = httpx.post(f"{BASE}/api/student/quiz/submit",
                json={"module_id": str(quiz_mod), "answers": answers, "time_spent": 200}, headers=auth(tok3))
r3 = httpx.post(f"{BASE}/api/student/quiz/submit",
                json={"module_id": str(quiz_mod), "answers": answers, "time_spent": 100}, headers=auth(tok3))
ok = r2.status_code == 200 and r3.status_code == 409 and r3.json()["detail"]["max_attempts"] == 2
check("max_attempts: #2 ok, #3 -> 409 structured", ok,
      f"#{2}={r2.status_code} #3={r3.status_code} body={r3.json().get('detail')}")

# --- tier gates ---
r = httpx.post(f"{BASE}/api/v1/engine/quiz/generate", json={"module_id": str(quiz_mod)}, headers=auth(tok1))
g1 = r.status_code
r = httpx.post(f"{BASE}/api/student/quiz/submit",
               json={"module_id": str(quiz_mod), "answers": [], "time_spent": 0}, headers=auth(tok1))
s1 = r.status_code
r = httpx.post(f"{BASE}/api/student/lab/submit",
               json={"module_id": str(lab_mod), "completed": True, "time_spent": 60}, headers=auth(tok1))
l1 = r.status_code
check("tier 1 gates: quiz generate/submit, lab submit -> 403", g1 == 403 and s1 == 403 and l1 == 403,
      f"gen={g1} submit={s1} lab={l1}")

# --- lab submit (tier 4) + progress completion ---
r = httpx.post(f"{BASE}/api/student/lab/submit",
               json={"module_id": str(lab_mod), "interaction_data": {"final_temp": 42},
                     "completed": True, "time_spent": 600}, headers=auth(tok3))
ok = r.status_code == 200 and r.json()["completed"] is True
check("lab submit (tier 4) -> 200", ok, f"status={r.status_code}")

# --- progress state machine: 95% video -> completed; 40% later -> no regress ---
import uuid as _uuid
r = httpx.post(f"{BASE}/api/student/progress",
               json={"module_id": str(vid_mod), "progress_pct": 95,
                     "time_spent_delta": 500, "client_event_id": str(_uuid.uuid4())}, headers=auth(tok3))
s95 = r.json()
r = httpx.post(f"{BASE}/api/student/progress",
               json={"module_id": str(vid_mod), "progress_pct": 40,
                     "time_spent_delta": 100, "client_event_id": str(_uuid.uuid4())}, headers=auth(tok3))
s40 = r.json()
ok = (s95["status"] == "completed" and s95["progress_pct"] == 95
      and s40["status"] == "completed" and s40["progress_pct"] == 95)
check("progress: 95% completes, 40% never regresses", ok, f"95->{s95} 40->{s40}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
