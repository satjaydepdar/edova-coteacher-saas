"""Creates the llm_providers table (platform-admin-owned LLM/model/API-key registry)
and seeds one default Gemini row from GEMINI_API_KEY if present, so the system isn't
empty on first boot. GEMINI_API_KEY itself stops being read at runtime after this --
see services/llm_config_service.py."""
import os
import sys

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import db
from services.llm_config_service import encrypt_api_key

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(150) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_video_engine BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one default and one video-engine row, enforced at the DB level so a bug
-- in the application layer can't silently leave two "active" defaults.
CREATE UNIQUE INDEX IF NOT EXISTS uq_llm_providers_one_default
    ON llm_providers ((is_default)) WHERE is_default;
CREATE UNIQUE INDEX IF NOT EXISTS uq_llm_providers_one_video_engine
    ON llm_providers ((is_video_engine)) WHERE is_video_engine;
"""


def main():
    print("1. Creating llm_providers table...")
    with db() as conn:
        conn.execute(MIGRATION_SQL)
        conn.commit()
    print("Migration executed successfully.")

    print("2. Seeding a default Gemini row if none exists...")
    with db() as conn:
        existing = conn.execute("SELECT COUNT(*) FROM llm_providers").fetchone()[0]
        if existing > 0:
            print(f"   {existing} row(s) already present -- skipping seed.")
            return

        seed_key = os.getenv("GEMINI_API_KEY", "")
        if not seed_key:
            print("   No GEMINI_API_KEY in env -- leaving llm_providers empty. "
                  "Add a provider from the Admin CMS before using any LLM feature.")
            return

        conn.execute(
            "INSERT INTO llm_providers (provider_name, model_name, api_key_encrypted, is_default) "
            "VALUES (%s, %s, %s, TRUE)",
            ("Google", "gemini-1.5-flash", encrypt_api_key(seed_key)),
        )
        conn.commit()
        print("   Seeded default Google / gemini-1.5-flash from GEMINI_API_KEY.")


if __name__ == "__main__":
    main()
