"""Shared harness for the backend test runners.

Each test_*.py is a standalone script hitting the live API on BASE — one process
per file per run, so the module-level `results` list here is per-run by construction.

httpx is imported lazily inside login(): test_lab_execute.py is designed to run its
sandbox-only part on hosts without httpx installed, and it imports from this module.
"""

BASE = "http://127.0.0.1:8001"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email, password="testpass"):
    import httpx
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


def qa_tenant_id(conn):
    """Shared dedicated tenant for backend test fixtures. Fixture subjects must be
    scoped to THIS tenant, never tenant_id=NULL (global) -- global subjects show up
    in every real tenant's Content Shelf, which is how test clutter leaked into the
    demo app twice. Cross-tenant checks (school admin -> 403) still hold: any
    non-platform admin outside this tenant is still rejected, same as for NULL."""
    row = conn.execute("SELECT id FROM tenants WHERE name = 'QA Fixtures Tenant'").fetchone()
    if row:
        return row[0]
    return conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('QA Fixtures Tenant', 'SCHOOL', 'ACTIVE') RETURNING id"
    ).fetchone()[0]


def finish():
    """Summary line + process exit code (nonzero when any check failed)."""
    failed = [n for n, ok in results if not ok]
    suffix = f" — FAILED: {failed}" if failed else ""
    print(f"\n{len(results) - len(failed)}/{len(results)} passed{suffix}")
    raise SystemExit(1 if failed else 0)
