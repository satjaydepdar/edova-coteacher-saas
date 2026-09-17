"""edova-coteacher API — Phase 3A: student auth & entitlement boot; 3B: content tree."""
import os
import threading
import time
from collections import defaultdict

import jwt
import psycopg
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Re-exported here (not used directly below) so backend/scripts and backend/tests can
# keep doing `from main import DB_DSN, hash_password` etc. -- unchanged since before the
# router split, when this file defined them itself instead of importing from core/routers.
from core import DB_DSN, JWT_ALG, JWT_SECRET, _qcount, hash_password  # noqa: F401
from routers.admin_content import _tool  # noqa: F401

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







from routers.auth import router as auth_router
from routers.teacher import router as teacher_router
from routers.activation import router as activation_router
from routers.content import router as content_router
from routers.learning_engine import router as learning_engine_router
from routers.media_delivery import router as media_delivery_router
from routers.admin_questions import router as admin_questions_router
from routers.admin_tests import router as admin_tests_router
from routers.admin_content import router as admin_content_router
from routers.admin_cms_browse import router as admin_cms_browse_router
from routers.admin_tenants import router as admin_tenants_router
from routers.admin_llm_providers import router as admin_llm_providers_router
from routers.public_funnel import router as public_funnel_router
from routers.analytics import router as analytics_router
from trigonometry.routers.concepts import router as trig_concepts_router
from trigonometry.routers.student import router as trig_student_router
from trigonometry.routers.analytics import router as trig_analytics_router
from trigonometry.routers.teacher import router as trig_teacher_router
from trigonometry.routers.telemetry import router as trig_telemetry_router
from trigonometry.routers.session_proxy import router as trig_session_router
from coordinate_geometry.routers.concepts import router as coordgeo_concepts_router
from coordinate_geometry.routers.student import router as coordgeo_student_router
from coordinate_geometry.routers.analytics import router as coordgeo_analytics_router
from coordinate_geometry.routers.teacher import router as coordgeo_teacher_router
from coordinate_geometry.routers.telemetry import router as coordgeo_telemetry_router
from routers.video_engine import router as video_engine_router
from routers.settings import router as settings_router
from routers.calendar import router as calendar_router
from routers.syllabus import router as syllabus_router
from routers.lesson_plans import router as lesson_plans_router
from routers.assignments import router as assignments_router
from routers.assessments import router as assessments_router
from routers.learning_resources import router as learning_resources_router
from routers.attendance import router as attendance_router
from routers.student_learning import router as student_learning_router
from trigonometry.database import init_db as trig_init_db
from coordinate_geometry.database import init_db as coordgeo_init_db

trig_init_db()
coordgeo_init_db()

app.include_router(auth_router)
app.include_router(teacher_router)
app.include_router(activation_router)
app.include_router(content_router)
app.include_router(learning_engine_router)
app.include_router(media_delivery_router)
app.include_router(admin_questions_router)
app.include_router(admin_tests_router)
app.include_router(admin_content_router)
app.include_router(admin_cms_browse_router)
app.include_router(admin_tenants_router)
app.include_router(admin_llm_providers_router)
app.include_router(public_funnel_router)
app.include_router(analytics_router)
app.include_router(trig_concepts_router)
app.include_router(trig_student_router)
app.include_router(trig_analytics_router)
app.include_router(trig_teacher_router)
app.include_router(trig_telemetry_router)
app.include_router(trig_session_router)
app.include_router(coordgeo_concepts_router)
app.include_router(coordgeo_student_router)
app.include_router(coordgeo_analytics_router)
app.include_router(coordgeo_teacher_router)
app.include_router(coordgeo_telemetry_router)
app.include_router(video_engine_router)
app.include_router(settings_router)
app.include_router(calendar_router)
app.include_router(syllabus_router)
app.include_router(lesson_plans_router)
app.include_router(assignments_router)
app.include_router(assessments_router)
app.include_router(learning_resources_router)
app.include_router(attendance_router)
app.include_router(student_learning_router)


