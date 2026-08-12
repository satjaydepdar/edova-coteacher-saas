"""Seed Phase 2 CMS fixtures: platform tenant + platform admin + school admin."""
import psycopg
from main import DB_DSN, hash_password

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    pw = hash_password("testpass")

    platform = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('Edova Platform', 'PLATFORM', 'ACTIVE') "
        "ON CONFLICT DO NOTHING RETURNING id").fetchone()
    platform_id = platform[0] if platform else conn.execute(
        "SELECT id FROM tenants WHERE type = 'PLATFORM'").fetchone()[0]

    def ensure_user(email, name):
        row = conn.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) "
            "ON CONFLICT (email) DO NOTHING RETURNING id", (email, pw, name)).fetchone()
        return row[0] if row else conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()[0]

    plat_admin = ensure_user("admin@edova.dev", "Platform Admin")
    school_admin = ensure_user("admin@springfield.dev", "Springfield Admin")

    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'ADMIN') "
        "ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'ADMIN'", (plat_admin, platform_id))
    conn.execute(
        "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) "
        "SELECT %s, id, 'ADMIN' FROM tenants WHERE name = 'Springfield School' "
        "ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'ADMIN'", (school_admin,))
    print("seeded: phase2 CMS fixtures ready")
