"""Post-review smoke: full purchase funnel against a live DB.
signup -> plans (included_seats present) -> onboard -> create-order (plan-derived seats)
-> verify (key persisted in activation_keys). Run: python smoke_public_funnel.py"""
import secrets
import psycopg
from fastapi.testclient import TestClient
import _bootstrap  # noqa: F401
import main

client = TestClient(main.app)

email = f"smoke-{secrets.token_hex(4)}@example.com"
r = client.post("/api/public/signup", json={"email": email, "password": "smokepass123", "full_name": "Smoke"})
assert r.status_code == 201, r.text
auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

r = client.get("/api/public/plans")
plans = r.json()["plans"]
assert plans and all("included_seats" in p for p in plans), plans
plan = next(p for p in plans if p["tier_level"] == 4)
print("plans:", [(p["name"], p["price_inr"], p["included_seats"]) for p in plans])

r = client.post("/api/public/schools/onboard", json={"school_name": "Smoke School"}, headers=auth)
assert r.status_code == 201, r.text
tenant_id = r.json()["tenant_id"]

r = client.post("/api/public/checkout/create-order",
                json={"plan_id": plan["id"], "tenant_id": tenant_id}, headers=auth)
assert r.status_code == 201, r.text
order = r.json()
assert order["amount_paise"] == plan["price_inr"] * 100, order

r = client.post("/api/public/checkout/verify", json={"order_id": order["order_id"]}, headers=auth)
assert r.status_code == 200, r.text
lic = r.json()
assert lic["activated"] and lic["max_devices"] == plan["included_seats"], lic

# The returned key MUST exist in activation_keys (regression: dead collision guard)
with psycopg.connect(main.DB_DSN) as conn:
    row = conn.execute("SELECT max_devices, expires_at FROM activation_keys WHERE key_code = %s",
                       (lic["key_code"],)).fetchone()
assert row is not None and row[0] == plan["included_seats"], (lic["key_code"], row)

# Replay guard: the consumed order cannot be verified twice
r = client.post("/api/public/checkout/verify", json={"order_id": order["order_id"]}, headers=auth)
assert r.status_code == 400, r.text

print("FUNNEL_OK key", lic["key_code"], "devices", lic["max_devices"])
