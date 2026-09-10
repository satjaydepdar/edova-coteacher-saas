"""Phase 3A test runner: multi-tenant rejection, expired JWT, direct API bypass."""
import time

import httpx
import jwt
import psycopg
from main import DB_DSN, JWT_ALG, JWT_SECRET

from testutil import BASE, check, finish, login


def ensure_lab_fixture():
    """Idempotent seed for the 'Heat Transfer Virtual Lab' module + VIRTUAL_LAB payload the
    TC3/CTRL checks exercise. The shared 'Global Physics' curriculum came from a wiped demo
    seed, so the suite recreates the slice it needs. Existence-checked inserts only, aligned
    with the other suites' seeds (double-seeding is a no-op); shared rows are NOT cleaned up
    because test_phase3b/7/teacher reference them too."""
    with psycopg.connect(DB_DSN, autocommit=True) as conn:
        physics = conn.execute(
            "SELECT id FROM subjects WHERE name = 'Global Physics' AND tenant_id IS NULL"
        ).fetchone()
        if physics is None:
            physics = conn.execute(
                "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                "VALUES (NULL, 'Global Physics', '10th Grade', 9) RETURNING id").fetchone()
        ch4 = conn.execute(
            "SELECT id FROM chapters WHERE subject_id = %s AND sequence_order = 4",
            (physics[0],)).fetchone()
        if ch4 is None:
            ch4 = conn.execute(
                "INSERT INTO chapters (subject_id, name, sequence_order) "
                "VALUES (%s, 'Chapter 4: Thermodynamics', 4) "
                "ON CONFLICT (subject_id, sequence_order) DO NOTHING RETURNING id",
                (physics[0],)).fetchone() or conn.execute(
                "SELECT id FROM chapters WHERE subject_id = %s AND sequence_order = 4",
                (physics[0],)).fetchone()
        lab = conn.execute(
            "SELECT id FROM modules WHERE chapter_id = %s AND title = 'Heat Transfer Virtual Lab'",
            (ch4[0],)).fetchone()
        if lab is None:
            lab = conn.execute(
                "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
                "VALUES (%s, 'Heat Transfer Virtual Lab', 'LAB', 2, TRUE) "
                "ON CONFLICT (chapter_id, sequence_order) DO NOTHING RETURNING id",
                (ch4[0],)).fetchone() or conn.execute(
                "SELECT id FROM modules WHERE chapter_id = %s AND title = 'Heat Transfer Virtual Lab'",
                (ch4[0],)).fetchone()
        conn.execute(
            "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, "
            "validation_rules) VALUES (%s, 'VIRTUAL_LAB', '# Heat Transfer Virtual Lab', '{}'::jsonb) "
            "ON CONFLICT (module_id) DO NOTHING", (lab[0],))


ensure_lab_fixture()

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

finish()
