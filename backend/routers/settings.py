"""Router: Settings Module for Edova CoTeacher.
Supports:
- User profile & password management
- Role-adaptive preferences (Teacher test/mastery/SAL defaults, Student canvas & audio)
- School admin CBSE affiliation, academic year, and section overview
"""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from core import (
    CLASSROOM,
    current_user_id,
    db,
    hash_password,
    q,
    single_tenant_or_raise,
    verify_password,
)

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ProfileUpdateIn(BaseModel):
    full_name: str | None = None
    current_password: str | None = None
    new_password: str | None = None


class PreferencesUpdateIn(BaseModel):
    default_test_timer_minutes: int | None = Field(default=None, ge=5, le=180)
    mastery_alert_threshold: int | None = Field(default=None, ge=10, le=100)
    socratic_sal_level: int | None = Field(default=None, ge=0, le=100)
    formula_editor_mode: str | None = Field(default=None)  # 'mathlive' | 'latex'
    sound_effects_enabled: bool | None = None


class SchoolSettingsUpdateIn(BaseModel):
    cbse_affiliation_code: str | None = None
    academic_year: str | None = None


class LlmSettingsUpdateIn(BaseModel):
    llm_tier: str | None = None  # 'NONE', 'STANDARD', 'PRO', 'ENTERPRISE'
    enable_student_chatbot: bool | None = None
    enable_teacher_lesson_planner: bool | None = None
    default_socratic_sal: int | None = Field(default=None, ge=0, le=100)
    monthly_token_budget_k: int | None = Field(default=None, ge=10, le=10000)


@router.get("/me")
def get_user_settings(authorization: str = Header(...)):
    """Fetch current user profile, role, tenant, preferences, and classroom sections."""
    uid = current_user_id(authorization)

    with db() as conn:
        # 1. Fetch user & primary tenant info
        user_row = q(
            conn,
            """
            SELECT u.id, u.email, u.full_name, utm.role, utm.tenant_id, t.name,
                   utm.section_id, s.name AS section_name, s.grade AS section_grade
            FROM users u
            JOIN user_tenant_mappings utm ON u.id = utm.user_id
            JOIN tenants t ON utm.tenant_id = t.id
            LEFT JOIN sections s ON utm.section_id = s.id
            WHERE u.id = %s AND t.status = 'ACTIVE'
            ORDER BY (utm.role = 'ADMIN') DESC, (utm.role = 'TEACHER') DESC
            LIMIT 1
            """,
            (uid,),
        ).fetchone()

        if not user_row:
            # Fallback for platform admins or users without tenant mappings
            u_base = q(conn, "SELECT id, email, full_name FROM users WHERE id = %s", (uid,)).fetchone()
            if not u_base:
                raise HTTPException(404, "User not found")
            user_data = {
                "id": str(u_base[0]),
                "email": u_base[1],
                "full_name": u_base[2] or "",
                "role": "MEMBER",
                "tenant_id": None,
                "tenant_name": "Edova CoTeacher",
                "section": None,
            }
            tenant_id = None
        else:
            section_info = None
            if user_row[6]:
                section_info = {
                    "id": str(user_row[6]),
                    "name": user_row[7] or "",
                    "grade": user_row[8] or "",
                }
            user_data = {
                "id": str(user_row[0]),
                "email": user_row[1],
                "full_name": user_row[2] or "",
                "role": user_row[3],
                "tenant_id": str(user_row[4]),
                "tenant_name": user_row[5],
                "section": section_info,
            }
            tenant_id = user_row[4]

        # 2. Fetch or initialize user preferences
        pref_row = q(
            conn,
            """
            SELECT default_test_timer_minutes, mastery_alert_threshold,
                   socratic_sal_level, formula_editor_mode, sound_effects_enabled
            FROM user_preferences
            WHERE user_id = %s
            """,
            (uid,),
        ).fetchone()

        if pref_row:
            preferences = {
                "default_test_timer_minutes": pref_row[0],
                "mastery_alert_threshold": pref_row[1],
                "socratic_sal_level": pref_row[2],
                "formula_editor_mode": pref_row[3] or "mathlive",
                "sound_effects_enabled": bool(pref_row[4]),
            }
        else:
            preferences = {
                "default_test_timer_minutes": 45,
                "mastery_alert_threshold": 50,
                "socratic_sal_level": 100,
                "formula_editor_mode": "mathlive",
                "sound_effects_enabled": True,
            }

        # 3. Fetch school / tenant settings & LLM configuration
        tenant_settings = {
            "cbse_affiliation_code": "CBSE-2026",
            "academic_year": "2026-2027",
        }
        llm_settings = {
            "llm_tier": "STANDARD",
            "enable_student_chatbot": True,
            "enable_teacher_lesson_planner": True,
            "default_socratic_sal": 100,
            "monthly_token_budget_k": 500,
        }
        if tenant_id:
            t_row = q(
                conn,
                """
                SELECT cbse_affiliation_code, academic_year,
                       llm_tier, enable_student_chatbot, enable_teacher_lesson_planner,
                       default_socratic_sal, monthly_token_budget_k
                FROM tenant_settings
                WHERE tenant_id = %s
                """,
                (tenant_id,),
            ).fetchone()
            if t_row:
                tenant_settings = {
                    "cbse_affiliation_code": t_row[0] or "CBSE-2026",
                    "academic_year": t_row[1] or "2026-2027",
                }
                llm_settings = {
                    "llm_tier": t_row[2] or "STANDARD",
                    "enable_student_chatbot": bool(t_row[3]) if t_row[3] is not None else True,
                    "enable_teacher_lesson_planner": bool(t_row[4]) if t_row[4] is not None else True,
                    "default_socratic_sal": t_row[5] if t_row[5] is not None else 100,
                    "monthly_token_budget_k": t_row[6] if t_row[6] is not None else 500,
                }

        # 4. Fetch sections for teacher / admin view
        sections = []
        if tenant_id and user_data["role"] in ("TEACHER", "ADMIN"):
            sec_rows = q(
                conn,
                """
                SELECT s.id, s.name, s.grade, count(utm.user_id) AS student_count
                FROM sections s
                LEFT JOIN user_tenant_mappings utm ON utm.section_id = s.id AND utm.role = 'STUDENT'
                WHERE s.tenant_id = %s
                GROUP BY s.id, s.name, s.grade
                ORDER BY s.grade NULLS LAST, s.name
                """,
                (tenant_id,),
            ).fetchall()
            sections = [
                {
                    "id": str(r[0]),
                    "name": r[1],
                    "grade": r[2] or "",
                    "student_count": r[3],
                }
                for r in sec_rows
            ]

    return {
        "user": user_data,
        "preferences": preferences,
        "tenant_settings": tenant_settings,
        "llm_settings": llm_settings,
        "sections": sections,
    }


