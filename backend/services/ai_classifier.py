"""AI-assisted classification for raw, PDF-extracted question text.

Best-effort by design: any failure (missing key, network error, bad JSON,
insufficient provider credits) raises AIClassificationError, and the caller
(main.py's ingestion endpoint) falls back to the plain regex heuristic. AI is
never allowed to block ingestion.

Model/key come from the admin-managed llm_providers registry ("default" purpose --
see services/llm_config_service.py) instead of AI_INGESTION_MODEL/OPENROUTER_API_KEY
env vars. Known limitation: this still talks to OpenRouter's endpoint specifically,
so the configured default's API key must be an OpenRouter key for this feature to
work -- a native per-provider dispatch (direct Gemini/OpenAI/... SDK calls) is a
separate follow-up, not solved here.
"""
import json

import httpx

from services.llm_config_service import get_llm_config_or_none

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_VALID_TYPES = {
    "MCQ", "MCQ_COMBINATION", "ASSERTION_REASONING", "SHORT_ANSWER",
    "LONG_ANSWER", "FILL_IN_THE_BLANKS", "MATCH_THE_FOLLOWING", "NUMERICAL", "CASE_STUDY",
}
_VALID_DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}

_SYSTEM_PROMPT = (
    "You classify and clean a single exam question extracted from a PDF. The extraction "
    "is often noisy: broken lines, stray page numbers, OCR artifacts. Reply with ONLY a "
    'JSON object shaped like: {"question_type": one of '
    "MCQ, MCQ_COMBINATION, ASSERTION_REASONING, SHORT_ANSWER, LONG_ANSWER, "
    'FILL_IN_THE_BLANKS, MATCH_THE_FOLLOWING, NUMERICAL, CASE_STUDY, '
    '"question_text": the cleaned question text with option markers removed, '
    '"difficulty": EASY, MEDIUM, or HARD, '
    '"options": [{"key": "A", "text": "...", "correct": true|false}] (empty list if not '
    "applicable; if you can work out the correct option, mark it true and every other "
    'false, otherwise mark them all false), "confidence": a 0-1 float for how confident '
    "you are in this classification.}"
)


class AIClassificationError(Exception):
    pass


def classify_with_ai(raw_text: str, *, timeout: float = 30.0) -> dict:
    cfg = get_llm_config_or_none("default")
    if not cfg:
        raise AIClassificationError("No default LLM provider configured (Admin CMS > LLM Providers)")

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {cfg['api_key']}"},
            json={
                "model": cfg["model_name"],
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": raw_text},
                ],
            },
            timeout=timeout,
        )
    except httpx.HTTPError as exc:
        raise AIClassificationError(f"request to OpenRouter failed: {exc}") from exc

    try:
        body = response.json()
    except json.JSONDecodeError as exc:
        raise AIClassificationError(f"non-JSON response from OpenRouter: {exc}") from exc

    if "error" in body:
        raise AIClassificationError(body["error"].get("message", "unknown OpenRouter error"))
    if response.status_code >= 400:
        raise AIClassificationError(f"OpenRouter returned HTTP {response.status_code}: {body}")

    try:
        content = body["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise AIClassificationError(f"could not parse model output: {exc}") from exc

    validated = _validate(parsed)
    validated["model_name"] = cfg["model_name"]
    return validated


def _validate(parsed: dict) -> dict:
    if parsed.get("question_type") not in _VALID_TYPES:
        raise AIClassificationError(f"invalid question_type: {parsed.get('question_type')!r}")
    question_text = str(parsed.get("question_text") or "").strip()
    if not question_text:
        raise AIClassificationError("model returned an empty question_text")

    options = []
    for opt in parsed.get("options") or []:
        key, text = opt.get("key"), opt.get("text")
        if key and text:
            options.append({"key": key, "text": str(text).strip(), "correct": bool(opt.get("correct"))})

    return {
        "question_type": parsed["question_type"],
        "question_text": question_text,
        "difficulty": parsed.get("difficulty") if parsed.get("difficulty") in _VALID_DIFFICULTIES else None,
        "options": options,
        "confidence": float(parsed.get("confidence") or 0.0),
    }
