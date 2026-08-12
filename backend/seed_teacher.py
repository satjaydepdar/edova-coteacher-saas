"""Seed teacher fixtures: tier-4 teacher, tier-1 teacher, expired-school teacher, seats."""
import psycopg
from main import DB_DSN, hash_password

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    pw = hash_password("testpass")

    def ensure_user(email, name):
        row = conn.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) "
            "ON CONFLICT (email) DO NOTHING RETURNING id", (email, pw, name)).fetchone()
        return row[0] if row else conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()[0]

    t4 = ensure_user("teacher@tc3school.dev", "Meera Iyer")
    t1 = ensure_user("teacher@tc1school.dev", "Rahul Verma")
    tx = ensure_user("teacher@expired.dev", "Old School Teacher")

    for uid, tname in ((t4, "TC3 School"), (t1, "TC1 School")):
        conn.execute(
            "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) "
            "SELECT %s, id, 'TEACHER' FROM tenants WHERE name = %s "
            "ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'TEACHER'", (uid, tname))

    # Expired school: subscription ran out last month (the 1-year lockout case)
    expired = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('Expired School', 'SCHOOL', 'EXPIRED') "
        "ON CONFLICT DO NOTHING RETURNING id").fetchone()
    expired_id = expired[0] if expired else conn.execute(
        "SELECT id FROM tenants WHERE name = 'Expired School'").fetchone()[0]
    conn.execute(
        "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
        "SELECT %s, id, CURRENT_DATE - 400, CURRENT_DATE - 35 FROM subscription_plans WHERE tier_level = 4 "
        "ON CONFLICT DO NOTHING", (expired_id,))
    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER') "
        "ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'TEACHER'", (tx, expired_id))

    # Seat-based licensing: TC3 School bought 5 teacher seats
    conn.execute("UPDATE subscriptions SET seat_count = 5 WHERE tenant_id = "
                 "(SELECT id FROM tenants WHERE name = 'TC3 School')")
    print("seeded: teacher fixtures ready")
