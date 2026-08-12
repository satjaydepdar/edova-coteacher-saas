"""Seed Phase 7 fixtures: quiz config (shortfall by design), Bob for IDOR review test."""
import psycopg
from main import DB_DSN, hash_password

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    quiz_mod = conn.execute("SELECT id FROM modules WHERE title = 'PYQ: Thermodynamics 2023'").fetchone()[0]

    # Pool for chapter 4: 3 MEDIUM questions across 2022-2024; rules ask for 5 -> shortfall of 2
    conn.execute(
        "INSERT INTO quiz_configurations (module_id, time_limit_minutes, passing_percentage, selection_rules, max_attempts) "
        "VALUES (%s, 30, 60, "
        "'{\"years\": [2022, 2023, 2024], \"difficulty\": \"MEDIUM\", \"total_questions\": 5}'::jsonb, 2) "
        "ON CONFLICT (module_id) DO NOTHING",
        (quiz_mod,),
    )

    # Bob: second TC3 School student (tier 4) — used to verify attempt-ownership 404
    pw = hash_password("testpass")
    row = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES ('bob@tc3.dev', %s, 'Bob') "
        "ON CONFLICT (email) DO NOTHING RETURNING id",
        (pw,),
    ).fetchone()
    bob_id = row[0] if row else conn.execute("SELECT id FROM users WHERE email = 'bob@tc3.dev'").fetchone()[0]
    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) "
        "SELECT %s, id, 'STUDENT' FROM tenants WHERE name = 'TC3 School' "
        "ON CONFLICT (user_id, tenant_id) DO NOTHING",
        (bob_id,),
    )
    print("seeded: phase7 fixtures ready")
