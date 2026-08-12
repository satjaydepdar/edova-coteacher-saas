"""Phase 2B CMS gaps test runner: subject/chapter PATCH, browse endpoints,
tenant/subscription management, user management. Requires the API on :8000
and the platform admin seeded (seed_phase2.py: admin@edova.dev / testpass)."""
import httpx
import psycopg
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email, password="testpass"):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: P2B-tagged plan/school/subject (plans are product config,
# managed via SQL — no POST endpoint by design) ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'P2B School')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'P2B School')")
    conn.execute("DELETE FROM activation_keys WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'P2B School')")
    conn.execute("DELETE FROM tenants WHERE name = 'P2B School'")
    conn.execute("DELETE FROM users WHERE email LIKE 'p2b-%@edova.dev'")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'P2B Plan'")
    conn.execute("DELETE FROM subjects WHERE name LIKE 'P2B %'")
    plan_id = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('P2B Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    PLAN = str(plan_id)

# --- Tenant + subscription management (dogfooded: the test school is built via API) ---
r = httpx.post(f"{BASE}/admin/tenants", json={"name": "P2B School"}, headers=PLAT)
check("create school", r.status_code == 201 and r.json().get("id"), f"status={r.status_code}")
SCHOOL = r.json()["id"]

r = httpx.post(f"{BASE}/admin/tenants", json={"name": "  "}, headers=PLAT)
check("create school rejects blank name", r.status_code == 400, f"status={r.status_code}")

r = httpx.get(f"{BASE}/admin/subscription-plans", headers=PLAT)
check("list plans", r.status_code == 200 and any(p["id"] == PLAN for p in r.json()["plans"]),
      f"status={r.status_code} plans={len(r.json().get('plans', []))}")

r = httpx.post(f"{BASE}/admin/tenants/{SCHOOL}/subscriptions", headers=PLAT,
               json={"plan_id": PLAN, "start_date": "2026-01-01", "end_date": "2027-01-01",
                     "seat_count": 3})
check("assign subscription", r.status_code == 201, f"status={r.status_code}")

r = httpx.post(f"{BASE}/admin/tenants/{SCHOOL}/subscriptions", headers=PLAT,
               json={"plan_id": PLAN, "start_date": "2027-01-01", "end_date": "2026-01-01"})
check("subscription rejects end<start", r.status_code == 400, f"status={r.status_code}")

r = httpx.get(f"{BASE}/admin/tenants", headers=PLAT)
school_row = next((t for t in r.json()["tenants"] if t["id"] == SCHOOL), None)
check("list schools shows active plan", r.status_code == 200 and school_row
      and school_row["active_plan"] == "P2B Plan" and school_row["seat_count"] == 3,
      f"row={school_row}")

# --- User management ---
r = httpx.post(f"{BASE}/admin/users", headers=PLAT,
               json={"email": "p2b-admin@edova.dev", "password": "testpass",
                     "full_name": "P2B School Admin", "tenant_id": SCHOOL, "role": "ADMIN"})
check("create school admin", r.status_code == 201, f"status={r.status_code}")
SCHOOL_ADMIN = r.json().get("id")

r = httpx.post(f"{BASE}/admin/users", headers=PLAT,
               json={"email": "p2b-admin@edova.dev", "password": "testpass",
                     "full_name": "Dupe", "tenant_id": SCHOOL, "role": "ADMIN"})
check("duplicate email rejected", r.status_code == 409, f"status={r.status_code}")

r = httpx.post(f"{BASE}/admin/users", headers=PLAT,
               json={"email": "p2b-student@edova.dev", "password": "short",
                     "full_name": "P2B Student", "tenant_id": SCHOOL, "role": "STUDENT"})
check("short password rejected", r.status_code == 400, f"status={r.status_code}")

r = httpx.post(f"{BASE}/admin/users", headers=PLAT,
               json={"email": "p2b-student@edova.dev", "password": "testpass",
                     "full_name": "P2B Student", "tenant_id": SCHOOL, "role": "STUDENT"})
check("create student", r.status_code == 201, f"status={r.status_code}")

SA = {"Authorization": f"Bearer {login('p2b-admin@edova.dev')}"}

r = httpx.get(f"{BASE}/admin/users", headers=SA)
emails = {u["email"] for u in r.json()["users"]}
check("school admin sees only own users", r.status_code == 200
      and emails == {"p2b-admin@edova.dev", "p2b-student@edova.dev"}, f"emails={emails}")

r = httpx.get(f"{BASE}/admin/users", headers=PLAT)
check("platform sees all users", r.status_code == 200 and len(r.json()["users"]) > 2,
      f"count={len(r.json().get('users', []))}")

# --- Content fixture: global subject -> chapter -> topic -> unpublished VIDEO module ---
r = httpx.post(f"{BASE}/admin/subjects", headers=PLAT,
               json={"name": "P2B Science", "standard_grade": "10", "sequence_order": 90})
SUBJECT = r.json()["id"]
r = httpx.post(f"{BASE}/admin/subjects/{SUBJECT}/chapters", headers=PLAT,
               json={"name": "P2B Chapter", "sequence_order": 1})
CHAPTER = r.json()["id"]
r = httpx.post(f"{BASE}/admin/chapters/{CHAPTER}/topics", headers=PLAT,
               json={"name": "P2B Topic", "sequence_order": 1})
TOPIC = r.json()["id"]
r = httpx.post(f"{BASE}/admin/chapters/{CHAPTER}/modules", headers=PLAT,
               json={"title": "P2B Video", "module_type": "VIDEO", "sequence_order": 1,
                     "topic_id": TOPIC})
MODULE = r.json()["id"]

# --- Subject/chapter PATCH (rename + reorder) ---
r = httpx.patch(f"{BASE}/admin/subjects/{SUBJECT}", headers=PLAT,
                json={"name": "P2B Science Renamed", "sequence_order": 91})
check("patch subject", r.status_code == 200 and r.json()["updated"], f"status={r.status_code}")

r = httpx.patch(f"{BASE}/admin/subjects/{SUBJECT}", headers=PLAT, json={})
check("patch subject empty -> 400", r.status_code == 400, f"status={r.status_code}")

r = httpx.patch(f"{BASE}/admin/chapters/{CHAPTER}", headers=PLAT,
                json={"name": "P2B Chapter Renamed", "sequence_order": 2})
check("patch chapter", r.status_code == 200 and r.json()["updated"], f"status={r.status_code}")

# --- Browse endpoints ---
r = httpx.get(f"{BASE}/admin/subjects", headers=PLAT)
subj_row = next((s for s in r.json()["subjects"] if s["id"] == SUBJECT), None)
check("platform subject list", r.status_code == 200 and subj_row
      and subj_row["name"] == "P2B Science Renamed" and subj_row["scope"] == "global"
      and subj_row["chapter_count"] == 1 and subj_row["sequence_order"] == 91,
      f"row={subj_row}")

r = httpx.get(f"{BASE}/admin/subjects/{SUBJECT}/tree", headers=PLAT)
tree = r.json()
ch = tree["chapters"][0] if tree.get("chapters") else {}
mod = (ch.get("topics") or [{}])[0].get("modules", [{}])[0]
check("admin tree: unpublished module + readiness flags",
      r.status_code == 200 and ch.get("name") == "P2B Chapter Renamed"
      and mod.get("title") == "P2B Video" and mod.get("is_published") is False
      and mod.get("content_ready") is False,
      f"chapter={ch.get('name')} module={mod}")

# --- School-admin scoping ---
r = httpx.get(f"{BASE}/admin/subjects", headers=SA)
subj_row = next((s for s in r.json()["subjects"] if s["id"] == SUBJECT), None)
check("school admin sees global subject read-only", r.status_code == 200 and subj_row
      and subj_row["read_only"] is True, f"row={subj_row}")

r = httpx.patch(f"{BASE}/admin/subjects/{SUBJECT}", headers=SA, json={"name": "Hijack"})
check("school admin cannot patch global subject", r.status_code == 403, f"status={r.status_code}")

r = httpx.post(f"{BASE}/admin/tenants", json={"name": "Rogue School"}, headers=SA)
check("school admin cannot create schools", r.status_code == 403, f"status={r.status_code}")

r = httpx.get(f"{BASE}/admin/tenants", headers=SA)
check("school admin cannot list schools", r.status_code == 403, f"status={r.status_code}")

# --- Password reset flows into login ---
r = httpx.post(f"{BASE}/admin/users/{SCHOOL_ADMIN}/password", headers=PLAT,
               json={"password": "newpass123"})
check("platform resets password", r.status_code == 200, f"status={r.status_code}")
try:
    login("p2b-admin@edova.dev", "newpass123")
    check("login with new password", True, "ok")
except Exception as e:
    check("login with new password", False, str(e))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed" + (f" — FAILED: {failed}" if failed else ""))
raise SystemExit(1 if failed else 0)
