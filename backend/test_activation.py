"""Activation key lifecycle test runner (doc §8): generate -> activate -> content access
-> expiry/revoke/device-limit. Requires the API on :8000 and migration 011 applied."""
import uuid

import httpx
import psycopg
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": "testpass"})
    r.raise_for_status()
    return r.json()["access_token"]


PLAT = {"Authorization" : f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: tenant + plan + active subscription + published content path ---
TAG = "actest"
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name LIKE 'ActTest %')")
    conn.execute("DELETE FROM activation_keys WHERE tenant_id IN (SELECT id FROM tenants WHERE name LIKE 'ActTest %')")
    conn.execute("DELETE FROM tenants WHERE name LIKE 'ActTest %'")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'ActTest Plan'")
    plan_id = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('ActTest Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    tenant_id = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('ActTest School', 'SCHOOL', 'ACTIVE') "
        "RETURNING id").fetchone()[0]
    conn.execute(
        "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, seat_count) "
        "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 30, 5)", (tenant_id, plan_id))
    expired_tenant = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('ActTest Expired', 'SCHOOL', 'ACTIVE') "
        "RETURNING id").fetchone()[0]
    conn.execute(
        "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, seat_count) "
        "VALUES (%s, %s, CURRENT_DATE - 60, CURRENT_DATE - 30, 1)", (expired_tenant, plan_id))

PLAT_T = str(tenant_id)
DEV_A, DEV_B, DEV_C = f"dev-a-{TAG}", f"dev-b-{TAG}", f"dev-c-{TAG}"


def admin_create_key(tid, max_devices=2, headers=PLAT):
    return httpx.post(f"{BASE}/admin/tenants/{tid}/activation-keys",
                      json={"max_devices": max_devices}, headers=headers)


def activate(code, dev):
    return httpx.post(f"{BASE}/api/activation/activate",
                      json={"key_code": code, "device_id": dev})


# TC1: admin generates a key — format + UNUSED status
r = admin_create_key(PLAT_T)
body = r.json()
key_code = body.get("key_code", "")
ok = (r.status_code == 201 and key_code.startswith("EDOVA-") and len(key_code) == 20
      and body["status"] == "UNUSED" and body["max_devices"] == 2)
check("TC1 key generation: EDOVA-XXXX-XXXX-XXXX, UNUSED", ok, f"{r.status_code} {body}")

# TC2: activate with an unknown key -> 404 invalid_activation_key
r = activate("EDOVA-AAAA-BBBB-CCCC", DEV_A)
check("TC2 unknown key rejected", r.status_code == 404 and r.json()["detail"] == "invalid_activation_key",
      f"{r.status_code} {r.json()}")

# TC3: happy path — activate, get device token + features + tenant
r = activate(key_code, DEV_A)
tok = r.json().get("access_token", "")
ok = (r.status_code == 200 and tok and r.json()["tenant"]["name"] == "ActTest School"
      and r.json()["features"] == {"allow_video": True, "allow_lab": True, "allow_quiz": True})
check("TC3 activate: token + tenant + features", ok, f"{r.status_code} {r.json()}")
DEVICE = {"Authorization": f"Bearer {tok}"}

# TC4: idempotent re-activate on the same device (app reinstall / token refresh)
r = activate(key_code, DEV_A)
check("TC4 re-activate same device is idempotent", r.status_code == 200, f"{r.status_code}")

# TC5: device limit — second device OK, third rejected (max_devices=2)
r2 = activate(key_code, DEV_B)
r3 = activate(key_code, DEV_C)
ok = r2.status_code == 200 and r3.status_code == 403 and r3.json()["detail"] == "device_limit_reached"
check("TC5 device limit enforced at max_devices", ok, f"devB={r2.status_code} devC={r3.status_code} {r3.json()}")

