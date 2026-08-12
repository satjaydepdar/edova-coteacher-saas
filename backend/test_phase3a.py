"""Phase 3A test runner: multi-tenant rejection, expired JWT, direct API bypass."""
import sys
import time

import httpx
import jwt
import psycopg
from main import DB_DSN, JWT_ALG, JWT_SECRET

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
    lab_module_id, alice_id = conn.execute(
        "SELECT (SELECT id FROM modules WHERE title = 'Heat Transfer Virtual Lab'),"
        "       (SELECT id FROM users WHERE email = 'alice@springfield.dev')"
    ).fetchone()

# TC1: multi-tenant rejection — Alice is STUDENT in two active tenants -> 409
tok_alice = login("alice@springfield.dev")
r = httpx.get(f"{BASE}/api/student/session", headers={"Authorization": f"Bearer {tok_alice}"})
check("TC1 multi-tenant rejection", r.status_code == 409, f"status={r.status_code} body={r.json()}")

# TC2: expired JWT -> 401
expired = jwt.encode(
    {"sub": str(alice_id), "iat": int(time.time()) - 7200, "exp": int(time.time()) - 3600},
    JWT_SECRET, algorithm=JWT_ALG,
)
r = httpx.get(f"{BASE}/api/student/session", headers={"Authorization": f"Bearer {expired}"})
check("TC2 expired JWT", r.status_code == 401, f"status={r.status_code} body={r.json()}")

# TC3: direct API bypass — tier-1 student (allow_lab=false) hits lab endpoint -> 403
tok_tc1 = login("tc1.student@test.dev")
r = httpx.get(f"{BASE}/student/modules/{lab_module_id}/lab", headers={"Authorization": f"Bearer {tok_tc1}"})
check("TC3 direct lab bypass blocked", r.status_code == 403, f"status={r.status_code} body={r.json()}")

# Control 1: tier-4 student gets the session payload
tok_tc3 = login("tc3.student@test.dev")
r = httpx.get(f"{BASE}/api/student/session", headers={"Authorization": f"Bearer {tok_tc3}"})
ok = r.status_code == 200 and r.json()["features"] == {"allow_video": True, "allow_lab": True, "allow_quiz": True}
check("CTRL session payload (tier 4)", ok, f"status={r.status_code} body={r.json()}")

# Control 2: tier-4 student can fetch the lab payload
r = httpx.get(f"{BASE}/student/modules/{lab_module_id}/lab", headers={"Authorization": f"Bearer {tok_tc3}"})
check("CTRL lab payload served (tier 4)", r.status_code == 200 and r.json()["environment_type"] == "VIRTUAL_LAB",
      f"status={r.status_code}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
