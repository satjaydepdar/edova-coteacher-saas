"""
Dump the local PostgreSQL database into temp/database_dump.sql using pg_dump.
Usage:
    python backend/scripts/dump_db.py
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import _bootstrap  # noqa: F401
from core import DB_DSN

def find_pg_dump() -> str | None:
    # 1. PATH lookup
    path = shutil.which("pg_dump")
    if path:
        return path

    # 2. Common Windows paths
    if sys.platform == "win32":
        for version in range(20, 12, -1):
            candidate = Path(f"C:/Program Files/PostgreSQL/{version}/bin/pg_dump.exe")
            if candidate.exists():
                return str(candidate)

    # 3. Common Unix paths
    for candidate in [
        Path("/usr/bin/pg_dump"),
        Path("/usr/local/bin/pg_dump"),
        Path("/opt/homebrew/bin/pg_dump"),
    ]:
        if candidate.exists():
            return str(candidate)

    return None

def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    dump_file = repo_root / "temp" / "database_dump.sql"

    # Parse DSN
    cleaned_dsn = DB_DSN.replace("postgresql+psycopg://", "postgresql://")
    parsed = urlparse(cleaned_dsn)
    
    user = parsed.username or "postgres"
    password = parsed.password or "edova"
    host = parsed.hostname or "127.0.0.1"
    port = str(parsed.port or 5432)
    dbname = parsed.path.lstrip("/") or "edtech_platform"

    pg_dump_bin = find_pg_dump()
    if not pg_dump_bin:
        print("\n[!] 'pg_dump' binary could not be found automatically.")
        print("    Please run the following command directly:")
        print(f"    pg_dump -h {host} -p {port} -U {user} -d {dbname} --clean --if-exists --no-owner --no-privileges --inserts -f \"{dump_file}\"")
        sys.exit(1)

    print(f"[1/2] Dumping database '{dbname}' from {host}:{port}...")
    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        pg_dump_bin,
        "-h", host,
        "-p", port,
        "-U", user,
        "-d", dbname,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--inserts",
        "-f", str(dump_file),
    ]

    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Dump failed:\n{res.stderr}")
        sys.exit(res.returncode)

    size = dump_file.stat().st_size
    print(f"[2/2] Successfully dumped database to {dump_file} ({size:,} bytes).")
    print("\nYou can now commit and push the updated dump to git:")
    print("    git add temp/database_dump.sql")
    print("    git commit -m \"data: update database dump with latest records\"")
    print("    git push origin main")

if __name__ == "__main__":
    main()
