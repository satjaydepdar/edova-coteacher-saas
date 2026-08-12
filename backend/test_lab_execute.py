"""Lab Sandbox Engine test runner (POST /api/v1/engine/lab/execute).

Part 1 (always runs): direct lab_sandbox.execute checks — no server, no DB.
Part 2 (runs when the API is on :8000): authz + gate behavior over HTTP.
  - Gate OFF (default)  -> 503 for a valid request.
  - Gate ON  (EDOVA_LAB_EXEC_ENABLED=true on the server) -> full execution path.
"""
import lab_sandbox

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


# ---------- Part 1: executor unit checks ----------
r = lab_sandbox.execute("print('hello', 2 + 3)", "python", 5, 256, None)
e = r["execution"]
check("python stdout", e["exit_code"] == 0 and e["stdout"].strip() == "hello 5",
      f"exit={e['exit_code']} stdout={e['stdout']!r}")

r = lab_sandbox.execute("import sys; sys.stderr.write('boom\\n'); sys.exit(3)", "python", 5, 256, None)
e = r["execution"]
check("python stderr+exit", e["exit_code"] == 3 and "boom" in e["stderr"],
      f"exit={e['exit_code']} stderr={e['stderr']!r}")

r = lab_sandbox.execute("n = input(); print('got', n)", "python", 5, 256, "42\n")
e = r["execution"]
check("python stdin pipe", e["exit_code"] == 0 and "got 42" in e["stdout"],
      f"stdout={e['stdout']!r}")

r = lab_sandbox.execute("while True: pass", "python", 2, 256, None)
e = r["execution"]
check("timeout kills runaway", e["timed_out"] and e["exit_code"] == 137
      and "TimeoutError" in e["stderr"],
      f"timed_out={e['timed_out']} exit={e['exit_code']}")

r = lab_sandbox.execute("print('x' * (300 * 1024))", "python", 5, 256, None)
e = r["execution"]
check("stdout truncation", "truncated" in e["stdout"], f"len={len(e['stdout'])}")

r = lab_sandbox.execute("print(1)", "python", 5, 256, None)
check("content_hash is sha256", len(r["content_hash"]) == 64, r["content_hash"][:12])
check("sandbox block honest", r["sandbox"]["isolation"] in
      ("rlimits+env-scrub+killpg", "wall-timeout-only"), r["sandbox"]["isolation"])

try:
    lab_sandbox.execute("print(1)", "cobol", 5, 256, None)
    check("unknown language rejected", False, "no error raised")
except lab_sandbox.SandboxError as err:
    check("unknown language rejected", "unsupported language" in str(err), str(err))

if lab_sandbox.available_languages()["javascript"]:
    r = lab_sandbox.execute("console.log('js', 6 * 7)", "javascript", 5, 256, None)
    e = r["execution"]
    check("javascript stdout", e["exit_code"] == 0 and "js 42" in e["stdout"],
          f"exit={e['exit_code']} stdout={e['stdout']!r}")
else:
    print("SKIP  javascript checks [node not installed on this host]")

# ---------- Part 2: live API checks (fixture tenant, like test_activation.py) ----------
try:
    import httpx
    import psycopg
    from main import DB_DSN, hash_password
except ImportError:
    print("SKIP  live API checks [httpx/psycopg not installed]")
    httpx = None

if httpx is not None:
    try:
        httpx.get(f"{BASE}/docs", timeout=2)
        server_up = True
    except Exception:
        server_up = False

    if not server_up:
        print("SKIP  live API checks [no server on :8000]")
    else:
        # Idempotent fixture: plan(allow_lab) + tenant + active sub + STUDENT user
        with psycopg.connect(DB_DSN, autocommit=True) as conn:
            conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'LabExec School')")
            conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'LabExec School')")
            conn.execute("DELETE FROM tenants WHERE name = 'LabExec School'")
            conn.execute("DELETE FROM users WHERE email = 'labexec@edova.dev'")
            conn.execute("DELETE FROM subscription_plans WHERE name = 'LabExec Plan'")
            plan_id = conn.execute(
                "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                "VALUES ('LabExec Plan', 4, true, true, true) RETURNING id").fetchone()[0]
            tenant_id = conn.execute(
                "INSERT INTO tenants (name, type, status) VALUES ('LabExec School', 'SCHOOL', 'ACTIVE') "
                "RETURNING id").fetchone()[0]
            conn.execute(
                "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, seat_count) "
                "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 30, 1)", (tenant_id, plan_id))
            uid = conn.execute(
                "INSERT INTO users (email, password_hash, full_name) "
                "VALUES ('labexec@edova.dev', %s, 'Lab Exec') RETURNING id",
                (hash_password("testpass"),)).fetchone()[0]
            conn.execute(
                "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
                (uid, tenant_id))

        token = httpx.post(f"{BASE}/auth/login",
                           json={"email": "labexec@edova.dev", "password": "testpass"}
                           ).json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}
        payload = {"code": "print('api', 3 * 7)", "language": "python", "timeout_seconds": 5}

        r = httpx.post(f"{BASE}/api/v1/engine/lab/execute", json=payload)
        # Repo convention: missing required Authorization header -> FastAPI 422.
        check("missing auth header rejected or gated", r.status_code in (422, 503),
              f"status={r.status_code}")
        r = httpx.post(f"{BASE}/api/v1/engine/lab/execute", json=payload,
                       headers={"Authorization": "Bearer not-a-token"})
        check("bad token rejected or gated", r.status_code in (401, 503),
              f"status={r.status_code}")

        r = httpx.post(f"{BASE}/api/v1/engine/lab/execute", json=payload, headers=auth)
        if r.status_code == 503:
            check("gate off -> 503", True, "EDOVA_LAB_EXEC_ENABLED not set on server")
        else:
            body = r.json()
            check("authed python execution", r.status_code == 200
                  and body["execution"]["exit_code"] == 0
                  and "api 21" in body["execution"]["stdout"],
                  f"status={r.status_code} exec={body.get('execution', {})}")
            r = httpx.post(f"{BASE}/api/v1/engine/lab/execute", headers=auth,
                           json={"code": "print(1)", "language": "cobol"})
            check("api rejects unknown language", r.status_code == 422, f"status={r.status_code}")
            r = httpx.post(f"{BASE}/api/v1/engine/lab/execute", headers=auth,
                           json={"code": "print(1)", "language": "python", "timeout_seconds": 99})
            check("api rejects out-of-range timeout", r.status_code == 422, f"status={r.status_code}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed" + (f" — FAILED: {failed}" if failed else ""))
raise SystemExit(1 if failed else 0)
