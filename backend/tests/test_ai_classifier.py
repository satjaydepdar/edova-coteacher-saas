"""Unit tests for ai_classifier.py — pure function, no live server needed.
Mocks httpx.post so this never hits the network or costs money."""
from unittest.mock import MagicMock, patch

from ai_classifier import AIClassificationError, classify_with_ai
from testutil import check, finish


def _fake_response(body: dict, status_code: int = 200):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = body
    return resp


# TC1: a well-formed model response is parsed and validated
good_body = {
    "choices": [{"message": {"content":
        '{"question_type": "NUMERICAL", "question_text": "What is 12 / 4?", '
        '"difficulty": "EASY", "options": [], "confidence": 0.9}'
    }}]
}
with patch("ai_classifier.httpx.post", return_value=_fake_response(good_body)), \
     patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
    result = classify_with_ai("12 / 4 = ? (garbled)")
ok = (result["question_type"] == "NUMERICAL" and result["question_text"] == "What is 12 / 4?"
      and result["difficulty"] == "EASY" and result["confidence"] == 0.9 and result["options"] == [])
check("TC1 classify_with_ai parses a well-formed response", ok, f"{result}")

# TC2: missing API key raises AIClassificationError (caller falls back to heuristic)
with patch.dict("os.environ", {}, clear=True):
    try:
        classify_with_ai("anything")
        ok = False
    except AIClassificationError:
        ok = True
check("TC2 missing OPENROUTER_API_KEY raises AIClassificationError", ok, "")

# TC3: provider error body (e.g. insufficient credits) raises AIClassificationError
error_body = {"error": {"message": "Insufficient credits", "code": 402}}
with patch("ai_classifier.httpx.post", return_value=_fake_response(error_body, status_code=402)), \
     patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
    try:
        classify_with_ai("anything")
        ok = False
    except AIClassificationError as exc:
        ok = "Insufficient credits" in str(exc)
check("TC3 provider error body raises AIClassificationError with message", ok, "")

# TC4: an invalid question_type from the model is rejected, not silently trusted
bad_type_body = {
    "choices": [{"message": {"content": '{"question_type": "NOT_A_TYPE", "question_text": "x"}'}}]
}
with patch("ai_classifier.httpx.post", return_value=_fake_response(bad_type_body)), \
     patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}):
    try:
        classify_with_ai("anything")
        ok = False
    except AIClassificationError:
        ok = True
check("TC4 invalid question_type from model is rejected", ok, "")

finish()
