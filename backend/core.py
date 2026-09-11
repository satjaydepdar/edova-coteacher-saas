"""Shared core: auth, DB access, entitlement, and content-sanitization helpers
used across main.py's route handlers. Pure extraction from main.py -- behavior
unchanged, just relocated so routers can depend on this instead of on main.py
(which would create circular imports once routes move into their own modules)."""
import hashlib
import hmac
import os
import secrets
import time
from contextvars import ContextVar

import bcrypt
import bleach
import jwt
import psycopg
from fastapi import Header, HTTPException

DB_DSN = os.getenv("EDOVA_DB_DSN", "postgresql://postgres:edova@127.0.0.1:5432/edtech_platform")

JWT_SECRET = os.getenv("EDOVA_JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = 24 * 3600

_qcount: ContextVar[list] = ContextVar("qcount")

def q(conn, sql, params=()):
    _qcount.get()[0] += 1
    return conn.execute(sql, params)

ENTITLEMENT_SQL = """
SELECT t.id AS tenant_id, t.name AS tenant_name, t.type AS tenant_type,
       bool_or(sp.allow_video) AS allow_video,
       bool_or(sp.allow_lab)   AS allow_lab,
       bool_or(sp.allow_quiz)  AS allow_quiz,
       coalesce(max(sp.tier_level), 1) AS tier_level
FROM users u
JOIN user_tenant_mappings utm ON u.id = utm.user_id
JOIN tenants t ON utm.tenant_id = t.id
JOIN subscriptions s ON t.id = s.tenant_id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE u.id = %s
  AND utm.role = ANY(%s)
  AND t.status = 'ACTIVE'
  AND s.end_date >= CURRENT_DATE
GROUP BY t.id, t.name, t.type
"""

def db():
    return psycopg.connect(DB_DSN)

BCRYPT_ROUNDS = 12


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(BCRYPT_ROUNDS)).decode()


def is_legacy_hash(stored: str) -> bool:
    return not stored.startswith("$2")  # bcrypt hashes start $2a/$2b/$2y


def verify_password(pw: str, stored: str) -> bool:
    if not is_legacy_hash(stored):
        return bcrypt.checkpw(pw.encode(), stored.encode())
    iterations, salt_hex, hash_hex = stored.split("$")
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt_hex), int(iterations))
    return hmac.compare_digest(dk.hex(), hash_hex)

def current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(401, "invalid or expired token")
    return payload["sub"]

def issue_token(user_id: str, exp_offset: int = JWT_TTL_SECONDS) -> str:
    now = int(time.time())
    return jwt.encode({"sub": user_id, "iat": now, "exp": now + exp_offset}, JWT_SECRET, algorithm=JWT_ALG)

STUDENT_ONLY = ("STUDENT",)
CLASSROOM = ("STUDENT", "TEACHER")  # content engines serve both roles

def single_tenant_or_raise(user_id: str, roles=STUDENT_ONLY):
    """v1 rule: exactly one active entitled tenant per user (per role set)."""
    with db() as conn:
        rows = q(conn, ENTITLEMENT_SQL, (user_id, list(roles))).fetchall()
    if not rows:
        raise HTTPException(403, "no active subscription")
    if len(rows) > 1:
        raise HTTPException(409, "multiple active tenants; tenant selection unsupported in v1")
    return rows[0]

KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L — readable over the phone

def generate_key_code() -> str:
    group = lambda: "".join(secrets.choice(KEY_ALPHABET) for _ in range(4))
    return f"EDOVA-{group()}-{group()}-{group()}"

def decode_payload(authorization: str) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    try:
        return jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(401, "invalid or expired token")

DEVICE_ENTITLEMENT_SQL = """
SELECT t.id AS tenant_id, t.name AS tenant_name, t.type AS tenant_type,
       bool_or(sp.allow_video) AS allow_video,
       bool_or(sp.allow_lab)   AS allow_lab,
       bool_or(sp.allow_quiz)  AS allow_quiz,
       coalesce(max(sp.tier_level), 1) AS tier_level
FROM device_activations da
JOIN activation_keys k ON k.id = da.key_id
JOIN tenants t ON t.id = k.tenant_id
JOIN subscriptions s ON s.tenant_id = t.id AND s.end_date >= CURRENT_DATE
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE da.key_id = %s AND da.device_id = %s
  AND k.status = 'ACTIVE' AND k.expires_at >= CURRENT_DATE
  AND t.status = 'ACTIVE'
GROUP BY t.id, t.name, t.type
"""

