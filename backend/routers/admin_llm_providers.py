"""Admin CMS: LLM provider/model/API-key registry. Platform-admin-only (sole owner) --
this is what feeds services/llm_config_service.get_llm_config(), replacing per-feature
.env vars for GEMINI_API_KEY / OPENROUTER_API_KEY etc."""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from core import db, get_admin, q
from services.llm_config_service import decrypt_api_key, encrypt_api_key, mask_api_key

router = APIRouter(prefix="/admin/llm-providers", tags=["admin_llm_providers"])


class LlmProviderIn(BaseModel):
    provider_name: str
    model_name: str
    api_key: str


class LlmProviderUpdateIn(BaseModel):
    provider_name: str | None = None
    model_name: str | None = None
    api_key: str | None = None  # omit to keep the existing stored key


def _require_platform_admin(authorization: str) -> dict:
    admin = get_admin(authorization)
    if not admin["is_platform"]:
        raise HTTPException(403, "only platform admins manage LLM providers")
    return admin


def _row_to_dict(row) -> dict:
    return {
        "id": str(row[0]),
        "provider_name": row[1],
        "model_name": row[2],
        "api_key_masked": mask_api_key(decrypt_api_key(row[3])) if row[3] else "",
        "is_default": row[4],
        "is_video_engine": row[5],
        "created_at": row[6].isoformat() if row[6] else None,
        "updated_at": row[7].isoformat() if row[7] else None,
    }


@router.get("")
def list_providers(authorization: str = Header(...)):
    _require_platform_admin(authorization)
    with db() as conn:
        rows = q(
            conn,
            "SELECT id, provider_name, model_name, api_key_encrypted, is_default, "
            "is_video_engine, created_at, updated_at FROM llm_providers ORDER BY created_at ASC",
        ).fetchall()
    return {"providers": [_row_to_dict(r) for r in rows]}


@router.post("", status_code=201)
def create_provider(body: LlmProviderIn, authorization: str = Header(...)):
    admin = _require_platform_admin(authorization)
    if not body.provider_name.strip() or not body.model_name.strip() or not body.api_key.strip():
        raise HTTPException(400, "provider_name, model_name, and api_key are all required")

    with db() as conn:
        row = q(
            conn,
            "INSERT INTO llm_providers (provider_name, model_name, api_key_encrypted, created_by) "
            "VALUES (%s, %s, %s, %s) "
            "RETURNING id, provider_name, model_name, api_key_encrypted, is_default, is_video_engine, created_at, updated_at",
            (body.provider_name.strip(), body.model_name.strip(), encrypt_api_key(body.api_key.strip()), admin["user_id"]),
        ).fetchone()
        conn.commit()
    return _row_to_dict(row)


@router.put("/{provider_id}")
def update_provider(provider_id: str, body: LlmProviderUpdateIn, authorization: str = Header(...)):
    _require_platform_admin(authorization)

    updates, params = [], []
    if body.provider_name is not None:
        updates.append("provider_name = %s")
        params.append(body.provider_name.strip())
    if body.model_name is not None:
        updates.append("model_name = %s")
        params.append(body.model_name.strip())
    if body.api_key is not None and body.api_key.strip():
        updates.append("api_key_encrypted = %s")
        params.append(encrypt_api_key(body.api_key.strip()))

    if not updates:
        raise HTTPException(400, "nothing to update")
    updates.append("updated_at = NOW()")

    with db() as conn:
        params.append(provider_id)
        row = q(
            conn,
            f"UPDATE llm_providers SET {', '.join(updates)} WHERE id = %s "
            "RETURNING id, provider_name, model_name, api_key_encrypted, is_default, is_video_engine, created_at, updated_at",
            tuple(params),
        ).fetchone()
        if not row:
            raise HTTPException(404, "provider not found")
        conn.commit()
    return _row_to_dict(row)


@router.delete("/{provider_id}")
def delete_provider(provider_id: str, authorization: str = Header(...)):
    _require_platform_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT is_default, is_video_engine FROM llm_providers WHERE id = %s", (provider_id,)).fetchone()
        if not row:
            raise HTTPException(404, "provider not found")
        if row[0] or row[1]:
            raise HTTPException(409, "cannot delete the default or video-generation provider -- assign another one first")
        q(conn, "DELETE FROM llm_providers WHERE id = %s", (provider_id,))
        conn.commit()
    return {"status": "ok", "deleted_id": provider_id}


@router.post("/{provider_id}/set-default")
def set_default_provider(provider_id: str, authorization: str = Header(...)):
    _require_platform_admin(authorization)
    with db() as conn:
        exists = q(conn, "SELECT id FROM llm_providers WHERE id = %s", (provider_id,)).fetchone()
        if not exists:
            raise HTTPException(404, "provider not found")
        q(conn, "UPDATE llm_providers SET is_default = FALSE WHERE is_default = TRUE")
        q(conn, "UPDATE llm_providers SET is_default = TRUE, updated_at = NOW() WHERE id = %s", (provider_id,))
        conn.commit()
    return {"status": "ok", "default_id": provider_id}


@router.post("/{provider_id}/set-video-engine")
def set_video_engine_provider(provider_id: str, authorization: str = Header(...)):
    _require_platform_admin(authorization)
    with db() as conn:
        exists = q(conn, "SELECT id FROM llm_providers WHERE id = %s", (provider_id,)).fetchone()
        if not exists:
            raise HTTPException(404, "provider not found")
        q(conn, "UPDATE llm_providers SET is_video_engine = FALSE WHERE is_video_engine = TRUE")
        q(conn, "UPDATE llm_providers SET is_video_engine = TRUE, updated_at = NOW() WHERE id = %s", (provider_id,))
        conn.commit()
    return {"status": "ok", "video_engine_id": provider_id}