@router.patch("/profile")
def update_profile(body: ProfileUpdateIn, authorization: str = Header(...)):
    """Update profile name and/or securely change password."""
    uid = current_user_id(authorization)

    with db() as conn:
        user_row = q(conn, "SELECT password_hash FROM users WHERE id = %s", (uid,)).fetchone()
        if not user_row:
            raise HTTPException(404, "User not found")

        current_hash = user_row[0]

        # Handle password change
        if body.new_password:
            if not body.current_password:
                raise HTTPException(400, "Current password is required to set a new password")
            if not verify_password(body.current_password, current_hash):
                raise HTTPException(400, "Current password does not match")
            if len(body.new_password) < 6:
                raise HTTPException(400, "New password must be at least 6 characters long")

            new_hash = hash_password(body.new_password)
            q(conn, "UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, uid))

        # Handle name change
        if body.full_name is not None:
            cleaned_name = body.full_name.strip()
            if not cleaned_name:
                raise HTTPException(400, "Full name cannot be empty")
            q(conn, "UPDATE users SET full_name = %s WHERE id = %s", (cleaned_name, uid))

        conn.commit()

        updated_row = q(conn, "SELECT full_name, email FROM users WHERE id = %s", (uid,)).fetchone()

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "full_name": updated_row[0] or "",
        "email": updated_row[1],
    }


