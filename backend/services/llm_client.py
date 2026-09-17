"""Generic "call the admin-configured LLM, get JSON back" client, dispatched by
provider_name (from services/llm_config_service.get_llm_config). Shared by
astra_reasoning_service.py and socratic_pedagogy_service.py so provider support is
written once. Unlike services/ai_classifier.py (which always calls OpenRouter
regardless of the configured provider -- a known, documented limitation there), this
dispatches to each provider's own native API.
"""
import json

import httpx

from services.llm_config_service import get_llm_config

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"


class LlmCallError(Exception):
    pass


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise LlmCallError(f"model did not return valid JSON: {exc}. Raw: {text[:300]}") from exc


def _call_gemini(api_key: str, model_name: str, system_prompt: str, user_prompt: str, timeout: float) -> dict:
    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise LlmCallError(f"google-generativeai not installed: {exc}") from exc
    genai.configure(api_key=api_key, transport="rest")
    model = genai.GenerativeModel(model_name, system_instruction=system_prompt)
    response = model.generate_content(
        user_prompt,
        generation_config={"response_mime_type": "application/json"},
        request_options={"timeout": timeout},
    )
    return _extract_json(response.text)


def _call_openai(api_key: str, model_name: str, system_prompt: str, user_prompt: str, timeout: float) -> dict:
    res = httpx.post(
        OPENAI_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model_name,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        },
        timeout=timeout,
    )
    if res.status_code >= 400:
        raise LlmCallError(f"OpenAI returned HTTP {res.status_code}: {res.text[:300]}")
    body = res.json()
    return _extract_json(body["choices"][0]["message"]["content"])


def _call_openrouter_compatible(api_key: str, model_name: str, system_prompt: str, user_prompt: str, timeout: float) -> dict:
    res = httpx.post(
        OPENROUTER_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model_name,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        },
        timeout=timeout,
    )
    if res.status_code >= 400:
        raise LlmCallError(f"OpenRouter returned HTTP {res.status_code}: {res.text[:300]}")
    body = res.json()
    return _extract_json(body["choices"][0]["message"]["content"])


def call_llm_json(purpose: str, system_prompt: str, user_prompt: str, *, timeout: float = 60.0) -> dict:
    """Raises HTTPException(503) via get_llm_config if nothing is configured for
    `purpose`, or LlmCallError if the call itself fails."""
    cfg = get_llm_config(purpose)
    provider = cfg["provider_name"].strip().lower()
    try:
        if provider == "google":
            return _call_gemini(cfg["api_key"], cfg["model_name"], system_prompt, user_prompt, timeout)
        if provider == "openai":
            return _call_openai(cfg["api_key"], cfg["model_name"], system_prompt, user_prompt, timeout)
        # Any other provider name: assume an OpenRouter-issued key (documented
        # limitation, same as ai_classifier.py) so at least something works.
        return _call_openrouter_compatible(cfg["api_key"], cfg["model_name"], system_prompt, user_prompt, timeout)
    except httpx.HTTPError as exc:
        raise LlmCallError(f"request to {provider} failed: {exc}") from exc
