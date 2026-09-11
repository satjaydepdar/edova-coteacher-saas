"""Router: extracted from main.py (pure code motion, no behavior change)."""
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from core import (
    current_user_id,
    db,
    hash_password,
    is_legacy_hash,
    issue_token,
    q,
    single_tenant_or_raise,
    verify_password,
)

router = APIRouter()


# --- auth ---
class LoginIn(BaseModel):
    email: str
    password: str






@router.post("/auth/login")
def login(body: LoginIn):
    with db() as conn:
        row = q(conn, "SELECT id, password_hash FROM users WHERE email = %s", (body.email,)).fetchone()
        if row is None or not verify_password(body.password, row[1]):
            raise HTTPException(401, "invalid credentials")
        if is_legacy_hash(row[1]):  # opportunistic migration: pbkdf2 -> bcrypt
            q(conn, "UPDATE users SET password_hash = %s WHERE id = %s",
              (hash_password(body.password), row[0]))
    return {"access_token": issue_token(str(row[0])), "token_type": "bearer"}






# --- Phase 3A boot endpoint ---
@router.get("/api/student/session")
def student_session(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, tenant_name, tenant_type, allow_video, allow_lab, allow_quiz, _tier = single_tenant_or_raise(uid)
    with db() as conn:
        user = q(conn, "SELECT id, full_name, email FROM users WHERE id = %s", (uid,)).fetchone()
    return {
        "user": {"id": str(user[0]), "name": user[1], "email": user[2]},
        "tenant": {"name": tenant_name, "type": tenant_type},
        "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz},
    }


# --- Teacher boot endpoint (classroom app): school entitlement, TEACHER role ---
@router.get("/api/teacher/session")
def teacher_session(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, tenant_name, tenant_type, allow_video, allow_lab, allow_quiz, _tier = \
        single_tenant_or_raise(uid, ("TEACHER",))
    with db() as conn:
        user = q(conn, "SELECT id, full_name, email FROM users WHERE id = %s", (uid,)).fetchone()
    return {
        "user": {"id": str(user[0]), "name": user[1], "email": user[2]},
        "role": "TEACHER",
        "tenant": {"name": tenant_name, "type": tenant_type},
        "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz},
    }
