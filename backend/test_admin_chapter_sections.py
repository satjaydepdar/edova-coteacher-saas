"""Admin-facing section listing for a chapter's tenant (Feature B Phase 1's Publish
picker needs to know which sections it can assign a test to). Same tenant-resolution
pattern as /admin/chapters/{id}/topics. Requires the API on :8001."""
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login

PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subjects WHERE name = 'AdminChSecTest Subject'")  # cascades chapters
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AdminChSecTest Tenant')")
    conn.execute("DELETE FROM tenants WHERE name = 'AdminChSecTest Tenant'")
    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('AdminChSecTest Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO sections (tenant_id, name, grade) VALUES (%s, 'B Section', '9')", (tid,))
    conn.execute("INSERT INTO sections (tenant_id, name, grade) VALUES (%s, 'A Section', '9')", (tid,))
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'AdminChSecTest Subject', '9', 941) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'AdminChSecTest Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

    conn.execute("DELETE FROM subjects WHERE name = 'AdminChSecTest Global Subject'")
    global_sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                              "VALUES (NULL, 'AdminChSecTest Global Subject', '9', 942) RETURNING id").fetchone()[0]
    global_cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                              "VALUES (%s, 'AdminChSecTest Global Chapter', 1) RETURNING id", (global_sid,)).fetchone()[0]

TID, CID, GLOBAL_CID = str(tid), str(cid), str(global_cid)

# TC1: sections come back sorted by name, regardless of insertion order
r = httpx.get(f"{BASE}/admin/chapters/{CID}/sections", headers=PLAT)
ok = r.status_code == 200
names = [s["name"] for s in r.json().get("sections", [])] if ok else []
check("TC1 lists this tenant's sections, sorted by name", ok and names == ["A Section", "B Section"], f"{r.status_code} {names}")

# TC2: a school admin outside this tenant is rejected
r = httpx.get(f"{BASE}/admin/chapters/{CID}/sections", headers=SPR)
check("TC2 cross-tenant admin -> 403", r.status_code == 403, f"{r.status_code}")

# TC3: unknown chapter -> 404
r = httpx.get(f"{BASE}/admin/chapters/00000000-0000-0000-0000-000000000000/sections", headers=PLAT)
check("TC3 unknown chapter -> 404", r.status_code == 404, f"{r.status_code}")

# TC4: a chapter under a GLOBAL (tenant_id NULL) subject has no single tenant's sections -> empty, not an error
r = httpx.get(f"{BASE}/admin/chapters/{GLOBAL_CID}/sections", headers=PLAT)
ok = r.status_code == 200 and r.json().get("sections") == []
check("TC4 global-subject chapter -> empty sections list, 200", ok, f"{r.status_code} {r.text[:200]}")

finish()
