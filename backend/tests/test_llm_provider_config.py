import sys

backend_path = r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend'
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from main import app
from core import db, issue_token, _qcount
from services.llm_config_service import get_llm_config, get_llm_config_or_none

client = TestClient(app)
# q() (used by llm_config_service) requires the request-scoped _qcount ContextVar
# that main.py's middleware normally sets per-request; set it once here since this
# script calls get_llm_config directly, outside of any real request.
_qcount.set([0])

print("1. Fetching platform admin...")
with db() as conn:
    row = conn.execute("""
        SELECT u.id, u.email FROM users u
        JOIN user_tenant_mappings utm ON u.id = utm.user_id
        JOIN tenants t ON t.id = utm.tenant_id
        WHERE utm.role = 'ADMIN' AND t.type = 'PLATFORM'
        LIMIT 1
    """).fetchone()
assert row is not None, "No platform admin found"
admin_id, admin_email = str(row[0]), row[1]
print(f"Platform admin: {admin_email}")

token = issue_token(admin_id)
headers = {"Authorization": f"Bearer {token}"}

print("2. No config yet -> get_llm_config_or_none returns None...")
assert get_llm_config_or_none("default") is None

print("3. Creating a Google/Gemini provider...")
res = client.post("/admin/llm-providers", json={
    "provider_name": "Google", "model_name": "gemini-1.5-flash", "api_key": "test-google-key-abc123",
}, headers=headers)
print("Create status:", res.status_code, res.json())
assert res.status_code == 201
google_id = res.json()["id"]
assert res.json()["api_key_masked"] == "...c123", "API key must be masked, not returned in plaintext"

print("4. Creating an OpenAI/GPT-Astra-ish provider...")
res = client.post("/admin/llm-providers", json={
    "provider_name": "OpenAI", "model_name": "gpt-astra", "api_key": "test-openai-key-xyz789",
}, headers=headers)
assert res.status_code == 201
astra_id = res.json()["id"]

print("5. Listing providers...")
res = client.get("/admin/llm-providers", headers=headers)
assert res.status_code == 200
providers = res.json()["providers"]
assert len(providers) == 2
assert all("api_key_masked" in p and "api_key" not in p for p in providers)
print(f"Listed {len(providers)} providers, keys correctly masked.")

print("6. No default set yet -> get_llm_config raises 503-shaped HTTPException...")
try:
    get_llm_config("default")
    raise AssertionError("expected HTTPException")
except Exception as e:
    assert "503" in str(getattr(e, "status_code", "")) or getattr(e, "status_code", None) == 503
print("Correctly refused: no default configured.")

print("7. Setting Google provider as default...")
res = client.post(f"/admin/llm-providers/{google_id}/set-default", headers=headers)
assert res.status_code == 200

print("8. get_llm_config('default') now returns the real decrypted key...")
cfg = get_llm_config("default")
assert cfg["provider_name"] == "Google"
assert cfg["model_name"] == "gemini-1.5-flash"
assert cfg["api_key"] == "test-google-key-abc123", "decrypted key must round-trip exactly"
print("Round-trip verified:", cfg["provider_name"], cfg["model_name"])

print("9. Setting OpenAI provider as the video-generation (GPT Astra) engine...")
res = client.post(f"/admin/llm-providers/{astra_id}/set-video-engine", headers=headers)
assert res.status_code == 200

print("10. get_llm_config('video_generation') returns the OpenAI/astra entry, independent of default...")
cfg2 = get_llm_config("video_generation")
assert cfg2["model_name"] == "gpt-astra"
assert cfg2["api_key"] == "test-openai-key-xyz789"
print("Video-generation slot independent of default: confirmed.")

print("11. Cannot delete the default or video-engine provider...")
res = client.delete(f"/admin/llm-providers/{google_id}", headers=headers)
assert res.status_code == 409
res = client.delete(f"/admin/llm-providers/{astra_id}", headers=headers)
assert res.status_code == 409
print("Correctly blocked deletion of active default/video-engine rows.")

print("12. Editing the Google provider's model name...")
res = client.put(f"/admin/llm-providers/{google_id}", json={"model_name": "gemini-2.0-flash"}, headers=headers)
assert res.status_code == 200
assert res.json()["model_name"] == "gemini-2.0-flash"
assert get_llm_config("default")["model_name"] == "gemini-2.0-flash"
print("Edit propagated correctly.")

print("13. Cleanup (direct DB, same as this repo's other test scripts)...")
with db() as conn:
    conn.execute("DELETE FROM llm_providers")
    conn.commit()
print("Cleanup complete.")

print("\n*** ALL LLM PROVIDER CONFIG TESTS PASSED! ***")