@router.patch("/preferences")
def update_preferences(body: PreferencesUpdateIn, authorization: str = Header(...)):
    """Update user preferences (teacher defaults or student learning canvas options)."""
    uid = current_user_id(authorization)

    with db() as conn:
        # Check existing
        existing = q(
            conn,
            """
            SELECT default_test_timer_minutes, mastery_alert_threshold,
                   socratic_sal_level, formula_editor_mode, sound_effects_enabled
            FROM user_preferences WHERE user_id = %s
            """,
            (uid,),
        ).fetchone()

        if existing:
            new_timer = body.default_test_timer_minutes if body.default_test_timer_minutes is not None else existing[0]
            new_mastery = body.mastery_alert_threshold if body.mastery_alert_threshold is not None else existing[1]
            new_sal = body.socratic_sal_level if body.socratic_sal_level is not None else existing[2]
            new_formula = body.formula_editor_mode if body.formula_editor_mode is not None else (existing[3] or "mathlive")
            new_sound = body.sound_effects_enabled if body.sound_effects_enabled is not None else existing[4]

            q(
                conn,
                """
                UPDATE user_preferences
                SET default_test_timer_minutes = %s,
                    mastery_alert_threshold = %s,
                    socratic_sal_level = %s,
                    formula_editor_mode = %s,
                    sound_effects_enabled = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                """,
                (new_timer, new_mastery, new_sal, new_formula, new_sound, uid),
            )
        else:
            new_timer = body.default_test_timer_minutes if body.default_test_timer_minutes is not None else 45
            new_mastery = body.mastery_alert_threshold if body.mastery_alert_threshold is not None else 50
            new_sal = body.socratic_sal_level if body.socratic_sal_level is not None else 100
            new_formula = body.formula_editor_mode if body.formula_editor_mode is not None else "mathlive"
            new_sound = body.sound_effects_enabled if body.sound_effects_enabled is not None else True

            q(
                conn,
                """
                INSERT INTO user_preferences
                (user_id, default_test_timer_minutes, mastery_alert_threshold,
                 socratic_sal_level, formula_editor_mode, sound_effects_enabled, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """,
                (uid, new_timer, new_mastery, new_sal, new_formula, new_sound),
            )

        conn.commit()

    return {
        "status": "success",
        "preferences": {
            "default_test_timer_minutes": new_timer,
            "mastery_alert_threshold": new_mastery,
            "socratic_sal_level": new_sal,
            "formula_editor_mode": new_formula,
            "sound_effects_enabled": new_sound,
        },
    }


@router.get("/school")
def get_school_settings(authorization: str = Header(...)):
    """Fetch school affiliation, academic year, and staff/student counts for the current tenant."""
    uid = current_user_id(authorization)
    tenant_id, tenant_name, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        t_row = q(
            conn,
            """
            SELECT cbse_affiliation_code, academic_year,
                   llm_tier, enable_student_chatbot, enable_teacher_lesson_planner,
                   default_socratic_sal, monthly_token_budget_k
            FROM tenant_settings WHERE tenant_id = %s
            """,
            (tenant_id,),
        ).fetchone()

        cbse_code = t_row[0] if t_row and t_row[0] else "CBSE-2026"
        academic_year = t_row[1] if t_row and t_row[1] else "2026-2027"
        llm_settings = {
            "llm_tier": t_row[2] if t_row and t_row[2] else "STANDARD",
            "enable_student_chatbot": bool(t_row[3]) if t_row and t_row[3] is not None else True,
            "enable_teacher_lesson_planner": bool(t_row[4]) if t_row and t_row[4] is not None else True,
            "default_socratic_sal": t_row[5] if t_row and t_row[5] is not None else 100,
            "monthly_token_budget_k": t_row[6] if t_row and t_row[6] is not None else 500,
        }

        # Counts
        teacher_count = q(
            conn,
            "SELECT count(*) FROM user_tenant_mappings WHERE tenant_id = %s AND role = 'TEACHER'",
            (tenant_id,),
        ).fetchone()[0]

        student_count = q(
            conn,
            "SELECT count(*) FROM user_tenant_mappings WHERE tenant_id = %s AND role = 'STUDENT'",
            (tenant_id,),
        ).fetchone()[0]

        sections = q(
            conn,
            """
            SELECT s.id, s.name, s.grade, count(utm.user_id)
            FROM sections s
            LEFT JOIN user_tenant_mappings utm ON utm.section_id = s.id AND utm.role = 'STUDENT'
            WHERE s.tenant_id = %s
            GROUP BY s.id, s.name, s.grade
            ORDER BY s.grade NULLS LAST, s.name
            """,
            (tenant_id,),
        ).fetchall()

    return {
        "tenant_id": str(tenant_id),
        "tenant_name": tenant_name,
        "cbse_affiliation_code": cbse_code,
        "academic_year": academic_year,
        "teacher_count": teacher_count,
        "student_count": student_count,
        "llm_settings": llm_settings,
        "sections": [
            {"id": str(r[0]), "name": r[1], "grade": r[2] or "", "student_count": r[3]}
            for r in sections
        ],
    }


