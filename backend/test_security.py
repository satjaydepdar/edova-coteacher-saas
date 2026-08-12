"""Security regression tests (requirement §12): bcrypt migration, rate limiting,
admin audit log, production config guard. Run LAST in a session — the rate-limit
test intentionally exhausts the /auth/login bucket for 127.0.0.1 for ~60s."""
import os
import subprocess
import sys

import httpx
import psycopg

sys.path.insert(0, os.path.dirname(__file__))
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


# --- TC1: legacy pbkdf2 hash verifies and is transparently upgraded to bcrypt ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    # fixture reset: force a known pbkdf2 hash so the test is rerun-idempotent
    import hashlib as _hl, secrets as _sc
    salt = _sc.token_bytes(16)
    dk = _hl.pbkdf2_hmac("sha256", b"testpass", salt, 100_000)
    legacy = f"100000${salt.hex()}${dk.hex()}"
    conn.execute("UPDATE users SET password_hash = %s WHERE email = %s",
                 (legacy, "tc3.student@test.dev"))
    before = conn.execute(
        "SELECT password_hash FROM users WHERE email = %s", ("tc3.student@test.dev",)).fetchone()[0]

r = httpx.post(f"{BASE}/auth/login", json={"email": "tc3.student@test.dev", "password": "testpass"})
with psycopg.connect(DB_DSN) as conn:
    after = conn.execute(
        "SELECT password_hash FROM users WHERE email = %s", ("tc3.student@test.dev",)).fetchone()[0]
ok = (not before.startswith("$2") and r.status_code == 200 and after.startswith("$2"))
check("TC1 legacy pbkdf2 login -> 200 and hash upgraded to bcrypt", ok,
      f"before={before[:12]}… after={after[:12]}… status={r.status_code}")

# --- TC2: bcrypt round-trip — same user logs in again against the new hash ---
r = httpx.post(f"{BASE}/auth/login", json={"email": "tc3.student@test.dev", "password": "testpass"})
check("TC2 second login against bcrypt hash -> 200", r.status_code == 200,
      f"status={r.status_code}")

# --- TC3: admin-created user gets a bcrypt hash ---
admin = httpx.post(f"{BASE}/auth/login",
                   json={"email": "admin@edova.dev", "password": "testpass"}).json()["access_token"]
PLAT = {"Authorization": f"Bearer {admin}"}
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM users WHERE email = %s", ("sec.bcrypt@test.dev",))
    tenant_id = conn.execute(
        "SELECT id FROM tenants WHERE type = 'SCHOOL' ORDER BY created_at LIMIT 1").fetchone()[0]
r = httpx.post(f"{BASE}/admin/users", headers=PLAT,
               json={"email": "sec.bcrypt@test.dev", "password": "testpass",
                     "full_name": "Sec Test", "tenant_id": str(tenant_id), "role": "STUDENT"})
with psycopg.connect(DB_DSN) as conn:
    h = conn.execute("SELECT password_hash FROM users WHERE email = %s",
                     ("sec.bcrypt@test.dev",)).fetchone()
ok = r.status_code == 201 and h is not None and h[0].startswith("$2")
check("TC3 admin-created user -> bcrypt hash", ok, f"status={r.status_code} hash={h[0][:7] if h else None}…")

# --- TC4: audit log records admin mutation with actor and outcome ---
r = httpx.get(f"{BASE}/admin/subjects", headers=PLAT)
sub = r.json()["subjects"][0]
sub_id = sub["id"]
r = httpx.patch(f"{BASE}/admin/subjects/{sub_id}", headers=PLAT, json={"name": sub["name"]})
with psycopg.connect(DB_DSN) as conn:
    row = conn.execute(
        "SELECT actor_user_id, action, path, status_code, ip FROM admin_audit_log "
        "WHERE path = %s ORDER BY at DESC LIMIT 1", (f"/admin/subjects/{sub_id}",)).fetchone()
uid = conn_uid = None
with psycopg.connect(DB_DSN) as conn:
    uid = conn.execute("SELECT id FROM users WHERE email = %s", ("admin@edova.dev",)).fetchone()[0]
ok = (r.status_code == 200 and row is not None
      and str(row[0]) == str(uid) and row[1] == "PATCH" and row[2] == f"/admin/subjects/{sub_id}"
      and row[3] == 200 and row[4] is not None)
check("TC4 admin PATCH audited (actor, action, path, 200, ip)", ok, f"row={row}")

# --- TC5: denied request is audited too (403 with NULL/valid actor) ---
stu = httpx.post(f"{BASE}/auth/login",
                 json={"email": "tc3.student@test.dev", "password": "testpass"}).json()["access_token"]
r = httpx.post(f"{BASE}/admin/pyq/bulk", headers={"Authorization": f"Bearer {stu}"},
               json={"questions": []})
with psycopg.connect(DB_DSN) as conn:
    row = conn.execute(
        "SELECT status_code FROM admin_audit_log WHERE path = '/admin/pyq/bulk' "
        "ORDER BY at DESC LIMIT 1").fetchone()
ok = r.status_code == 403 and row is not None and row[0] == 403
check("TC5 denied admin attempt audited with 403", ok, f"status={r.status_code} row={row}")

# --- TC6: production config guard refuses defaults ---
env = dict(os.environ, EDOVA_ENVIRONMENT="production")
env.pop("EDOVA_JWT_SECRET", None)
p = subprocess.run([sys.executable, "-c", "import main"],
                   cwd=os.path.dirname(__file__), env=env, capture_output=True, text=True)
ok = p.returncode != 0 and "EDOVA_JWT_SECRET" in p.stderr
check("TC6 prod + default JWT secret -> refuses to boot", ok,
      f"rc={p.returncode} stderr={p.stderr.strip()[-80:]}")

env2 = dict(os.environ, EDOVA_ENVIRONMENT="production", EDOVA_JWT_SECRET="x" * 32)
env2.pop("EDOVA_CORS_ORIGINS", None)
p = subprocess.run([sys.executable, "-c", "import main"],
                   cwd=os.path.dirname(__file__), env=env2, capture_output=True, text=True)
ok = p.returncode != 0 and "EDOVA_CORS_ORIGINS" in p.stderr
check("TC7 prod + wildcard CORS -> refuses to boot", ok,
      f"rc={p.returncode} stderr={p.stderr.strip()[-80:]}")

env3 = dict(os.environ, EDOVA_ENVIRONMENT="production", EDOVA_JWT_SECRET="x" * 32,
            EDOVA_CORS_ORIGINS="capacitor://localhost")
p = subprocess.run([sys.executable, "-c", "import main; print('ok')"],
                   cwd=os.path.dirname(__file__), env=env3, capture_output=True, text=True)
check("TC8 prod + secure config -> boots", p.returncode == 0 and "ok" in p.stdout,
      f"rc={p.returncode} {p.stderr.strip()[-80:]}")

# --- TC9: rate limit on /auth/login (10/min/IP) — deliberately LAST ---
codes = [httpx.post(f"{BASE}/auth/login",
                    json={"email": "nobody@test.dev", "password": "wrong"}).status_code
         for _ in range(12)]
ok = codes[:10] == [401] * 10 and codes[10:] == [429, 429]
check("TC9 login rate limit: 10x401 then 429", ok, f"codes={codes}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
