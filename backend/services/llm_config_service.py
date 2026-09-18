"""Central, DB-backed LLM provider/model/API-key registry. Every feature that calls
an LLM gets its provider/model/key from here (get_llm_config) instead of reading a
.env var directly -- the platform admin is the sole owner of these values, managed via
routers/admin_llm_providers.py + the Admin CMS "LLM Providers" page.

Encryption: API keys are stored encrypted (Fernet) using a key derived from
EDOVA_SECRETS_ENCRYPTION_KEY. That one root secret still has to live somewhere (env
var / AWS Secrets Manager) -- that's unavoidable, something has to unlock the vault --
but it's a single infrastructure secret, never a per-provider key, and no feature code
ever reads it directly."""
import base64
import hashlib
import os
from functools import lru_cache
from typing import Literal, Optional

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException

from core import db, q

_SECRET = os.getenv("EDOVA_SECRETS_ENCRYPTION_KEY", "dev-secret-change-me")


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    # Fernet needs a 32-byte urlsafe-base64 key; derive one from any plain string
    # so this follows the same "arbitrary string env var" convention as JWT_SECRET.
    derived = base64.urlsafe_b64encode(hashlib.sha256(_SECRET.encode()).digest())
    return Fernet(derived)


def encrypt_api_key(raw: str) -> str:
    return _fernet().encrypt(raw.encode()).decode()


def decrypt_api_key(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        raise HTTPException(500, "Stored API key could not be decrypted -- EDOVA_SECRETS_ENCRYPTION_KEY may have changed")


def mask_api_key(raw: str) -> str:
    return f"...{raw[-4:]}" if len(raw) > 4 else "..."


Purpose = Literal["default", "video_generation"]


def get_llm_config(purpose: Purpose = "default") -> dict:
    """Returns {"provider_name", "model_name", "api_key"} for the requested purpose.
    "video_generation" is the dedicated GPT Astra slot (on-demand video generation
    only); every other feature uses "default" (Gemini, until an admin changes it)."""
    column = "is_video_engine" if purpose == "video_generation" else "is_default"
    with db() as conn:
        row = q(
            conn,
            f"SELECT provider_name, model_name, api_key_encrypted FROM llm_providers WHERE {column} = TRUE",
        ).fetchone()

    if not row:
        raise HTTPException(
            503,
            f"No LLM provider configured for '{purpose}'. An admin must add one in "
            "the Admin CMS (LLM Providers) before this feature can be used.",
        )

    return {
        "provider_name": row[0],
        "model_name": row[1],
        "api_key": decrypt_api_key(row[2]),
    }


def get_llm_config_or_none(purpose: Purpose = "default") -> Optional[dict]:
    """Same as get_llm_config but returns None instead of raising -- for call sites
    that already have their own best-effort/fallback behavior on missing config."""
    try:
        return get_llm_config(purpose)
    except HTTPException:
        return None
