"""Router: extracted from main.py (pure code motion, no behavior change)."""
import time
import jwt
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from datetime import date as _date

from core import (
    DEVICE_ENTITLEMENT_SQL,
    JWT_ALG,
    JWT_SECRET,
    current_principal,
    db,
    decode_payload,
    generate_key_code,
    get_admin,
    q,
)

router = APIRouter()


# ============================================================
# Activation keys (requirement §2, §8, §14) — doc-literal MVP auth.
# The app activates with a one-time key, receives a long-lived device token,
# and the backend re-validates key + school + subscription on EVERY request.
# ============================================================


DEVICE_TOKEN_TTL_SECONDS = 365 * 24 * 3600  # long-lived; real gating is server-side per request




def issue_device_token(key_id: str, device_id: str) -> str:
    now = int(time.time())
    return jwt.encode({"typ": "device", "kid": key_id, "did": device_id,
                       "iat": now, "exp": now + DEVICE_TOKEN_TTL_SECONDS},
                      JWT_SECRET, algorithm=JWT_ALG)





class ActivateIn(BaseModel):
    key_code: str
    device_id: str


@router.post("/api/activation/activate")
def activate(body: ActivateIn):
    code = body.key_code.strip().upper()
    device_id = body.device_id.strip()
    if not device_id or len(device_id) > 128:
        raise HTTPException(422, "device_id must be a non-empty stable install identifier")
    with db() as conn:  # single transaction: device-limit check + insert are atomic
        row = q(conn, "SELECT k.id, k.status, k.expires_at, k.max_devices, k.tenant_id, "
                      "t.status, t.name, t.type "
                      "FROM activation_keys k JOIN tenants t ON t.id = k.tenant_id "
                      "WHERE k.key_code = %s", (code,)).fetchone()
        if row is None:
            raise HTTPException(404, "invalid_activation_key")
        key_id, status, expires_at, max_devices, tenant_id, t_status, t_name, t_type = row
        if status == "REVOKED":
            raise HTTPException(403, "key_revoked")
        if t_status != "ACTIVE":
            raise HTTPException(403, "school_inactive")
        # Doc §14 order: subscription validity before key expiry — an expired subscription
        # must tell the school to renew, not misreport as a key problem.
        sub = q(conn, "SELECT bool_or(sp.allow_video), bool_or(sp.allow_lab), bool_or(sp.allow_quiz), "
                      "max(s.end_date), coalesce(max(sp.tier_level), 1) FROM subscriptions s "
                      "JOIN subscription_plans sp ON sp.id = s.plan_id "
                      "WHERE s.tenant_id = %s AND s.end_date >= CURRENT_DATE "
                      "GROUP BY s.tenant_id", (tenant_id,)).fetchone()
        if sub is None:
            raise HTTPException(403, "subscription_expired")
        if expires_at < _date.today():
            raise HTTPException(403, "key_expired")

        existing = q(conn, "SELECT 1 FROM device_activations WHERE key_id = %s AND device_id = %s",
                     (key_id, device_id)).fetchone()
        if existing is None:  # idempotent re-activate for an already-registered device
            used = q(conn, "SELECT count(*) FROM device_activations WHERE key_id = %s",
                     (key_id,)).fetchone()[0]
            if used >= max_devices:
                raise HTTPException(403, "device_limit_reached")
            q(conn, "INSERT INTO device_activations (key_id, device_id) VALUES (%s, %s)",
              (key_id, device_id))
            q(conn, "UPDATE activation_keys SET status = 'ACTIVE', "
                    "activated_at = COALESCE(activated_at, now()) WHERE id = %s", (key_id,))

    return {
        "access_token": issue_device_token(str(key_id), device_id),
        "token_type": "bearer",
        "tenant": {"name": t_name, "type": t_type},
        "features": {"allow_video": sub[0], "allow_lab": sub[1], "allow_quiz": sub[2], "tier_level": sub[4]},
        "expires_at": sub[3].isoformat(),
    }


@router.get("/api/activation/session")
def activation_session(authorization: str = Header(...)):
    """App boot: validate the stored device token or user token; 403 -> show activation/expired screen."""
    payload = decode_payload(authorization)
    if payload.get("typ") == "device":
        with db() as conn:
            row = q(conn, DEVICE_ENTITLEMENT_SQL, (payload["kid"], payload["did"])).fetchone()
            if row is None:
                raise HTTPException(403, "activation invalid or subscription expired")
            exp = q(conn, "SELECT expires_at FROM activation_keys WHERE id = %s",
                    (payload["kid"],)).fetchone()[0]
        return {"tenant": {"name": row[1], "type": row[2]},
                "features": {"allow_video": row[3], "allow_lab": row[4], "allow_quiz": row[5], "tier_level": row[6]},
                "expires_at": exp.isoformat()}
    p = current_principal(authorization)
    return {
        "tenant": {"name": p["tenant_name"], "type": p["tenant_type"]},
        "features": p["features"],
        "expires_at": "2099-12-31T23:59:59"
    }


