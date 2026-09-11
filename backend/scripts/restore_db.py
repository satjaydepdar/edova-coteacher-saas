"""
Restore the local or remote PostgreSQL database from temp/database_dump.sql.
Usage:
    python backend/scripts/restore_db.py
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import _bootstrap  # noqa: F401
from core import DB_DSN
import psycopg

def find_psql() -> str | None:
    # 1. PATH lookup
    psql_path = shutil.which("psql")
    if psql_path:
        return psql_path

    # 2. Common Windows paths
    if sys.platform == "win32":
        for version in range(20, 12, -1):
            candidate = Path(f"C:/Program Files/PostgreSQL/{version}/bin/psql.exe")
            if candidate.exists():
                return str(candidate)

    # 3. Common Unix paths
    for candidate in [
        Path("/usr/bin/psql"),
        Path("/usr/local/bin/psql"),
        Path("/opt/homebrew/bin/psql"),
    ]:
        if candidate.exists():
            return str(candidate)

    return None

def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    dump_file = repo_root / "temp" / "database_dump.sql"

    if not dump_file.exists():
        print(f"Error: dump file not found at {dump_file}")
        sys.exit(1)

    print(f"[1/3] Using database dump: {dump_file} ({dump_file.stat().st_size:,} bytes)")

    # Parse DSN
    cleaned_dsn = DB_DSN.replace("postgresql+psycopg://", "postgresql://")
    parsed = urlparse(cleaned_dsn)
    
    user = parsed.username or "postgres"
    password = parsed.password or "edova"
    host = parsed.hostname or "127.0.0.1"
    port = str(parsed.port or 5432)
    dbname = parsed.path.lstrip("/") or "edtech_platform"

    print(f"[2/3] Target database: {user}@{host}:{port}/{dbname}")

    # Ensure target database exists
    try:
        maintenance_dsn = f"postgresql://{user}:{password}@{host}:{port}/postgres"
        with psycopg.connect(maintenance_dsn, autocommit=True) as conn:
            cur = conn.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s", (dbname,)
            )
            if not cur.fetchone():
                print(f"       Database '{dbname}' does not exist, creating...")
                conn.execute(f'CREATE DATABASE "{dbname}"')
    except Exception as exc:
        print(f"       (Note: database existence check skipped: {exc})")

    # Locate psql
    psql_bin = find_psql()
    if not psql_bin:
        print("\n[!] 'psql' binary could not be found automatically.")
        print("    Please run the following command directly:")
        print(f"    psql -h {host} -p {port} -U {user} -d {dbname} -f \"{dump_file}\"")
        sys.exit(1)

    print(f"[3/3] Executing restore via {psql_bin}...")
    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        psql_bin,
        "-h", host,
        "-p", port,
        "-U", user,
        "-d", dbname,
        "-f", str(dump_file),
    ]

    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0 and "ERROR:" in res.stderr:
        print(f"Restore finished with warnings/errors:\n{res.stderr[-1000:]}")
    else:
        print("       Restore completed successfully!")

    # Verify tables
    try:
        with psycopg.connect(cleaned_dsn) as conn:
            cur = conn.execute(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
            )
            count = cur.fetchone()[0]
            print(f"\nVerification: {count} tables found in public schema of '{dbname}'.")
            
            cur = conn.execute("SELECT count(*) FROM tenants")
            t_count = cur.fetchone()[0]
            print(f"Verification: {t_count} tenants ready.")
    except Exception as exc:
        print(f"Verification query failed: {exc}")

if __name__ == "__main__":
    main()
