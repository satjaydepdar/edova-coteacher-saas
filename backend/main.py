"""edova-coteacher API — Phase 3A: student auth & entitlement boot; 3B: content tree."""
import hashlib
import hmac
import os
import secrets
import threading
import time
from collections import defaultdict
from contextvars import ContextVar
from uuid import UUID

import bcrypt
import jwt
import psycopg
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

DB_DSN = os.getenv("EDOVA_DB_DSN", "postgresql://postgres:edova@127.0.0.1:5432/edtech_platform")
JWT_SECRET = os.getenv("EDOVA_JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = 24 * 3600

app = FastAPI(title="edova-coteacher API")

# CORS: comma-separated EDOVA_CORS_ORIGINS in production (app origin, web origin).
# Default "*" keeps local dev (Vite on :5173) zero-config.
from fastapi.middleware.cors import CORSMiddleware
_cors_origins = [o.strip() for o in os.getenv("EDOVA_CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"])

# Fail fast on insecure production config (requirement §12). Set
# EDOVA_ENVIRONMENT=production in deploy/.env; development stays zero-config.
ENVIRONMENT = os.getenv("EDOVA_ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    if JWT_SECRET == "dev-secret-change-me":
        raise RuntimeError("EDOVA_JWT_SECRET must be set to a random value in production")
    if "*" in _cors_origins:
        raise RuntimeError("EDOVA_CORS_ORIGINS must not contain '*' in production")

# --- query-count instrumentation (X-Query-Count header; N+1 detection) ---
# Mutable cell: sync endpoints run in a threadpool copy of the context,
# so an int set() inside the endpoint would not propagate back. A shared list does.
_qcount: ContextVar[list] = ContextVar("qcount")


@app.middleware("http")
async def query_count_header(request: Request, call_next):
    token = _qcount.set([0])
    response = await call_next(request)
    response.headers["X-Query-Count"] = str(_qcount.get()[0])
    _qcount.reset(token)
    return response


# --- rate limiting (requirement §12): in-memory sliding window per client IP ---
# Only FAILED attempts (4xx) count: brute-force gets throttled while legitimate
# users behind a shared school NAT are never locked out by their own traffic.
# Single-process MVP (same tradeoff as the transcode thread queue); horizontal
# scaling moves this to the proxy or Redis.
RATE_LIMITS = {  # exact path -> (max failed attempts, window seconds)
    "/auth/login": (10, 60),
    "/api/activation/activate": (60, 60),  # generous: a classroom activates behind one NAT IP
}
_rate_hits: dict[tuple[str, str], list[float]] = defaultdict(list)
_rate_lock = threading.Lock()


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    limit_window = RATE_LIMITS.get(request.url.path)
    if limit_window is None:
        return await call_next(request)
    limit, window = limit_window
    ip = request.client.host if request.client else "-"
    key = (request.url.path, ip)
    now = time.monotonic()
    with _rate_lock:
        _rate_hits[key] = hits = [t for t in _rate_hits[key] if now - t < window]
        if len(hits) >= limit:
            return JSONResponse({"detail": "rate limit exceeded, retry later"}, status_code=429)
    response = await call_next(request)
    if 400 <= response.status_code < 500:
        with _rate_lock:
            _rate_hits[key].append(now)
    return response


# --- admin audit log (requirement §12: "Audit important admin operations") ---
# Every non-GET /admin/* request is recorded with actor, action, path, outcome and
# IP — including 401/403 denials. Request BODIES ARE NEVER LOGGED: the password
# reset endpoint would otherwise leak credentials into the log. Auditing runs on
# its own connection and can never fail the request itself.
def _write_audit(actor_user_id, method: str, path: str, status_code: int, ip: str | None) -> None:
    try:
        with psycopg.connect(DB_DSN, autocommit=True) as conn:
            conn.execute(
                "INSERT INTO admin_audit_log (actor_user_id, action, path, status_code, ip) "
                "VALUES (%s, %s, %s, %s, %s)",
                (actor_user_id, method, path, status_code, ip))
    except Exception:
        pass  # table may not exist yet (pre-migration-014); never break a request


@app.middleware("http")
async def admin_audit(request: Request, call_next):
    path = request.url.path
    if request.method == "GET" or not path.startswith("/admin/"):
        return await call_next(request)
    response = await call_next(request)
    actor = None
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        try:
            actor = jwt.decode(auth[7:], JWT_SECRET, algorithms=[JWT_ALG])["sub"]
        except jwt.PyJWTError:
            pass  # forged/expired token: still logged, actor NULL
    _write_audit(actor, request.method, path, response.status_code,
                 request.client.host if request.client else None)
    return response


def q(conn, sql, params=()):
    _qcount.get()[0] += 1
    return conn.execute(sql, params)


# Phase-1A entitlement query, aggregated per tenant (bool_or across overlapping subs)
ENTITLEMENT_SQL = """
SELECT t.id AS tenant_id, t.name AS tenant_name, t.type AS tenant_type,
       bool_or(sp.allow_video) AS allow_video,
       bool_or(sp.allow_lab)   AS allow_lab,
       bool_or(sp.allow_quiz)  AS allow_quiz
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

# Phase-3B flat tree query: subjects-driven LEFT JOINs, one round trip.
# No rows at all -> subject invisible to this tenant (404). chapter_id NULL -> no chapters yet.
# Topics (migration 012): modules group under their topic; topic_id NULL -> ungrouped bucket.
TREE_SQL = """
SELECT s.name AS subject_name,
       c.id AS chapter_id, c.name AS chapter_name, c.sequence_order AS chapter_seq,
       t.id AS topic_id, t.name AS topic_name, t.sequence_order AS topic_seq,
       m.id AS module_id, m.title AS module_title, m.module_type, m.sequence_order AS module_seq,
       vp.thumbnail_url
FROM subjects s
LEFT JOIN chapters c ON c.subject_id = s.id
LEFT JOIN modules m ON m.chapter_id = c.id AND m.is_published
LEFT JOIN topics t ON t.id = m.topic_id
LEFT JOIN video_payloads vp ON vp.module_id = m.id
WHERE s.id = %s AND (s.tenant_id IS NULL OR s.tenant_id = %s)
ORDER BY c.sequence_order, t.sequence_order NULLS LAST, m.sequence_order
"""


def db():
    return psycopg.connect(DB_DSN)


# --- passwords: bcrypt for new hashes (requirement §12). Legacy pbkdf2 hashes
# ("iterations$salt$hash") still verify and are transparently rehashed to bcrypt
# on next successful login — no mass password reset needed. ---
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


# --- auth ---
class LoginIn(BaseModel):
    email: str
    password: str


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


@app.post("/auth/login")
def login(body: LoginIn):
    with db() as conn:
        row = q(conn, "SELECT id, password_hash FROM users WHERE email = %s", (body.email,)).fetchone()
        if row is None or not verify_password(body.password, row[1]):
            raise HTTPException(401, "invalid credentials")
        if is_legacy_hash(row[1]):  # opportunistic migration: pbkdf2 -> bcrypt
            q(conn, "UPDATE users SET password_hash = %s WHERE id = %s",
              (hash_password(body.password), row[0]))
    return {"access_token": issue_token(str(row[0])), "token_type": "bearer"}


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


# --- Phase 3A boot endpoint ---
@app.get("/api/student/session")
def student_session(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, tenant_name, tenant_type, allow_video, allow_lab, allow_quiz = single_tenant_or_raise(uid)
    with db() as conn:
        user = q(conn, "SELECT id, full_name, email FROM users WHERE id = %s", (uid,)).fetchone()
    return {
        "user": {"id": str(user[0]), "name": user[1], "email": user[2]},
        "tenant": {"name": tenant_name, "type": tenant_type},
        "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz},
    }


# --- Teacher boot endpoint (classroom app): school entitlement, TEACHER role ---
@app.get("/api/teacher/session")
def teacher_session(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, tenant_name, tenant_type, allow_video, allow_lab, allow_quiz = \
        single_tenant_or_raise(uid, ("TEACHER",))
    with db() as conn:
        user = q(conn, "SELECT id, full_name, email FROM users WHERE id = %s", (uid,)).fetchone()
    return {
        "user": {"id": str(user[0]), "name": user[1], "email": user[2]},
        "role": "TEACHER",
        "tenant": {"name": tenant_name, "type": tenant_type},
        "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz},
    }


# --- Teacher subject shelf: global curriculum + own school's custom content ---
@app.get("/api/teacher/subjects")
def teacher_subjects(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, allow_video, allow_lab, allow_quiz = single_tenant_or_raise(uid, CLASSROOM)
    with db() as conn:
        rows = q(conn, "SELECT id, name, standard_grade, thumbnail_url, sequence_order FROM subjects "
                       "WHERE tenant_id IS NULL OR tenant_id = %s ORDER BY sequence_order", (tenant_id,)).fetchall()
    return {"subjects": [{"id": str(r[0]), "name": r[1], "standard_grade": r[2],
                          "thumbnail_url": r[3], "sequence_order": r[4]} for r in rows],
            "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz}}


# ============================================================
# Activation keys (requirement §2, §8, §14) — doc-literal MVP auth.
# The app activates with a one-time key, receives a long-lived device token,
# and the backend re-validates key + school + subscription on EVERY request.
# ============================================================

from datetime import date as _date

DEVICE_TOKEN_TTL_SECONDS = 365 * 24 * 3600  # long-lived; real gating is server-side per request
KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L — readable over the phone


def generate_key_code() -> str:
    group = lambda: "".join(secrets.choice(KEY_ALPHABET) for _ in range(4))
    return f"EDOVA-{group()}-{group()}-{group()}"


def issue_device_token(key_id: str, device_id: str) -> str:
    now = int(time.time())
    return jwt.encode({"typ": "device", "kid": key_id, "did": device_id,
                       "iat": now, "exp": now + DEVICE_TOKEN_TTL_SECONDS},
                      JWT_SECRET, algorithm=JWT_ALG)


def decode_payload(authorization: str) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    try:
        return jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(401, "invalid or expired token")


# Device-token entitlement: key must be ACTIVE and unexpired, school ACTIVE,
# subscription in date — aggregated bool_or across overlapping subs (same as ENTITLEMENT_SQL).
DEVICE_ENTITLEMENT_SQL = """
SELECT t.id AS tenant_id, t.name AS tenant_name, t.type AS tenant_type,
       bool_or(sp.allow_video) AS allow_video,
       bool_or(sp.allow_lab)   AS allow_lab,
       bool_or(sp.allow_quiz)  AS allow_quiz
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
                "features": {"allow_video": row[3], "allow_lab": row[4], "allow_quiz": row[5]},
                "user_id": None, "key_id": payload["kid"], "device_id": payload["did"]}
    uid = payload["sub"]
    tenant_id, name, ttype, av, al, aq = single_tenant_or_raise(uid, roles)
    return {"kind": "user", "tenant_id": tenant_id, "tenant_name": name, "tenant_type": ttype,
            "features": {"allow_video": av, "allow_lab": al, "allow_quiz": aq},
            "user_id": uid, "key_id": None, "device_id": None}


class ActivateIn(BaseModel):
    key_code: str
    device_id: str


@app.post("/api/activation/activate")
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
                      "max(s.end_date) FROM subscriptions s "
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
        "features": {"allow_video": sub[0], "allow_lab": sub[1], "allow_quiz": sub[2]},
        "expires_at": sub[3].isoformat(),
    }