@router.get("/api/app/subjects")
def app_subjects(authorization: str = Header(...)):
    p = current_principal(authorization)
    with db() as conn:
        rows = q(conn, "SELECT id, name, standard_grade, thumbnail_url, sequence_order FROM subjects "
                       "WHERE tenant_id IS NULL OR tenant_id = %s ORDER BY sequence_order",
                 (p["tenant_id"],)).fetchall()
    return {"subjects": [{"id": str(r[0]), "name": r[1], "standard_grade": r[2],
                          "thumbnail_url": r[3], "sequence_order": r[4]} for r in rows],
            "features": p["features"]}


# --- Admin: activation key lifecycle (generate / list / revoke) ---
class ActivationKeyIn(BaseModel):
    max_devices: int = 1
    expires_at: str | None = None  # YYYY-MM-DD; default = tenant's latest subscription end


@router.post("/admin/tenants/{tenant_id}/activation-keys", status_code=201)
def create_activation_key(tenant_id: str, body: ActivationKeyIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"] and str(admin["tenant_id"]) != tenant_id:
        raise HTTPException(403, "cannot manage keys outside your tenant")
    if body.max_devices <= 0:
        raise HTTPException(422, "max_devices must be positive")
    with db() as conn:
        if q(conn, "SELECT 1 FROM tenants WHERE id = %s", (tenant_id,)).fetchone() is None:
            raise HTTPException(404, "tenant not found")
        expires = body.expires_at
        if expires is None:
            row = q(conn, "SELECT max(end_date) FROM subscriptions WHERE tenant_id = %s",
                    (tenant_id,)).fetchone()
            if row is None or row[0] is None:
                raise HTTPException(422, "tenant has no subscription to bind key expiry to")
            expires = row[0].isoformat()
        key_id, key_code = None, None
        for _ in range(5):  # retry on the (astronomically unlikely) key_code collision
            key_code = generate_key_code()
            row = q(conn, "INSERT INTO activation_keys (key_code, tenant_id, max_devices, expires_at) "
                          "VALUES (%s, %s, %s, %s) ON CONFLICT (key_code) DO NOTHING RETURNING id",
                    (key_code, tenant_id, body.max_devices, expires)).fetchone()
            if row is not None:
                key_id = row[0]
                break
        if key_id is None:
            raise HTTPException(500, "key generation collision; retry")
    return {"id": str(key_id), "key_code": key_code, "tenant_id": tenant_id,
            "max_devices": body.max_devices, "expires_at": expires, "status": "UNUSED"}


@router.get("/admin/tenants/{tenant_id}/activation-keys")
def list_activation_keys(tenant_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not admin["is_platform"] and str(admin["tenant_id"]) != tenant_id:
        raise HTTPException(403, "cannot manage keys outside your tenant")
    with db() as conn:
        rows = q(conn, "SELECT k.id, k.key_code, k.max_devices, k.status, k.expires_at, "
                       "k.activated_at, k.created_at, count(da.id) AS devices_used "
                       "FROM activation_keys k "
                       "LEFT JOIN device_activations da ON da.key_id = k.id "
                       "WHERE k.tenant_id = %s "
                       "GROUP BY k.id ORDER BY k.created_at DESC", (tenant_id,)).fetchall()
    return {"keys": [{"id": str(r[0]), "key_code": r[1], "max_devices": r[2],
                      "status": "EXPIRED" if r[4] < _date.today()
                                and r[3] != "REVOKED" else r[3],
                      "expires_at": r[4].isoformat(),
                      "activated_at": r[5].isoformat() if r[5] else None,
                      "created_at": r[6].isoformat(), "devices_used": r[7]} for r in rows]}


@router.post("/admin/activation-keys/{key_id}/revoke")
def revoke_activation_key(key_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT tenant_id FROM activation_keys WHERE id = %s", (key_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "activation key not found")
        if not admin["is_platform"] and str(admin["tenant_id"]) != str(row[0]):
            raise HTTPException(403, "cannot manage keys outside your tenant")
        q(conn, "UPDATE activation_keys SET status = 'REVOKED' WHERE id = %s", (key_id,))
    return {"id": key_id, "status": "REVOKED"}
