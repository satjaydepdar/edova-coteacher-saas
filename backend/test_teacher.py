"""Teacher track tests: session, classroom engines, tier gating, expiry lockout, role isolation."""
import sys

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
    physics, vid_mod, lab_mod, quiz_mod = conn.execute(
        "SELECT (SELECT id FROM subjects WHERE name = 'Global Physics'),"
        "       (SELECT id FROM modules WHERE title = 'Intro to Heat'),"
        "       (SELECT id FROM modules WHERE title = 'Heat Transfer Virtual Lab'),"
        "       (SELECT id FROM modules WHERE title = 'PYQ: Thermodynamics 2023')"
    ).fetchone()

T4 = {"Authorization": f"Bearer {login('teacher@tc3school.dev')}"}
T1 = {"Authorization": f"Bearer {login('teacher@tc1school.dev')}"}
TX = {"Authorization": f"Bearer {login('teacher@expired.dev')}"}

# TC1: teacher session — role, school tenant, tier-4 flags
r = httpx.get(f"{BASE}/api/teacher/session", headers=T4)
b = r.json()
ok = (r.status_code == 200 and b["role"] == "TEACHER" and b["tenant"]["name"] == "TC3 School"
      and b["features"] == {"allow_video": True, "allow_lab": True, "allow_quiz": True})
check("teacher session (tier 4 school)", ok, f"status={r.status_code} body={b}")

# TC2: classroom engines accept TEACHER role
codes = {
    "tree": httpx.get(f"{BASE}/api/student/content/subjects/{physics}/tree", headers=T4).status_code,
    "manifest": httpx.get(f"{BASE}/api/student/video/{vid_mod}/manifest", headers=T4).status_code,
    "simulation": httpx.get(f"{BASE}/api/student/lab/{lab_mod}/simulation", headers=T4).status_code,
    "quiz_generate": httpx.post(f"{BASE}/api/v1/engine/quiz/generate",
                                json={"module_id": str(quiz_mod)}, headers=T4).status_code,
}
check("classroom engines serve teacher", all(v == 200 for v in codes.values()), f"codes={codes}")

# TC3: student-only endpoints reject teacher (attempts/progress are student concepts)
codes = {
    "quiz_submit": httpx.post(f"{BASE}/api/student/quiz/submit",
                              json={"module_id": str(quiz_mod), "answers": [], "time_spent": 0}, headers=T4).status_code,
    "lab_submit": httpx.post(f"{BASE}/api/student/lab/submit",
                             json={"module_id": str(lab_mod), "completed": True}, headers=T4).status_code,
    "progress": httpx.post(f"{BASE}/api/student/progress",
                           json={"module_id": str(vid_mod), "progress_pct": 50}, headers=T4).status_code,
}
check("student-only endpoints -> 403 for teacher", all(v == 403 for v in codes.values()), f"codes={codes}")

# TC4: tier-1 school teacher — video allowed, lab/quiz locked (tier gates the SCHOOL)
r = httpx.get(f"{BASE}/api/teacher/session", headers=T1)
f1 = r.json()["features"]
tree = httpx.get(f"{BASE}/api/student/content/subjects/{physics}/tree", headers=T1).json()
locks = {m["title"]: m["locked"] for c in tree["chapters"] for t in c["topics"] for m in t["modules"]}
ok = (f1 == {"allow_video": True, "allow_lab": False, "allow_quiz": False}
      and locks["Intro to Heat"] is False and locks["Heat Transfer Virtual Lab"] is True)
check("tier-1 teacher: flags + tree locks", ok, f"features={f1} lab_locked={locks['Heat Transfer Virtual Lab']}")

# TC5: 1-year subscription expired -> 403 lockout
r = httpx.get(f"{BASE}/api/teacher/session", headers=TX)
check("expired school -> 403 lockout", r.status_code == 403, f"status={r.status_code}")

# TC6: role isolation — teacher token on student session -> 403
r = httpx.get(f"{BASE}/api/student/session", headers=T4)
check("teacher on student session -> 403", r.status_code == 403, f"status={r.status_code}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