@app.get("/api/activation/session")
def activation_session(authorization: str = Header(...)):
    """App boot: validate the stored device token; 403 -> show activation/expired screen."""
    payload = decode_payload(authorization)
    if payload.get("typ") != "device":
        raise HTTPException(401, "device token required")
    with db() as conn:
        row = q(conn, DEVICE_ENTITLEMENT_SQL, (payload["kid"], payload["did"])).fetchone()
        if row is None:
            raise HTTPException(403, "activation invalid or subscription expired")
        exp = q(conn, "SELECT expires_at FROM activation_keys WHERE id = %s",
                (payload["kid"],)).fetchone()[0]
    return {"tenant": {"name": row[1], "type": row[2]},
            "features": {"allow_video": row[3], "allow_lab": row[4], "allow_quiz": row[5]},
            "expires_at": exp.isoformat()}


@app.get("/api/app/subjects")
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


@app.post("/admin/tenants/{tenant_id}/activation-keys", status_code=201)
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


@app.get("/admin/tenants/{tenant_id}/activation-keys")
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


@app.post("/admin/activation-keys/{key_id}/revoke")
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


# --- Phase 3B content browsing tree ---
@app.get("/api/student/content/subjects/{subject_id}/tree")
def subject_tree(subject_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    flags = {"VIDEO": p["features"]["allow_video"], "LAB": p["features"]["allow_lab"],
             "QUIZ": p["features"]["allow_quiz"]}

    with db() as conn:
        rows = q(conn, TREE_SQL, (subject_id, tenant_id)).fetchall()
    if not rows:
        raise HTTPException(404, "subject not found")  # also covers cross-tenant (IDOR-safe)

    chapters: dict[str, dict] = {}
    for (_, ch_id, ch_name, ch_seq, t_id, t_name, t_seq,
         mod_id, mod_title, mod_type, mod_seq, thumb) in rows:
        if ch_id is None:
            continue
        chapter = chapters.setdefault(str(ch_id), {
            "chapter_id": str(ch_id), "chapter_name": ch_name, "sequence_order": ch_seq,
            "topics": {},  # keyed: topic id, or "" for ungrouped legacy modules
        })
        if mod_id is None:
            continue
        topic = chapter["topics"].setdefault(str(t_id) if t_id else "", {
            "topic_id": str(t_id) if t_id else None,
            "topic_name": t_name if t_id else None,  # NULL -> app renders "General"
            "sequence_order": t_seq if t_id else None,
            "modules": [],
        })
        topic["modules"].append({
            "module_id": str(mod_id),
            "title": mod_title,
            "type": mod_type,
            "sequence_order": mod_seq,
            "thumbnail_url": thumb,  # NULL -> React renders "Coming Soon"
            "locked": not flags.get(mod_type, False),
        })

    # Flatten topic maps; strip chapters with zero published modules (empty shells)
    visible = []
    for c in chapters.values():
        topics = sorted(c["topics"].values(),
                        key=lambda t: (t["sequence_order"] is None, t["sequence_order"] or 0))
        if any(t["modules"] for t in topics):
            visible.append({"chapter_id": c["chapter_id"], "chapter_name": c["chapter_name"],
                            "sequence_order": c["sequence_order"], "topics": topics})
    return {"subject_id": subject_id, "subject_name": rows[0][0], "chapters": visible}


# --- Content endpoint: payload-level AuthZ independent of the sidebar ---
@app.get("/student/modules/{module_id}/lab")
def get_lab_payload(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        module = q(conn, "SELECT module_type FROM modules WHERE id = %s", (module_id,)).fetchone()
        if module is None or module[0] != "LAB":
            raise HTTPException(404, "lab module not found")
        payload = q(
            conn,
            "SELECT environment_type, instructions_markdown, initial_state_code, validation_rules "
            "FROM lab_payloads WHERE module_id = %s",
            (module_id,),
        ).fetchone()
    if payload is None:
        raise HTTPException(404, "lab content not published yet")  # "Coming Soon"
    return {
        "module_id": module_id,
        "environment_type": payload[0],
        "instructions_markdown": payload[1],
        "initial_state_code": payload[2],
        "validation_rules": payload[3],
    }


# ============================================================
# Phase 7: Grading engine (quiz generate/submit, lab submit, progress, review)
# Fixes vs the reviewed draft: module_type (uppercase) not m.type; config via
# quiz_configurations.module_id (reverse FK); tenant guard allows global
# content; served-set grading via quiz_generated_sets; advisory-lock
# concurrency; shortfall read from the persisted set row.
# ============================================================

from psycopg.types.json import Jsonb

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


def _principal_clause(student_id, key_id):
    """One row per principal: student user OR classroom device key (migration 013).
    Used by upsert_progress / record_time_event / progress reads — keep in lockstep."""
    return ("student_id = %s", student_id) if student_id else ("activation_key_id = %s", key_id)


def upsert_progress(conn, module_id: str, new_pct, completion_met: bool,
                    student_id=None, key_id=None) -> bool:
    """State machine not_started -> in_progress -> completed; pct never regresses.
    Time is tracked separately via record_time_event (rollup of progress_events).
    Returns True if status changed."""
    where, pid = _principal_clause(student_id, key_id)
    existing = q(
        conn,
        f"SELECT status, progress_pct FROM student_progress WHERE {where} AND module_id = %s",
        (pid, module_id),
    ).fetchone()
    if existing is None:
        status = "completed" if completion_met else "in_progress"
        q(
            conn,
            "INSERT INTO student_progress "
            "(student_id, activation_key_id, module_id, status, progress_pct, time_spent, last_accessed, completed_at) "
            "VALUES (%s, %s, %s, %s, %s, 0, now(), CASE WHEN %s THEN now() ELSE NULL END)",
            (student_id, key_id, module_id, status, new_pct if new_pct is not None else 0, completion_met),
        )
        return True

    old_status, old_pct = existing
    final_pct = max(old_pct, new_pct) if new_pct is not None else old_pct
    new_status = "completed" if (old_status == "completed" or completion_met) else "in_progress"
    q(
        conn,
        f"UPDATE student_progress SET status = %s, progress_pct = %s, last_accessed = now(), "
        f"completed_at = CASE WHEN %s = 'completed' AND status <> 'completed' THEN now() ELSE completed_at END "
        f"WHERE {where} AND module_id = %s",
        (new_status, final_pct, new_status, pid, module_id),
    )
    return old_status != new_status


def record_time_event(conn, module_id: str, delta_seconds: int, event_id: str,
                      student_id=None, key_id=None) -> bool:
    """Append a time delta with an idempotency key; roll up only if the event
    actually landed. Returns True if counted, False if duplicate (or no-op).

    Callers: progress heartbeats use a client-generated UUID; quiz/lab submits
    use the attempt/submission id (structurally unique, retries impossible)."""
    if delta_seconds <= 0:
        return False
    inserted = q(
        conn,
        "INSERT INTO progress_events (student_id, activation_key_id, module_id, delta_seconds, client_event_id) "
        "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (client_event_id) DO NOTHING RETURNING id",
        (student_id, key_id, module_id, delta_seconds, event_id),
    ).fetchone()
    if inserted is None:
        return False  # duplicate heartbeat — counted once already
    where, pid = _principal_clause(student_id, key_id)
    q(conn, f"UPDATE student_progress SET time_spent = time_spent + %s WHERE {where} AND module_id = %s",
      (delta_seconds, pid, module_id))
    return True


# --- Quiz generation (Phase 4 writer side: persists the served set) ---
class QuizGenerateIn(BaseModel):
    module_id: str


@app.post("/api/v1/engine/quiz/generate")
def quiz_generate(body: QuizGenerateIn, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")
    with db() as conn:
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        cfg = q(conn, "SELECT selection_rules FROM quiz_configurations WHERE module_id = %s",
                (body.module_id,)).fetchone()
        if cfg is None:
            raise HTTPException(404, "quiz not configured yet")  # "Coming Soon"
        rules = cfg[0]
        years, difficulty, total = rules.get("years"), rules.get("difficulty"), rules.get("total_questions")
        if not (isinstance(years, list) and difficulty and isinstance(total, int) and total > 0):
            raise HTTPException(500, "malformed selection_rules in quiz configuration")

        rows = q(
            conn,
            "SELECT id, question_text, options, year, difficulty, content_hash FROM question_bank "
            "WHERE chapter_id = %s AND year = ANY(%s) AND difficulty = %s "
            "ORDER BY RANDOM() LIMIT %s",
            (chapter_id, years, difficulty, total),
        ).fetchall()
        served_ids = [str(r[0]) for r in rows]
        shortfall = len(rows) < total
        gen_id = q(
            conn,
            "INSERT INTO quiz_generated_sets (student_id, activation_key_id, module_id, question_ids, shortfall_flag) "
            "VALUES (%s, %s, %s, %s::uuid[], %s) RETURNING id",
            (p["user_id"], p["key_id"], body.module_id, served_ids, shortfall),
        ).fetchone()[0]

    return {
        "generation_id": str(gen_id),
        "module_id": body.module_id,
        "questions": [
            {"qid": str(r[0]), "question_text": r[1], "options": r[2],
             "year": r[3], "difficulty": r[4], "content_hash": r[5]}
            for r in rows
        ],  # correct_answer deliberately excluded
        "metadata": {"total_requested": total, "total_delivered": len(rows), "shortfall": shortfall},
    }


# --- Quiz submit (grades against the SERVED set, not the pool) ---
class QuizAnswerIn(BaseModel):
    qid: str
    selected_index: int | None = None


class QuizSubmitIn(BaseModel):
    module_id: str
    answers: list[QuizAnswerIn]
    time_spent: int = 0


@app.post("/api/student/quiz/submit")
def quiz_submit(body: QuizSubmitIn, authorization: str = Header(...)):
    p = current_principal(authorization, STUDENT_ONLY)  # teachers can't submit; device tokens can
    uid = p["user_id"]  # None for device tokens: grade but skip per-student persistence (deferred §17)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")

    with db() as conn:  # single transaction; advisory lock released at commit
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        cfg = q(conn, "SELECT max_attempts FROM quiz_configurations WHERE module_id = %s",
                (body.module_id,)).fetchone()
        max_attempts = cfg[0] if cfg else None

        # Real serialization: per (principal, module) advisory xact lock, then recheck.
        lock_key = f"{uid or p['key_id']}:{body.module_id}"
        q(conn, "SELECT pg_advisory_xact_lock(hashtext(%s))", (lock_key,))
        if max_attempts is not None and uid is not None:
            used = q(conn, "SELECT count(*) FROM student_quiz_attempts WHERE student_id = %s AND module_id = %s",
                     (uid, body.module_id)).fetchone()[0]
            if used >= max_attempts:
                raise HTTPException(409, {
                    "error": "max_attempts_exceeded",
                    "attempts_used": used,
                    "max_attempts": max_attempts,
                })

        if uid is not None:
            gen = q(conn, "SELECT question_ids, shortfall_flag FROM quiz_generated_sets "
                          "WHERE student_id = %s AND module_id = %s ORDER BY created_at DESC LIMIT 1",
                    (uid, body.module_id)).fetchone()
        else:
            gen = q(conn, "SELECT question_ids, shortfall_flag FROM quiz_generated_sets "
                          "WHERE activation_key_id = %s AND module_id = %s ORDER BY created_at DESC LIMIT 1",
                    (p["key_id"], body.module_id)).fetchone()
        if gen is None:
            raise HTTPException(404, "no generated quiz found; call generate first")
        served = [str(x) for x in gen[0]]
        shortfall_flag = gen[1]  # persisted truth, not recomputed

        submitted = {a.qid for a in body.answers}
        extra = submitted - set(served)
        if extra:
            raise HTTPException(422, f"invalid question ids: {sorted(extra)}")

        rows = q(conn, "SELECT id, correct_answer FROM question_bank WHERE id = ANY(%s::uuid[])",
                 (served,)).fetchall()
        correct = {str(r[0]): (ord(r[1].upper()) - 65 if r[1] else None) for r in rows}

        ans_map = {a.qid: a.selected_index for a in body.answers}
        results, score = [], 0
        for qid in served:
            sel = ans_map.get(qid)  # unanswered served question -> incorrect
            ok = sel is not None and correct.get(qid) is not None and sel == correct[qid]
            score += ok
            results.append({"qid": qid, "selected_index": sel, "is_correct": ok})

        total = len(served)
        attempt_id = None
        if uid is not None:  # device principals: graded response only, no analytics rows
            attempt_id = q(
                conn,
                "INSERT INTO student_quiz_attempts "
                "(student_id, module_id, chapter_id, score, total_questions, time_spent, answers) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (uid, body.module_id, chapter_id, score, total, body.time_spent, Jsonb(results)),
            ).fetchone()[0]
            upsert_progress(conn, body.module_id, 100, completion_met=True, student_id=uid)
            # Attempt id doubles as the event's idempotency key: an attempt row is
            # inserted exactly once, so its time can never be double-counted.
            record_time_event(conn, body.module_id, body.time_spent, str(attempt_id), student_id=uid)

    return {
        "attempt_id": str(attempt_id) if attempt_id else None,
        "module_id": body.module_id,
        "score": score,
        "total_questions": total,
        "percentage": round(score / total * 100) if total else 0,
        "results": results,
        "shortfall_flag": shortfall_flag,
    }


# --- Lab submit (client-asserted completion, nothing to grade server-side) ---
class LabSubmitIn(BaseModel):
    module_id: str
    interaction_data: dict = {}
    completed: bool = False
    time_spent: int = 0


@app.post("/api/student/lab/submit")
def lab_submit(body: LabSubmitIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, allow_lab, _ = single_tenant_or_raise(uid)
    if not allow_lab:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")
        submission_id = q(
            conn,
            "INSERT INTO student_lab_submissions "
            "(student_id, module_id, chapter_id, interaction_data, completed, time_spent) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (uid, body.module_id, chapter_id, Jsonb(body.interaction_data), body.completed, body.time_spent),
        ).fetchone()[0]
        upsert_progress(conn, body.module_id,
                        100 if body.completed else None,
                        completion_met=body.completed, student_id=uid)
        record_time_event(conn, body.module_id, body.time_spent, str(submission_id), student_id=uid)
    return {"submission_id": str(submission_id), "module_id": body.module_id, "completed": body.completed}


# --- Progress upsert (video: 90% threshold = completed; time = idempotent deltas) ---
class ProgressIn(BaseModel):
    module_id: str
    progress_pct: int
    time_spent_delta: int = 0      # seconds since the previous heartbeat, not a running total
    client_event_id: str = ""      # client-generated UUID per heartbeat; retries reuse it


@app.post("/api/student/progress")
def progress_update(body: ProgressIn, authorization: str = Header(...)):
    # Device tokens (MVP classroom app) persist per activation key; user JWTs per student.
    # STUDENT_ONLY: teachers can't write progress (same rule as quiz_submit).
    p = current_principal(authorization, STUDENT_ONLY)
    uid, key_id = p["user_id"], p["key_id"]
    flags = {"VIDEO": p["features"]["allow_video"], "LAB": p["features"]["allow_lab"],
             "QUIZ": p["features"]["allow_quiz"]}
    if not (0 <= body.progress_pct <= 100):
        raise HTTPException(422, "progress_pct must be 0-100")
    if body.time_spent_delta < 0:
        raise HTTPException(422, "time_spent_delta must be >= 0")
    if body.time_spent_delta > 0:
        try:
            UUID(body.client_event_id)
        except ValueError:
            raise HTTPException(422, "client_event_id must be a UUID when time_spent_delta > 0")
    with db() as conn:
        mod_type, _ = guarded_module(conn, body.module_id, p["tenant_id"])
        if not flags.get(mod_type, False):
            raise HTTPException(403, f"{mod_type.lower()} access not included in your plan")
        completion_met = mod_type == "VIDEO" and body.progress_pct >= 90
        upsert_progress(conn, body.module_id, body.progress_pct, completion_met,
                        student_id=uid, key_id=key_id)
        counted = record_time_event(conn, body.module_id, body.time_spent_delta,
                                    body.client_event_id, student_id=uid, key_id=key_id)
        where, pid = _principal_clause(uid, key_id)
        row = q(conn, f"SELECT status, progress_pct, time_spent FROM student_progress "
                      f"WHERE {where} AND module_id = %s", (pid, body.module_id)).fetchone()
    return {"module_id": body.module_id, "status": row[0], "progress_pct": row[1],
            "time_spent": row[2], "completed": row[0] == "completed",
            "time_counted": counted}  # False on duplicate heartbeat


# --- Progress read: resume position for the video player (pct * duration client-side) ---
@app.get("/api/student/progress/{module_id}")
def progress_read(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    where, pid = _principal_clause(p["user_id"], p["key_id"])
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, p["tenant_id"])
        row = q(conn, f"SELECT status, progress_pct, time_spent FROM student_progress "
                      f"WHERE {where} AND module_id = %s", (pid, module_id)).fetchone()
    if row is None:
        return {"module_id": module_id, "status": "not_started", "progress_pct": 0,
                "time_spent": 0, "completed": False}
    return {"module_id": module_id, "status": row[0], "progress_pct": row[1],
            "time_spent": row[2], "completed": row[0] == "completed"}


# --- Quiz review (correct_index derived from correct_answer letter at query time) ---
@app.get("/api/student/quiz/{attempt_id}/review")
def quiz_review(attempt_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    with db() as conn:
        attempt = q(conn, "SELECT student_id, module_id, score, total_questions, submitted_at, answers "
                          "FROM student_quiz_attempts WHERE id = %s", (attempt_id,)).fetchone()
        if attempt is None or str(attempt[0]) != uid:
            raise HTTPException(404, "attempt not found")  # IDOR-safe, not 403
        answers = attempt[5]
        qids = [a["qid"] for a in answers]
        rows = q(conn, "SELECT id, question_text, options, correct_answer, explanation, "
                       "ASCII(UPPER(correct_answer)) - 65 AS correct_index "
                       "FROM question_bank WHERE id = ANY(%s::uuid[])", (qids,)).fetchall()
    qb = {str(r[0]): r for r in rows}
    return {
        "attempt_id": attempt_id,
        "module_id": str(attempt[1]),
        "score": attempt[2],
        "total_questions": attempt[3],
        "submitted_at": attempt[4].isoformat(),
        "questions": [
            {"qid": a["qid"],
             "question_text": qb[a["qid"]][1] if a["qid"] in qb else "",
             "options": qb[a["qid"]][2] if a["qid"] in qb else [],
             "selected_index": a["selected_index"],
             "correct_index": qb[a["qid"]][5] if a["qid"] in qb else None,
             "is_correct": a["is_correct"],
             "explanation": qb[a["qid"]][4] if a["qid"] in qb else None}
            for a in answers
        ],
    }


# ============================================================
# Phase 4B/4C: S3-backed payload delivery
# ============================================================

import s3_client
from fastapi import Response

HLS_SEGMENT_SECONDS = 6.0  # matches the ffmpeg -hls_time used by the CMS upload pipeline


# --- 4B: HLS media manifest generated from the S3 segment listing ---
@app.get("/api/student/video/{module_id}/manifest")
def video_manifest(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_video"]:
        raise HTTPException(403, "video access not included in your plan")
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, tenant_id)
        if mod_type != "VIDEO":
            raise HTTPException(422, "module is not a video")
        payload = q(conn, "SELECT s3_key_prefix, transcode_status FROM video_payloads WHERE module_id = %s",
                    (module_id,)).fetchone()
    if payload is None or not payload[0]:
        if payload is not None and payload[1] == "PROCESSING":
            raise HTTPException(404, "video is still processing — try again shortly")
        raise HTTPException(404, "video content not published yet")  # "Coming Soon"

    segments = sorted(k for k in s3_client.list_keys(payload[0]) if k.endswith(".ts"))
    if not segments:
        raise HTTPException(404, "no video segments found in storage")

    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{int(HLS_SEGMENT_SECONDS) + 1}",
        "#EXT-X-MEDIA-SEQUENCE:0",
        "#EXT-X-PLAYLIST-TYPE:VOD",
    ]
    for key in segments:
        lines.append(f"#EXTINF:{HLS_SEGMENT_SECONDS:.3f},")
        lines.append(s3_client.presign_get(key, s3_client.PRESIGN_TTL_VIDEO))
    lines.append("#EXT-X-ENDLIST")
    return Response("\n".join(lines) + "\n", media_type="application/vnd.apple.mpegurl")


# --- 4C: static lab simulation served via presigned URL (no code execution) ---
@app.get("/api/student/lab/{module_id}/simulation")
def lab_simulation(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, tenant_id)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")
        payload = q(conn, "SELECT s3_file_key, environment_type FROM lab_payloads WHERE module_id = %s",
                    (module_id,)).fetchone()
    if payload is None or not payload[0]:
        raise HTTPException(404, "lab simulation not published yet")  # "Coming Soon"
    if not s3_client.object_exists(payload[0]):
        raise HTTPException(404, "lab simulation file missing from storage")
    return {
        "module_id": module_id,
        "environment_type": payload[1],
        "simulation_url": s3_client.presign_get(payload[0], s3_client.PRESIGN_TTL_LAB),
        "expires_in": s3_client.PRESIGN_TTL_LAB,
    }


# --- 4D: Lab Sandbox Engine (prototype: index.html POST /api/v1/engine/lab/execute) ---
# Hard env gate: code execution is OFF unless EDOVA_LAB_EXEC_ENABLED=true. Rationale
# and isolation limits are documented in lab_sandbox.py. Execution result is always
# HTTP 200 with exit_code in the body; 422 is reserved for request/runtime problems.
import lab_sandbox

LAB_EXEC_ENABLED = os.getenv("EDOVA_LAB_EXEC_ENABLED", "").lower() in ("1", "true", "yes")
LAB_EXEC_MAX_TIMEOUT = 30      # prototype UI range 1-30s
LAB_EXEC_MAX_MEMORY_MB = 1024  # prototype UI range 16-1024MB


class LabExecuteIn(BaseModel):
    code: str
    language: str
    timeout_seconds: int = 5
    memory_limit_mb: int = 256
    stdin: str | None = None


@app.post("/api/v1/engine/lab/execute")
def lab_execute(body: LabExecuteIn, authorization: str = Header(...)):
    if not LAB_EXEC_ENABLED:
        raise HTTPException(503, "lab code execution is disabled on this server")
    p = current_principal(authorization)
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    if not body.code.strip():
        raise HTTPException(422, "code must not be empty")
    if len(body.code.encode("utf-8")) > lab_sandbox.MAX_CODE_BYTES:
        raise HTTPException(422, f"code exceeds {lab_sandbox.MAX_CODE_BYTES} bytes")
    if body.stdin is not None and len(body.stdin.encode("utf-8")) > lab_sandbox.MAX_STDIN_BYTES:
        raise HTTPException(422, f"stdin exceeds {lab_sandbox.MAX_STDIN_BYTES} bytes")
    if not (1 <= body.timeout_seconds <= LAB_EXEC_MAX_TIMEOUT):
        raise HTTPException(422, f"timeout_seconds must be 1-{LAB_EXEC_MAX_TIMEOUT}")
    if not (16 <= body.memory_limit_mb <= LAB_EXEC_MAX_MEMORY_MB):
        raise HTTPException(422, f"memory_limit_mb must be 16-{LAB_EXEC_MAX_MEMORY_MB}")
    if body.language not in lab_sandbox.available_languages():
        raise HTTPException(422, f"unsupported language: {body.language!r}")
    try:
        return lab_sandbox.execute(body.code, body.language, body.timeout_seconds,
                                   body.memory_limit_mb, body.stdin)
    except lab_sandbox.SandboxError as e:
        raise HTTPException(422, str(e))


# ============================================================
# Phase 2: Admin CMS (/admin/*)
# AuthZ: role='ADMIN' in user_tenant_mappings. Platform admins (tenant type
# PLATFORM) manage everything incl. global content; school admins only their
# own tenant's subjects. Cross-tenant writes -> 403 (per spec).
# ============================================================

import hashlib as _hashlib
import json as _json
import subprocess as _subprocess
import tempfile as _tempfile
from pathlib import Path as _Path

from fastapi import File, Form, Query, UploadFile

DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}


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


@app.get("/admin/session")
def admin_session(authorization: str = Header(...)):
    """CMS bootstrap: identity + scope for the logged-in admin. 403 for non-admins."""
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT u.email, u.full_name, t.name FROM users u, tenants t "
                      "WHERE u.id = %s AND t.id = %s", (admin["user_id"], admin["tenant_id"])).fetchone()
    return {"user_id": admin["user_id"], "email": row[0], "full_name": row[1],
            "tenant_id": str(admin["tenant_id"]), "tenant_name": row[2],
            "is_platform": admin["is_platform"]}


def subject_tenant_of_module(conn, module_id: str):
    row = q(conn, "SELECT m.module_type, m.chapter_id, s.tenant_id FROM modules m "
                  "JOIN chapters c ON c.id = m.chapter_id JOIN subjects s ON s.id = c.subject_id "
                  "WHERE m.id = %s", (module_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "module not found")
    return row  # (module_type, chapter_id, subject_tenant_id)


def content_hash(subject_id: str, chapter_id: str, year: int, question_text: str) -> str:
    """Must match migration 003: SHA256(subject_id || chapter_id || year || question_text)."""
    return _hashlib.sha256(f"{subject_id}{chapter_id}{year}{question_text}".encode("utf-8")).hexdigest()


# --- Endpoint 1: bulk PYQ ingestion with hash dedupe ---
class PyqIn(BaseModel):
    subject_id: str
    chapter_id: str
    year: int
    difficulty: str
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str


class PyqBulkIn(BaseModel):
    questions: list[PyqIn]


@app.post("/admin/pyq/bulk")
def pyq_bulk(body: PyqBulkIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    # Batch-level tenant check: every chapter must be writable by this admin
    with db() as conn:
        for cid in {qs.chapter_id for qs in body.questions}:
            row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                          "WHERE c.id = %s", (cid,)).fetchone()
            if row is None:
                raise HTTPException(404, f"chapter not found: {cid}")
            authorize_subject_tenant(admin, row[0])

        inserted, invalid = 0, []
        for i, qs in enumerate(body.questions):
            if qs.difficulty not in DIFFICULTIES:
                invalid.append({"index": i, "error": f"invalid difficulty: {qs.difficulty}"})
                continue
            if not qs.question_text.strip() or len(qs.options) < 2:
                invalid.append({"index": i, "error": "empty question_text or fewer than 2 options"})
                continue
            letter = qs.correct_answer.strip().upper()
            if not ("A" <= letter <= chr(ord("A") + len(qs.options) - 1)):
                invalid.append({"index": i, "error": f"correct_answer '{qs.correct_answer}' out of option range"})
                continue
            row = q(conn, "INSERT INTO question_bank "
                          "(subject_id, chapter_id, year, difficulty, question_text, options, "
                          " correct_answer, explanation, content_hash) "
                          "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
                          "ON CONFLICT (content_hash) DO NOTHING RETURNING id",
                    (qs.subject_id, qs.chapter_id, qs.year, qs.difficulty, qs.question_text,
                     Jsonb(qs.options), letter, qs.explanation,
                     content_hash(qs.subject_id, qs.chapter_id, qs.year, qs.question_text))).fetchone()
            inserted += 1 if row else 0

    duplicates = len(body.questions) - inserted - len(invalid)
    return {"inserted": inserted, "duplicates_skipped": duplicates, "invalid": invalid}


# --- Endpoint 2: paginated pool browser ---
@app.get("/admin/pyq/pool")
def pyq_pool(chapter_id: str = Query(...), year: int | None = Query(None),
             difficulty: str | None = Query(None), limit: int = Query(50, le=200),
             offset: int = Query(0, ge=0), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        clauses, params = ["chapter_id = %s"], [chapter_id]
        if year is not None:
            clauses.append("year = %s"); params.append(year)
        if difficulty is not None:
            clauses.append("difficulty = %s"); params.append(difficulty)
        where = " AND ".join(clauses)
        total = q(conn, f"SELECT count(*) FROM question_bank WHERE {where}", params).fetchone()[0]
        rows = q(conn, f"SELECT id, year, difficulty, question_text, options, correct_answer, explanation "
                       f"FROM question_bank WHERE {where} ORDER BY year DESC, id LIMIT %s OFFSET %s",
                 params + [limit, offset]).fetchall()
    return {"total": total, "limit": limit, "offset": offset,
            "questions": [{"id": str(r[0]), "year": r[1], "difficulty": r[2], "question_text": r[3],
                           "options": r[4], "correct_answer": r[5], "explanation": r[6]} for r in rows]}


# --- Endpoint 3: quiz config with dry-run COUNT (informational, never blocks) ---
class SelectionRulesIn(BaseModel):
    years: list = []          # loosely typed on purpose: handler validates and returns 400
    difficulty: str = ""      # (pydantic type errors would surface as FastAPI's 422, not the spec'd 400)
    total_questions: int = 0


class QuizConfigIn(BaseModel):
    selection_rules: SelectionRulesIn
    time_limit_minutes: int
    passing_percentage: int
    max_attempts: int | None = None


@app.post("/admin/modules/{module_id}/quiz-config")
def save_quiz_config(module_id: str, body: QuizConfigIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    rules = body.selection_rules
    # App-layer JSONB validation: 400 before touching the database (spec)
    if not rules.years or not all(isinstance(y, int) and 1900 <= y <= 2100 for y in rules.years):
        raise HTTPException(400, "selection_rules.years must be integers between 1900 and 2100")
    if rules.difficulty not in DIFFICULTIES:
        raise HTTPException(400, "selection_rules.difficulty must be EASY, MEDIUM, or HARD")
    if rules.total_questions <= 0:
        raise HTTPException(400, "selection_rules.total_questions must be a positive integer")
    if not (0 <= body.passing_percentage <= 100):
        raise HTTPException(400, "passing_percentage must be 0-100")
    if body.max_attempts is not None and body.max_attempts <= 0:
        raise HTTPException(400, "max_attempts must be positive or null")

    with db() as conn:
        mod_type, chapter_id, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        available = q(conn, "SELECT count(*) FROM question_bank "
                            "WHERE chapter_id = %s AND year = ANY(%s) AND difficulty = %s",
                      (chapter_id, rules.years, rules.difficulty)).fetchone()[0]
        q(conn, "INSERT INTO quiz_configurations "
                "(module_id, time_limit_minutes, passing_percentage, selection_rules, max_attempts) "
                "VALUES (%s, %s, %s, %s, %s) "
                "ON CONFLICT (module_id) DO UPDATE SET time_limit_minutes = EXCLUDED.time_limit_minutes, "
                "passing_percentage = EXCLUDED.passing_percentage, "
                "selection_rules = EXCLUDED.selection_rules, max_attempts = EXCLUDED.max_attempts",
          (module_id, body.time_limit_minutes, body.passing_percentage, Jsonb(rules.model_dump()),
           body.max_attempts))
    return {"saved": True, "available": available, "requested": rules.total_questions}


# --- Endpoint 4: video upload -> 202 -> background ffmpeg HLS transcode -> S3 ---
# The full-length lecture (~1GB) cannot transcode inside the HTTP request (P3 fix):
# the upload streams to disk, queues a daemon thread, and the CMS polls
# /admin/modules/{id}/video-status. Single-process thread queue is deliberate for
# MVP; the seam for a real worker (SQS/Celery) is _transcode_worker's signature.
import shutil as _shutil
import threading as _threading


def _transcode_worker(module_id: str, workdir: str) -> None:
    """ffmpeg -> S3 -> video_payloads row. Owns its DB connection; never raises
    (failures land in transcode_status='FAILED' + transcode_error)."""
    tmp = _Path(workdir)
    try:
        src = tmp / "src.mp4"
        probe = _subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(src)],
            capture_output=True, text=True)
        duration = int(float(probe.stdout.strip() or 0))
        proc = _subprocess.run(
            ["ffmpeg", "-y", "-i", str(src), "-c:v", "libx264", "-c:a", "aac",
             "-preset", "veryfast", "-f", "hls", "-hls_time", str(int(HLS_SEGMENT_SECONDS)),
             "-hls_playlist_type", "vod",
             "-hls_segment_filename", str(tmp / "seg_%03d.ts"), str(tmp / "out.m3u8")],
            capture_output=True)
        segments = sorted(tmp.glob("seg_*.ts"))
        if proc.returncode != 0 or not segments:
            raise RuntimeError(f"ffmpeg failed: {proc.stderr.decode(errors='replace')[-400:]}")
        prefix = f"uploads/hls/{module_id}/"
        for seg in segments:
            s3_client.put_bytes(prefix + seg.name, seg.read_bytes(), "video/mp2t")
        # NOTE: raw conn.execute, not q() — the query-count ContextVar only exists
        # in request threads; this worker runs outside any request context.
        with db() as conn:
            conn.execute("UPDATE video_payloads SET transcode_status = 'READY', transcode_error = NULL, "
                         "duration_seconds = %s, s3_key_prefix = %s WHERE module_id = %s",
                         (duration, prefix, module_id))
    except Exception as e:
        with db() as conn:
            conn.execute("UPDATE video_payloads SET transcode_status = 'FAILED', transcode_error = %s "
                         "WHERE module_id = %s", (str(e)[:500], module_id))
    finally:
        _shutil.rmtree(workdir, ignore_errors=True)


@app.post("/admin/modules/{module_id}/video-upload", status_code=202)
def video_upload(module_id: str, file: UploadFile = File(...), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        mod_type, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "VIDEO":
            raise HTTPException(422, "module is not a video")

    # Stream to disk (never into memory — full lectures are ~1GB), then hand off.
    workdir = _tempfile.mkdtemp(prefix="edova_upload_")
    with open(_Path(workdir) / "src.mp4", "wb") as f:
        _shutil.copyfileobj(file.file, f, 1024 * 1024)

    with db() as conn:
        q(conn, "INSERT INTO video_payloads (module_id, transcode_status) VALUES (%s, 'PROCESSING') "
                "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'PROCESSING', "
                "transcode_error = NULL", (module_id,))
    _threading.Thread(target=_transcode_worker, args=(module_id, workdir), daemon=True).start()
    return {"accepted": True, "module_id": module_id, "status": "PROCESSING"}


@app.get("/admin/modules/{module_id}/video-status")
def video_status(module_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        _, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        row = q(conn, "SELECT transcode_status, transcode_error, duration_seconds, s3_key_prefix "
                      "FROM video_payloads WHERE module_id = %s", (module_id,)).fetchone()
    if row is None:
        return {"module_id": module_id, "status": "EMPTY"}  # never uploaded
    return {"module_id": module_id, "status": row[0], "error": row[1],
            "duration_seconds": row[2], "s3_key_prefix": row[3]}


# --- Endpoint 5: lab simulation upload -> S3 -> s3_file_key ---
@app.post("/admin/modules/{module_id}/lab-upload")
def lab_upload(module_id: str, file: UploadFile = File(...),
               environment_type: str = Form("VIRTUAL_LAB"),
               instructions_markdown: str = Form(""),
               authorization: str = Header(...)):
    admin = get_admin(authorization)
    # migration 015: one value for all uploaded sim files (any subject); the
    # per-language enum carried no behavior — the frontend treats it as opaque.
    if environment_type != "VIRTUAL_LAB":
        raise HTTPException(400, "invalid environment_type")
    filename = (file.filename or "").lower()
    if not (filename.endswith(".html") or filename.endswith(".svg")):
        raise HTTPException(400, "only .html or .svg simulation files are accepted")
    with db() as conn:
        mod_type, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")

    key = f"uploads/labs/{module_id}/{file.filename}"
    content_type = "image/svg+xml" if filename.endswith(".svg") else "text/html"
    s3_client.put_bytes(key, file.file.read(), content_type)

    with db() as conn:
        q(conn, "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, "
                "validation_rules, s3_file_key) VALUES (%s, %s, %s, '{}'::jsonb, %s) "
                "ON CONFLICT (module_id) DO UPDATE SET s3_file_key = EXCLUDED.s3_file_key, "
                "environment_type = EXCLUDED.environment_type, "
                "instructions_markdown = EXCLUDED.instructions_markdown",
          (module_id, environment_type, instructions_markdown, key))
    return {"saved": True, "module_id": module_id, "s3_file_key": key}


# --- Minimal content CRUD (create path; tree endpoint already covers read) ---
class SubjectIn(BaseModel):
    name: str
    standard_grade: str
    sequence_order: int
    thumbnail_url: str | None = None
    tenant_id: str | None = None  # None = global (platform only)


@app.post("/admin/subjects")
def create_subject(body: SubjectIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.tenant_id is None:
        if not admin["is_platform"]:
            raise HTTPException(403, "only platform admins create global subjects")
        tenant_id = None
    else:
        authorize_subject_tenant(admin, body.tenant_id)
        tenant_id = body.tenant_id
    with db() as conn:
        sid = q(conn, "INSERT INTO subjects (tenant_id, name, standard_grade, thumbnail_url, sequence_order) "
                      "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (tenant_id, body.name, body.standard_grade, body.thumbnail_url, body.sequence_order)).fetchone()[0]
    return {"id": str(sid)}


class ChapterIn(BaseModel):
    name: str
    sequence_order: int


@app.post("/admin/subjects/{subject_id}/chapters")
def create_chapter(subject_id: str, body: ChapterIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT tenant_id FROM subjects WHERE id = %s", (subject_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "subject not found")
        authorize_subject_tenant(admin, row[0])
        cid = q(conn, "INSERT INTO chapters (subject_id, name, sequence_order) VALUES (%s, %s, %s) RETURNING id",
                (subject_id, body.name, body.sequence_order)).fetchone()[0]
    return {"id": str(cid)}


class ModuleIn(BaseModel):
    title: str
    module_type: str
    sequence_order: int
    is_published: bool = False
    topic_id: str | None = None  # assign to a topic of the same chapter (migration 012)


@app.post("/admin/chapters/{chapter_id}/modules")
def create_module(chapter_id: str, body: ModuleIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.module_type not in ("VIDEO", "LAB", "QUIZ"):
        raise HTTPException(400, "module_type must be VIDEO, LAB, or QUIZ")
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        if body.topic_id is not None:
            trow = q(conn, "SELECT chapter_id FROM topics WHERE id = %s", (body.topic_id,)).fetchone()
            if trow is None or str(trow[0]) != chapter_id:
                raise HTTPException(422, "topic_id does not belong to this chapter")
        mid = q(conn, "INSERT INTO modules (chapter_id, topic_id, title, module_type, sequence_order, is_published) "
                      "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (chapter_id, body.topic_id, body.title, body.module_type,
                 body.sequence_order, body.is_published)).fetchone()[0]
    return {"id": str(mid)}


# --- Topics (requirement §3: Subject -> Chapter -> Topic -> Assets) ---
class TopicIn(BaseModel):
    name: str
    sequence_order: int


@app.post("/admin/chapters/{chapter_id}/topics", status_code=201)
def create_topic(chapter_id: str, body: TopicIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        tid = q(conn, "INSERT INTO topics (chapter_id, name, sequence_order) VALUES (%s, %s, %s) "
                      "RETURNING id", (chapter_id, body.name, body.sequence_order)).fetchone()[0]
    return {"id": str(tid)}


def topic_tenant(conn, topic_id: str):
    row = q(conn, "SELECT t.chapter_id, s.tenant_id FROM topics t "
                  "JOIN chapters c ON c.id = t.chapter_id JOIN subjects s ON s.id = c.subject_id "
                  "WHERE t.id = %s", (topic_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "topic not found")
    return row  # (chapter_id, subject_tenant_id)


class TopicPatch(BaseModel):
    name: str | None = None
    sequence_order: int | None = None


@app.patch("/admin/topics/{topic_id}")
def update_topic(topic_id: str, body: TopicPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.name is None and body.sequence_order is None:
        raise HTTPException(400, "nothing to update")
    with db() as conn:
        _, tenant = topic_tenant(conn, topic_id)
        authorize_subject_tenant(admin, tenant)
        if body.name is not None:
            q(conn, "UPDATE topics SET name = %s WHERE id = %s", (body.name, topic_id))
        if body.sequence_order is not None:
            q(conn, "UPDATE topics SET sequence_order = %s WHERE id = %s",
              (body.sequence_order, topic_id))
    return {"id": topic_id, "updated": True}


@app.delete("/admin/topics/{topic_id}")
def delete_topic(topic_id: str, authorization: str = Header(...)):
    """Deletes the topic only; its modules fall back to the chapter's ungrouped bucket
    (ON DELETE SET NULL) — content is never lost with a topic."""
    admin = get_admin(authorization)
    with db() as conn:
        _, tenant = topic_tenant(conn, topic_id)
        authorize_subject_tenant(admin, tenant)
        q(conn, "DELETE FROM topics WHERE id = %s", (topic_id,))
    return {"id": topic_id, "deleted": True}


# --- Module patch: publish toggle, retitle, reorder, topic (re)assignment ---
class ModulePatch(BaseModel):
    title: str | None = None
    sequence_order: int | None = None
    is_published: bool | None = None
    topic_id: str | None = None  # explicit null un-assigns (back to ungrouped)


@app.patch("/admin/modules/{module_id}")
def update_module(module_id: str, body: ModulePatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        mod_type, chapter_id, tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, tenant)
        if body.topic_id is not None:
            trow = q(conn, "SELECT chapter_id FROM topics WHERE id = %s", (body.topic_id,)).fetchone()
            if trow is None or str(trow[0]) != str(chapter_id):
                raise HTTPException(422, "topic_id does not belong to this module's chapter")
        sets, params = [], []
        for col, val in (("title", body.title), ("sequence_order", body.sequence_order),
                         ("is_published", body.is_published), ("topic_id", body.topic_id)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if "topic_id" in body.model_fields_set and body.topic_id is None:
            sets.append("topic_id = NULL")
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE modules SET {', '.join(sets)} WHERE id = %s", params + [module_id])
    return {"id": module_id, "updated": True}


# ============================================================
# Phase 2B: CMS gaps — subject/chapter edit+reorder, browse endpoints,
# school/subscription management, user management. AuthZ as Phase 2:
# platform admins everything; school admins only their own tenant.
# ============================================================

from datetime import date as _date


# --- Subject/chapter patch: rename + reorder (delete stays out on purpose:
# chapters cascade-delete modules; destructive ops need an explicit ask) ---
class SubjectPatch(BaseModel):
    name: str | None = None
    standard_grade: str | None = None
    thumbnail_url: str | None = None
    sequence_order: int | None = None


@app.patch("/admin/subjects/{subject_id}")
def update_subject(subject_id: str, body: SubjectPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT tenant_id FROM subjects WHERE id = %s", (subject_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "subject not found")
        authorize_subject_tenant(admin, row[0])
        sets, params = [], []
        for col, val in (("name", body.name), ("standard_grade", body.standard_grade),
                         ("thumbnail_url", body.thumbnail_url), ("sequence_order", body.sequence_order)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE subjects SET {', '.join(sets)} WHERE id = %s", params + [subject_id])
    return {"id": subject_id, "updated": True}


class ChapterPatch(BaseModel):
    name: str | None = None
    sequence_order: int | None = None


@app.patch("/admin/chapters/{chapter_id}")
def update_chapter(chapter_id: str, body: ChapterPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        sets, params = [], []
        for col, val in (("name", body.name), ("sequence_order", body.sequence_order)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE chapters SET {', '.join(sets)} WHERE id = %s", params + [chapter_id])
    return {"id": chapter_id, "updated": True}


# --- CMS browse: subject list (platform: all; school admin: own + global read-only) ---
@app.get("/admin/subjects")
def admin_list_subjects(authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        if admin["is_platform"]:
            rows = q(conn, "SELECT s.id, s.name, s.standard_grade, s.sequence_order, s.tenant_id, "
                           "t.name, (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id) "
                           "FROM subjects s LEFT JOIN tenants t ON t.id = s.tenant_id "
                           "ORDER BY s.tenant_id NULLS FIRST, s.sequence_order").fetchall()
        else:
            rows = q(conn, "SELECT s.id, s.name, s.standard_grade, s.sequence_order, s.tenant_id, "
                           "t.name, (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id) "
                           "FROM subjects s LEFT JOIN tenants t ON t.id = s.tenant_id "
                           "WHERE s.tenant_id IS NULL OR s.tenant_id = %s "
                           "ORDER BY s.tenant_id NULLS FIRST, s.sequence_order",
                     (admin["tenant_id"],)).fetchall()
    return {"subjects": [
        {"id": str(r[0]), "name": r[1], "standard_grade": r[2], "sequence_order": r[3],
         "tenant_id": str(r[4]) if r[4] else None, "tenant_name": r[5],
         "scope": "global" if r[4] is None else "tenant",
         "read_only": not admin["is_platform"] and r[4] is None,
         "chapter_count": r[6]}
        for r in rows]}


# --- CMS browse: full editable tree (unlike the student tree: includes unpublished
# modules AND content-readiness flags so the CMS can show "Coming Soon" states) ---
@app.get("/admin/subjects/{subject_id}/tree")
def admin_subject_tree(subject_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        subj = q(conn, "SELECT name, standard_grade, tenant_id FROM subjects WHERE id = %s",
                 (subject_id,)).fetchone()
        if subj is None:
            raise HTTPException(404, "subject not found")
        if not admin["is_platform"] and subj[2] is not None and str(subj[2]) != str(admin["tenant_id"]):
            raise HTTPException(403, "cannot view content outside your tenant")
        rows = q(conn, """
SELECT c.id, c.name, c.sequence_order,
       t.id, t.name, t.sequence_order,
       m.id, m.title, m.module_type, m.sequence_order, m.is_published,
       (vp.s3_key_prefix IS NOT NULL OR vp.hls_master_url IS NOT NULL) AS video_ready,
       (lp.s3_file_key IS NOT NULL) AS lab_ready,
       (qc.module_id IS NOT NULL) AS quiz_ready
FROM chapters c
LEFT JOIN topics t ON t.chapter_id = c.id
LEFT JOIN modules m ON m.chapter_id = c.id
                   AND (m.topic_id = t.id OR (m.topic_id IS NULL AND t.id IS NULL))
LEFT JOIN video_payloads vp ON vp.module_id = m.id
LEFT JOIN lab_payloads lp ON lp.module_id = m.id
LEFT JOIN quiz_configurations qc ON qc.module_id = m.id
WHERE c.subject_id = %s
ORDER BY c.sequence_order, t.sequence_order NULLS LAST, m.sequence_order
""", (subject_id,)).fetchall()

    chapters: dict = {}
    for r in rows:
        ch = chapters.setdefault(r[0], {"id": str(r[0]), "name": r[1], "sequence_order": r[2],
                                        "topics": {}, "modules": []})
        if r[3] is not None:
            ch["topics"].setdefault(r[3], {"id": str(r[3]), "name": r[4],
                                           "sequence_order": r[5], "modules": []})
        if r[6] is None:
            continue  # empty chapter or empty topic — no module row to add
        mod = {"id": str(r[6]), "title": r[7], "module_type": r[8], "sequence_order": r[9],
               "is_published": r[10], "topic_id": str(r[3]) if r[3] else None,
               "content_ready": {"VIDEO": r[11], "LAB": r[12], "QUIZ": r[13]}[r[8]]}
        if r[3] is not None:
            tp = ch["topics"].setdefault(r[3], {"id": str(r[3]), "name": r[4],
                                                "sequence_order": r[5], "modules": []})
            tp["modules"].append(mod)
        else:
            ch["modules"].append(mod)  # ungrouped bucket (topic_id NULL)
    return {
        "subject": {"id": subject_id, "name": subj[0], "standard_grade": subj[1],
                    "scope": "global" if subj[2] is None else "tenant",
                    "read_only": not admin["is_platform"] and subj[2] is None},
        "chapters": [{**ch, "topics": sorted(ch["topics"].values(),
                                             key=lambda t: t["sequence_order"])}
                     for ch in chapters.values()],
    }


# --- Schools (tenants) + subscriptions: platform-only. Key CRUD already exists
# at /admin/tenants/{tenant_id}/activation-keys ---
class TenantIn(BaseModel):
    name: str


@app.post("/admin/tenants", status_code=201)
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


@app.get("/admin/tenants")
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


@app.get("/admin/subscription-plans")
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


@app.post("/admin/tenants/{tenant_id}/subscriptions", status_code=201)
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


@app.post("/admin/users", status_code=201)
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


@app.get("/admin/users")
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


@app.post("/admin/users/{user_id}/password")
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
