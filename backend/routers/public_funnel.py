"""Router: extracted from main.py (pure code motion, no behavior change)."""
import os
import secrets
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from datetime import date as _date

from core import (
    current_user_id,
    db,
    generate_key_code,
    hash_password,
    issue_token,
    q,
)

router = APIRouter()


# Public storefront API (storefront/ app): signup -> plans -> onboard -> checkout -> license
# No admin role required — the purchaser's own user JWT (from /auth/login or signup) is
# the only credential. Tenant is created at onboarding but stays inert (no subscription,
# so zero entitlement) until checkout verification attaches plan + key.
# ============================================================

# EDOVA_RAZORPAY_MODE=simulated (default) keeps the demo flow self-contained; "live"
# would swap order creation/verification for the Razorpay Orders API + signature check.
RAZORPAY_MODE = os.getenv("EDOVA_RAZORPAY_MODE", "simulated")


class SignupIn(BaseModel):
    email: str
    password: str
    full_name: str


@router.post("/api/public/signup", status_code=201)
def public_signup(body: SignupIn):
    if len(body.password) < 8:
        raise HTTPException(400, "password must be at least 8 characters")
    if "@" not in body.email:
        raise HTTPException(400, "invalid email")
    with db() as conn:
        if q(conn, "SELECT 1 FROM users WHERE email = %s", (body.email,)).fetchone() is not None:
            raise HTTPException(409, "email already registered — sign in instead")
        uid = q(conn, "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id",
                (body.email.strip().lower(), hash_password(body.password), body.full_name.strip())).fetchone()[0]
    return {"access_token": issue_token(str(uid)), "token_type": "bearer"}


@router.get("/api/public/plans")
def public_plans():
    """Storefront pricing cards — only plans with a public price."""
    with db() as conn:
        rows = q(conn, "SELECT id, name, tier_level, allow_video, allow_lab, allow_quiz, price_inr, blurb, included_seats "
                       "FROM subscription_plans WHERE price_inr > 0 ORDER BY tier_level").fetchall()
    return {"plans": [{"id": str(r[0]), "name": r[1], "tier_level": r[2],
                       "allow_video": r[3], "allow_lab": r[4], "allow_quiz": r[5],
                       "price_inr": r[6], "blurb": r[7], "included_seats": r[8]} for r in rows]}


class OnboardIn(BaseModel):
    school_name: str
    # Seat count is plan-fixed (migration 017) and resolved at order time — not collected here.


def _purchaser_tenant(conn, uid: str):
    return q(conn, "SELECT t.id, t.name FROM tenants t "
                   "JOIN user_tenant_mappings m ON m.tenant_id = t.id "
                   "WHERE m.user_id = %s AND m.role = 'ADMIN' AND t.type = 'SCHOOL'", (uid,)).fetchone()


def _require_tenant_admin(conn, uid: str, tenant_id) -> None:
    """403 unless uid holds the ADMIN role for tenant_id. Guards tenant-scoped public writes."""
    if q(conn, "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s AND role = 'ADMIN'",
         (uid, tenant_id)).fetchone() is None:
        raise HTTPException(403, "not your school")


@router.post("/api/public/schools/onboard", status_code=201)
def public_onboard(body: OnboardIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    if not body.school_name.strip():
        raise HTTPException(400, "school_name must not be empty")
    with db() as conn:
        existing = _purchaser_tenant(conn, uid)
        if existing is not None:  # idempotent: re-entering details updates the draft school
            q(conn, "UPDATE tenants SET name = %s WHERE id = %s", (body.school_name.strip(), existing[0]))
            return {"tenant_id": str(existing[0]), "name": body.school_name.strip(), "existing": True}
        tid = q(conn, "INSERT INTO tenants (name, type, status) VALUES (%s, 'SCHOOL', 'ACTIVE') RETURNING id",
                (body.school_name.strip(),)).fetchone()[0]
        q(conn, "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'ADMIN')",
          (uid, tid))
    return {"tenant_id": str(tid), "name": body.school_name.strip(), "existing": False}


# Simulated order book: order_id -> {tenant_id, plan_id, amount_paise, seat_count}.
# In-memory like the rate limiter — fine for single-process MVP; live mode replaces it
# with Razorpay order ids verified by signature.
_sim_orders: dict = {}


class OrderIn(BaseModel):
    plan_id: str
    tenant_id: str


@router.post("/api/public/checkout/create-order", status_code=201)
def public_create_order(body: OrderIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    with db() as conn:
        _require_tenant_admin(conn, uid, body.tenant_id)
        plan = q(conn, "SELECT name, price_inr, included_seats FROM subscription_plans "
                       "WHERE id = %s AND price_inr > 0", (body.plan_id,)).fetchone()
        if plan is None:
            raise HTTPException(404, "plan not found")
    order_id = f"order_sim_{secrets.token_hex(8)}"
    _sim_orders[order_id] = {"tenant_id": body.tenant_id, "plan_id": body.plan_id,
                             "amount_paise": plan[1] * 100, "seat_count": plan[2]}
    return {"order_id": order_id, "amount_paise": plan[1] * 100, "currency": "INR",
            "plan_name": plan[0], "mode": RAZORPAY_MODE}


class VerifyIn(BaseModel):
    order_id: str
    # Live Razorpay mode will add payment_id + signature here; simulated mode needs neither.


@router.post("/api/public/checkout/verify")
def public_verify_checkout(body: VerifyIn, authorization: str = Header(...)):
    """Payment confirmed -> subscription + activation key. The moment a draft school
    becomes a paying customer. Simulated mode trusts the modal; live mode must verify
    the Razorpay signature BEFORE this provisioning runs."""
    uid = current_user_id(authorization)
    order = _sim_orders.pop(body.order_id, None)  # pop: one key per paid order, replay-safe
    if order is None:
        raise HTTPException(400, "unknown or already-consumed order")
    with db() as conn:
        _require_tenant_admin(conn, uid, order["tenant_id"])
        start = _date.today()
        try:
            end = start.replace(year=start.year + 1)
        except ValueError:  # Feb 29 checkout -> Feb 28 of the following non-leap year
            end = start.replace(year=start.year + 1, day=28)
        q(conn, "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, seat_count) "
                "VALUES (%s, %s, %s, %s, %s)",
          (order["tenant_id"], order["plan_id"], start, end, order["seat_count"]))
        key_code = None
        for _ in range(5):
            candidate = generate_key_code()
            row = q(conn, "INSERT INTO activation_keys (key_code, tenant_id, max_devices, expires_at) "
                          "VALUES (%s, %s, %s, %s) ON CONFLICT (key_code) DO NOTHING RETURNING id",
                    (candidate, order["tenant_id"], order["seat_count"], end)).fetchone()
            if row is not None:
                key_code = candidate
                break
        if key_code is None:  # all 5 inserts collided: raising rolls back the subscription too
            raise HTTPException(500, "key generation collision; retry")
        school = q(conn, "SELECT name FROM tenants WHERE id = %s", (order["tenant_id"],)).fetchone()[0]
    return {"activated": True, "tenant_id": order["tenant_id"], "school_name": school,
            "key_code": key_code, "max_devices": order["seat_count"],
            "subscription_start": start.isoformat(), "subscription_end": end.isoformat()}