# TC6: device token opens the app catalogue; session endpoint agrees
r_subj = httpx.get(f"{BASE}/api/app/subjects", headers=DEVICE)
r_sess = httpx.get(f"{BASE}/api/activation/session", headers=DEVICE)
ok = (r_subj.status_code == 200 and "subjects" in r_subj.json()
      and r_sess.status_code == 200 and r_sess.json()["tenant"]["name"] == "ActTest School")
check("TC6 device token reads subjects + session", ok, f"{r_subj.status_code} {r_sess.status_code}")

# TC7: device token reaches the published content tree (global content visible to any tenant)
with psycopg.connect(DB_DSN) as conn:
    row = conn.execute("SELECT s.id FROM subjects s WHERE s.tenant_id IS NULL "
                       "AND EXISTS (SELECT 1 FROM chapters c JOIN modules m ON m.chapter_id = c.id "
                       "            WHERE c.subject_id = s.id AND m.is_published) LIMIT 1").fetchone()
if row:
    r = httpx.get(f"{BASE}/api/student/content/subjects/{row[0]}/tree", headers=DEVICE)
    check("TC7 device token reads content tree", r.status_code == 200 and len(r.json()["chapters"]) > 0,
          f"{r.status_code}")
else:
    check("TC7 device token reads content tree", False, "no published global subject fixture found")

# TC8: expired subscription -> activate rejected with subscription_expired
r = admin_create_key(str(expired_tenant), max_devices=1)
exp_key = r.json()["key_code"]
r = activate(exp_key, DEV_A)
ok = r.status_code == 403 and r.json()["detail"] == "subscription_expired"
check("TC8 expired subscription blocks activation", ok, f"{r.status_code} {r.json()}")

# TC9: revoke -> existing device token loses access on the NEXT request (backend is source of truth)
r = httpx.post(f"{BASE}/admin/activation-keys/{list(httpx.get(f'{BASE}/admin/tenants/{PLAT_T}/activation-keys', headers=PLAT).json()['keys'])[0]['id']}/revoke",
               headers=PLAT)
revoked_ok = r.status_code == 200 and r.json()["status"] == "REVOKED"
r = httpx.get(f"{BASE}/api/app/subjects", headers=DEVICE)
ok = revoked_ok and r.status_code == 403
check("TC9 revoke cuts off device token immediately", ok, f"revoke={r.status_code}")

# TC10: school admin cannot mint keys for another tenant
with psycopg.connect(DB_DSN) as conn:
    spr_tenant = conn.execute("SELECT tenant_id FROM user_tenant_mappings utm "
                              "JOIN users u ON u.id = utm.user_id "
                              "WHERE u.email = 'admin@springfield.dev' AND utm.role = 'ADMIN'").fetchone()[0]
SPR = {"Authorization": f"Bearer {login('admin@springfield.dev')}"}
r_own = httpx.post(f"{BASE}/admin/tenants/{spr_tenant}/activation-keys",
                   json={"max_devices": 1, "expires_at": "2027-12-31"}, headers=SPR)
r_other = admin_create_key(PLAT_T, max_devices=1, headers=SPR)
ok = r_own.status_code == 201 and r_other.status_code == 403
check("TC10 school admin: own tenant OK, other tenant 403", ok, f"own={r_own.status_code} other={r_other.status_code}")

# TC11: key with past expires_at -> key_expired even with a live subscription
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("INSERT INTO activation_keys (key_code, tenant_id, max_devices, expires_at) "
                 "VALUES ('EDOVA-EXP0-RED0-TEST', %s, 1, CURRENT_DATE - 1)", (PLAT_T,))
r = activate("EDOVA-EXP0-RED0-TEST", DEV_A)
ok = r.status_code == 403 and r.json()["detail"] == "key_expired"
check("TC11 expired key rejected", ok, f"{r.status_code} {r.json()}")

print()
failed = [n for n, ok in results if not ok]
print(f"{len(results) - len(failed)}/{len(results)} passed")
raise SystemExit(1 if failed else 0)