@router.patch("/school")
def update_school_settings(body: SchoolSettingsUpdateIn, authorization: str = Header(...)):
    """Admin-only update of CBSE affiliation code and academic year."""
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, ("ADMIN",))

    with db() as conn:
        admin_check = q(
            conn,
            "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s AND role = 'ADMIN'",
            (uid, tenant_id),
        ).fetchone()
        if not admin_check:
            plat_check = q(
                conn,
                "SELECT 1 FROM user_tenant_mappings utm JOIN tenants t ON t.id = utm.tenant_id WHERE utm.user_id = %s AND t.type = 'PLATFORM' AND utm.role = 'ADMIN'",
                (uid,),
            ).fetchone()
            if not plat_check:
                raise HTTPException(403, "School admin role required to update institutional settings")

        existing = q(
            conn,
            "SELECT cbse_affiliation_code, academic_year FROM tenant_settings WHERE tenant_id = %s",
            (tenant_id,),
        ).fetchone()

        new_cbse = body.cbse_affiliation_code if body.cbse_affiliation_code is not None else (existing[0] if existing else "CBSE-2026")
        new_year = body.academic_year if body.academic_year is not None else (existing[1] if existing else "2026-2027")

        if existing:
            q(
                conn,
                """
                UPDATE tenant_settings
                SET cbse_affiliation_code = %s,
                    academic_year = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = %s
                """,
                (new_cbse, new_year, tenant_id),
            )
        else:
            q(
                conn,
                """
                INSERT INTO tenant_settings (tenant_id, cbse_affiliation_code, academic_year, updated_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """,
                (tenant_id, new_cbse, new_year),
            )

        conn.commit()

    return {
        "status": "success",
        "cbse_affiliation_code": new_cbse,
        "academic_year": new_year,
    }


@router.patch("/llm")
def update_llm_settings(body: LlmSettingsUpdateIn, authorization: str = Header(...)):
    """Admin-only update of school-wide LLM features, subscription tier, and token quotas."""
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, ("ADMIN",))

    with db() as conn:
        admin_check = q(
            conn,
            "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s AND role = 'ADMIN'",
            (uid, tenant_id),
        ).fetchone()
        if not admin_check:
            plat_check = q(
                conn,
                "SELECT 1 FROM user_tenant_mappings utm JOIN tenants t ON t.id = utm.tenant_id WHERE utm.user_id = %s AND t.type = 'PLATFORM' AND utm.role = 'ADMIN'",
                (uid,),
            ).fetchone()
            if not plat_check:
                raise HTTPException(403, "School admin role required to configure LLM settings")

        existing = q(
            conn,
            """
            SELECT llm_tier, enable_student_chatbot, enable_teacher_lesson_planner,
                   default_socratic_sal, monthly_token_budget_k
            FROM tenant_settings WHERE tenant_id = %s
            """,
            (tenant_id,),
        ).fetchone()

        cur_tier = existing[0] if existing and existing[0] else "STANDARD"
        cur_bot = bool(existing[1]) if existing and existing[1] is not None else True
        cur_planner = bool(existing[2]) if existing and existing[2] is not None else True
        cur_sal = existing[3] if existing and existing[3] is not None else 100
        cur_budget = existing[4] if existing and existing[4] is not None else 500

        new_tier = body.llm_tier if body.llm_tier is not None else cur_tier
        new_bot = body.enable_student_chatbot if body.enable_student_chatbot is not None else cur_bot
        new_planner = body.enable_teacher_lesson_planner if body.enable_teacher_lesson_planner is not None else cur_planner
        new_sal = body.default_socratic_sal if body.default_socratic_sal is not None else cur_sal
        new_budget = body.monthly_token_budget_k if body.monthly_token_budget_k is not None else cur_budget

        if existing:
            q(
                conn,
                """
                UPDATE tenant_settings
                SET llm_tier = %s,
                    enable_student_chatbot = %s,
                    enable_teacher_lesson_planner = %s,
                    default_socratic_sal = %s,
                    monthly_token_budget_k = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = %s
                """,
                (new_tier, new_bot, new_planner, new_sal, new_budget, tenant_id),
            )
        else:
            q(
                conn,
                """
                INSERT INTO tenant_settings (tenant_id, llm_tier, enable_student_chatbot, enable_teacher_lesson_planner, default_socratic_sal, monthly_token_budget_k, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """,
                (tenant_id, new_tier, new_bot, new_planner, new_sal, new_budget),
            )

        conn.commit()

    return {
        "status": "success",
        "llm_settings": {
            "llm_tier": new_tier,
            "enable_student_chatbot": new_bot,
            "enable_teacher_lesson_planner": new_planner,
            "default_socratic_sal": new_sal,
            "monthly_token_budget_k": new_budget,
        },
    }

