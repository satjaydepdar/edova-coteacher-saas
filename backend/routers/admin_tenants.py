"""Router: extracted from main.py (pure code motion, no behavior change)."""
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from datetime import date as _date

from core import (
    db,
    get_admin,
    hash_password,
    q,
)

router = APIRouter()


# --- Schools (tenants) + subscriptions: platform-only. Key CRUD already exists
# at /admin/tenants/{tenant_id}/activation-keys ---
class TenantIn(BaseModel):
    name: str


@router.post("/admin/tenants", status_code=201)
def create_tenant(body: TenantIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"]:
        raise HTTPException(403, "only platform admins create schools")
    if not body.name.strip():
        raise HTTPException(400, "name must not be empty")
    with db() as conn:
        tid = q(conn, "INSERT INTO tenants (name, type, status) VALUES (%s, 'SCHOOL', 'ACTIVE') "
                      "RETURNING id", (body.name.strip(),)).fetchone()[0]
    return {"id": str(tid)}


@router.get("/admin/tenants")
def list_tenants(authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"]:
        raise HTTPException(403, "only platform admins list schools")
    with db() as conn:
        rows = q(conn, """
SELECT t.id, t.name, t.status, t.created_at,
       sp.name, s.end_date, s.seat_count,
       (SELECT count(*) FROM activation_keys k WHERE k.tenant_id = t.id AND k.status = 'ACTIVE'),
       (SELECT count(*) FROM user_tenant_mappings utm WHERE utm.tenant_id = t.id)
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id AND s.end_date >= CURRENT_DATE
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE t.type = 'SCHOOL'
ORDER BY t.created_at DESC
""").fetchall()
    return {"tenants": [
        {"id": str(r[0]), "name": r[1], "status": r[2], "created_at": r[3].isoformat(),
         "active_plan": r[4], "subscription_ends": r[5].isoformat() if r[5] else None,
         "seat_count": r[6], "active_keys": r[7], "user_count": r[8]}
        for r in rows]}


@router.get("/admin/subscription-plans")
def list_plans(authorization: str = Header(...)):
    get_admin(authorization)  # any admin may read plans (needed for CMS dropdowns)
    with db() as conn:
        rows = q(conn, "SELECT id, name, tier_level, allow_video, allow_lab, allow_quiz "
                       "FROM subscription_plans ORDER BY tier_level").fetchall()
    return {"plans": [{"id": str(r[0]), "name": r[1], "tier_level": r[2],
                       "allow_video": r[3], "allow_lab": r[4], "allow_quiz": r[5]}
                      for r in rows]}


class SubscriptionIn(BaseModel):
    plan_id: str
    start_date: _date
    end_date: _date
    seat_count: int = 1


@router.post("/admin/tenants/{tenant_id}/subscriptions", status_code=201)
def create_subscription(tenant_id: str, body: SubscriptionIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"]:
        raise HTTPException(403, "only platform admins assign subscriptions")
    if body.end_date < body.start_date:
        raise HTTPException(400, "end_date must not precede start_date")
    if body.seat_count <= 0:
        raise HTTPException(400, "seat_count must be positive")
    with db() as conn:
        if q(conn, "SELECT 1 FROM tenants WHERE id = %s AND type = 'SCHOOL'", (tenant_id,)).fetchone() is None:
            raise HTTPException(404, "school not found")
        if q(conn, "SELECT 1 FROM subscription_plans WHERE id = %s", (body.plan_id,)).fetchone() is None:
            raise HTTPException(404, "plan not found")
        sid = q(conn, "INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, seat_count) "
                      "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (tenant_id, body.plan_id, body.start_date, body.end_date, body.seat_count)).fetchone()[0]
    return {"id": str(sid)}


# --- Users: school admin manages own tenant's users; platform manages any ---
class UserIn(BaseModel):
    email: str
    password: str
    full_name: str
    tenant_id: str
    role: str  # STUDENT | TEACHER | ADMIN


@router.post("/admin/users", status_code=201)
def create_user(body: UserIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.role not in ("STUDENT", "TEACHER", "ADMIN"):
        raise HTTPException(400, "role must be STUDENT, TEACHER, or ADMIN")
    if not admin["is_platform"] and str(body.tenant_id) != str(admin["tenant_id"]):
        raise HTTPException(403, "cannot create users outside your tenant")
    if len(body.password) < 8:
        raise HTTPException(400, "password must be at least 8 characters")
    with db() as conn:
        if q(conn, "SELECT 1 FROM tenants WHERE id = %s", (body.tenant_id,)).fetchone() is None:
            raise HTTPException(404, "tenant not found")
        if q(conn, "SELECT 1 FROM users WHERE email = %s", (body.email,)).fetchone() is not None:
            raise HTTPException(409, "email already registered")
        uid = q(conn, "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id",
                (body.email, hash_password(body.password), body.full_name)).fetchone()[0]
        q(conn, "INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, %s)",
          (uid, body.tenant_id, body.role))
    return {"id": str(uid)}


@router.get("/admin/users")
def list_users(tenant_id: str | None = Query(None), authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"]:
        tenant_id = str(admin["tenant_id"])  # school admins see only their own
    with db() as conn:
        clauses, params = ["1=1"], []
        if tenant_id is not None:
            clauses.append("utm.tenant_id = %s"); params.append(tenant_id)
        rows = q(conn, f"""
SELECT u.id, u.email, u.full_name, utm.role, t.name, u.created_at
FROM user_tenant_mappings utm
JOIN users u ON u.id = utm.user_id
JOIN tenants t ON t.id = utm.tenant_id
WHERE {' AND '.join(clauses)}
ORDER BY u.created_at DESC LIMIT 500
""", params).fetchall()
    return {"users": [{"id": str(r[0]), "email": r[1], "full_name": r[2], "role": r[3],
                       "tenant_name": r[4], "created_at": r[5].isoformat()} for r in rows]}


class PasswordResetIn(BaseModel):
    password: str


@router.post("/admin/users/{user_id}/password")
def reset_user_password(user_id: str, body: PasswordResetIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if len(body.password) < 8:
        raise HTTPException(400, "password must be at least 8 characters")
    with db() as conn:
        if not admin["is_platform"]:
            row = q(conn, "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s",
                    (user_id, admin["tenant_id"])).fetchone()
            if row is None:
                raise HTTPException(404, "user not found")  # IDOR-safe, not 403
        res = q(conn, "UPDATE users SET password_hash = %s WHERE id = %s RETURNING id",
                (hash_password(body.password), user_id)).fetchone()
        if res is None:
            raise HTTPException(404, "user not found")
    return {"id": user_id, "password_reset": True}

