"""Phase 3B test runner: locked flags, IDOR 404, empty-chapter omission, Coming Soon, N+1."""
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


def tree(token, subject_id):
    return httpx.get(f"{BASE}/api/student/content/subjects/{subject_id}/tree",
                     headers={"Authorization": f"Bearer {token}"})


with psycopg.connect(DB_DSN) as conn:
    physics_id, shelby_subject_id = conn.execute(
        "SELECT (SELECT id FROM subjects WHERE name = 'Global Physics'),"
        "       (SELECT id FROM subjects WHERE name = 'Shelbyville Secret Science')"
    ).fetchone()

tok_tc1 = login("tc1.student@test.dev")  # tier 1: video only
tok_tc3 = login("tc3.student@test.dev")  # tier 4: everything

r = tree(tok_tc1, physics_id)
body = r.json()
mods = {m["title"]: m for c in body["chapters"] for m in c["modules"]}

# TC1: locked/unlocked dict logic (tier 1)
ok = (r.status_code == 200
      and mods["Intro to Heat"]["locked"] is False
      and mods["Heat Transfer Virtual Lab"]["locked"] is True
      and mods["PYQ: Thermodynamics 2023"]["locked"] is True)
check("TC1 locked flags (tier 1)", ok, f"video={mods['Intro to Heat']['locked']} "
      f"lab={mods['Heat Transfer Virtual Lab']['locked']} quiz={mods['PYQ: Thermodynamics 2023']['locked']}")

# TC2: cross-tenant IDOR -> 404 (not 403)
r2 = tree(tok_tc1, shelby_subject_id)
check("TC2 cross-tenant subject -> 404", r2.status_code == 404, f"status={r2.status_code}")

# TC3: chapter with only draft modules is omitted entirely
ok = "Draft-Only Chapter" not in {c["chapter_name"] for c in body["chapters"]}
check("TC3 draft-only chapter omitted", ok, f"chapters={[c['chapter_name'] for c in body['chapters']]}")

# TC4: published video module without payload -> thumbnail_url null (Coming Soon)
ok = mods["Coming Soon: Advanced Heat"]["thumbnail_url"] is None
check("TC4 coming-soon thumbnail null", ok, f"thumb={mods['Coming Soon: Advanced Heat']['thumbnail_url']!r}")

# TC5: N+1 check — constant query count (entitlement + tree = 2), independent of content size
qc = int(r.headers["X-Query-Count"])
check("TC5 constant query count", qc == 2, f"X-Query-Count={qc} (1 entitlement + 1 tree)")

# Control: tier-4 student sees everything unlocked
r3 = tree(tok_tc3, physics_id)
locks = {m["title"]: m["locked"] for c in r3.json()["chapters"] for m in c["modules"]}
check("CTRL tier 4 all unlocked", all(v is False for v in locks.values()), f"locks={locks}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
