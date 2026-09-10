"""Idempotent DB fixture for test-assignments.spec.ts: a real tenant + section,
since sections can only be created via a TEACHER-role login (no admin endpoint
exists for it) and this is a plain admin-only E2E spec. Same direct-DB-fixture
convention as every backend test_*.py file, just invoked from Node's beforeAll
since Playwright/TS has no psycopg. Prints {"tenant_id": ..., "section_id": ...}."""
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
import psycopg
from main import DB_DSN

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    tenant = conn.execute("SELECT id FROM tenants WHERE name = 'CreateTestE2E Tenant'").fetchone()
    if tenant:
        tenant_id = tenant[0]
    else:
        tenant_id = conn.execute(
            "INSERT INTO tenants (name, type, status) VALUES ('CreateTestE2E Tenant', 'SCHOOL', 'ACTIVE') "
            "RETURNING id").fetchone()[0]

    section = conn.execute("SELECT id FROM sections WHERE tenant_id = %s AND name = 'E2E Section'",
                           (tenant_id,)).fetchone()
    if section:
        section_id = section[0]
    else:
        section_id = conn.execute(
            "INSERT INTO sections (tenant_id, name, grade) VALUES (%s, 'E2E Section', '9') RETURNING id",
            (tenant_id,)).fetchone()[0]

print(json.dumps({"tenant_id": str(tenant_id), "section_id": str(section_id)}))
