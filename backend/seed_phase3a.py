"""Seed Phase 3A fixtures: passwords, multi-tenant Alice, TC3 positive control."""
import psycopg
from main import DB_DSN, hash_password

PASSWORD = "testpass"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    pw = hash_password(PASSWORD)
    conn.execute("UPDATE users SET password_hash = %s", (pw,))

    # Alice: STUDENT in TWO active tenants (TC1 School tier-1 + TC2 Individual tier-2)
    row = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES ('alice@springfield.dev', %s, 'Alice') "
        "ON CONFLICT (email) DO NOTHING RETURNING id",
        (pw,),
    ).fetchone()
    alice_id = row[0] if row else conn.execute(
        "SELECT id FROM users WHERE email = 'alice@springfield.dev'"
    ).fetchone()[0]

    conn.execute(
        """
        INSERT INTO user_tenant_mappings (user_id, tenant_id, role)
        SELECT %s, id, 'STUDENT' FROM tenants WHERE name IN ('TC1 School', 'TC2 Individual')
        ON CONFLICT (user_id, tenant_id) DO NOTHING
        """,
        (alice_id,),
    )

    # Positive control: make TC3 School's subscription valid again (tier 4)
    conn.execute(
        "UPDATE subscriptions SET end_date = CURRENT_DATE + 30 "
        "WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'TC3 School')"
    )

    n = conn.execute(
        "SELECT count(*) FROM user_tenant_mappings WHERE user_id = %s", (alice_id,)
    ).fetchone()[0]
    print(f"seeded: alice tenant mappings = {n} (expect 2)")