def current_principal(authorization: str, roles=CLASSROOM) -> dict:
    """Accepts a device token (MVP app) or a user token (deferred student/teacher flows).
    Content-consumption endpoints use this; per-student persistence stays user-only.
    `roles` applies only to user tokens; device tokens are role-less."""
    payload = decode_payload(authorization)
    if payload.get("typ") == "device":
        with db() as conn:
            row = q(conn, DEVICE_ENTITLEMENT_SQL, (payload["kid"], payload["did"])).fetchone()
        if row is None:
            raise HTTPException(403, "activation invalid or subscription expired")
        return {"kind": "device", "tenant_id": row[0], "tenant_name": row[1], "tenant_type": row[2],
                "features": {"allow_video": row[3], "allow_lab": row[4], "allow_quiz": row[5], "tier_level": row[6]},
                "user_id": None, "key_id": payload["kid"], "device_id": payload["did"]}
    uid = payload["sub"]
    tenant_id, name, ttype, av, al, aq, tier = single_tenant_or_raise(uid, roles)
    return {"kind": "user", "tenant_id": tenant_id, "tenant_name": name, "tenant_type": ttype,
            "features": {"allow_video": av, "allow_lab": al, "allow_quiz": aq, "tier_level": tier},
            "user_id": uid, "key_id": None, "device_id": None}

def get_admin(authorization: str = Header(...)) -> dict:
    """ADMIN-role gate for /admin/*. v1: an admin with multiple tenants uses the
    PLATFORM one if present, else their first — multi-tenant admin UX is deferred."""
    uid = current_user_id(authorization)
    with db() as conn:
        rows = q(conn, "SELECT t.id, t.type FROM user_tenant_mappings utm "
                       "JOIN tenants t ON t.id = utm.tenant_id "
                       "WHERE utm.user_id = %s AND utm.role = 'ADMIN'", (uid,)).fetchall()
    if not rows:
        raise HTTPException(403, "admin role required")
    platform = [r for r in rows if r[1] == "PLATFORM"]
    chosen = platform[0] if platform else rows[0]
    return {"user_id": uid, "tenant_id": chosen[0], "is_platform": bool(platform)}

def authorize_subject_tenant(admin: dict, subject_tenant_id) -> None:
    """Platform admins: everything. School admins: only subjects of their own tenant."""
    if admin["is_platform"]:
        return
    if subject_tenant_id is None or str(subject_tenant_id) != str(admin["tenant_id"]):
        raise HTTPException(403, "cannot manage content outside your tenant")

_RICH_TEXT_TAGS = ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "img", "span"]
_RICH_TEXT_ATTRS = {"a": ["href"], "img": ["src", "alt"], "span": ["class", "data-latex"]}


def sanitize_rich_text(html: str | None) -> str | None:
    if html is None:
        return None
    return bleach.clean(html, tags=_RICH_TEXT_TAGS, attributes=_RICH_TEXT_ATTRS,
                         protocols=["http", "https"], strip=True)

def sanitize_plain_text(text: str) -> str:
    """For short classification tags (source paper names) — no formatting at all,
    just strips any markup down to bare text."""
    return bleach.clean(text, tags=[], attributes={}, strip=True).strip()

MODULE_GUARD_SQL = """
SELECT m.module_type, m.chapter_id
FROM modules m
JOIN chapters c ON c.id = m.chapter_id
JOIN subjects s ON s.id = c.subject_id
WHERE m.id = %s AND (s.tenant_id IS NULL OR s.tenant_id = %s)
"""

def guarded_module(conn, module_id: str, tenant_id):
    row = q(conn, MODULE_GUARD_SQL, (module_id, tenant_id)).fetchone()
    if row is None:
        raise HTTPException(404, "module not found")  # also cross-tenant (IDOR-safe)
    return row  # (module_type, chapter_id)

DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}
