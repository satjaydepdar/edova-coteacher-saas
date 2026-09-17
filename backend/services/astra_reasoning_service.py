"""Astra problem analysis + mathematical reasoning (spec doc sections 1-4). Calls the
LLM configured as "video_generation" (GPT Astra, via services/llm_config_service) --
never treated as final authority: everything it returns is checked afterwards by
services/math_verification_service.py, which trusts nothing here.
"""
from typing import Optional

from pydantic import BaseModel, Field

from services.llm_client import call_llm_json


class QuestionInput(BaseModel):
    question: str
    class_: Optional[str] = Field(default=None, alias="class")
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    marks: Optional[float] = None
    source: Optional[str] = None
    difficulty: Optional[str] = None
    language: str = "en-IN"
    teaching_method: str = "socratic"

    class Config:
        populate_by_name = True


# Expression format rules mirror exactly what math_verification_service.py can check:
# ASCII math, sympy function names (sin/cos/tan/sec/csc or cosec/cot/sqrt/pi), angles
# as bare degree numbers/symbols (no ° symbol, no explicit *pi/180 -- the verifier
# applies that), "^" for powers. Every claimed equality must be split into lhs/rhs so
# it can be checked as an equation, not accepted as prose.
_SYSTEM_PROMPT = """You are Astra, a mathematical reasoning engine for CBSE-level (Indian secondary school) \
mathematics. You analyse a question and produce a structured, step-by-step solution. You are NOT the final \
mathematical authority -- a separate deterministic verifier checks every claim you make, so be precise and \
explicit rather than persuasive.

Reply with ONLY a JSON object of this exact shape:
{
  "problem_analysis": {
    "problem_type": "string",
    "mathematical_domain": "string",
    "known_values": {"name": "value or expression"},
    "unknowns": ["name"],
    "constraints": [
      {"description": "string", "expression": "python/sympy boolean expression using bare degree numbers, \
e.g. '0 < 4*A' -- split a chained inequality like 0 < 4A < 90 into two separate entries", "values": null}
    ],
    "required_concepts": ["string"],
    "required_identities": ["string"],
    "expected_answer_type": "string",
    "ambiguity_flags": ["string"]
  },
  "solution_steps": [
    {
      "step_number": 1,
      "lhs": "left side of a claimed equality, ASCII math, sympy names (sin, cos, tan, sec, csc or cosec, \
cot, sqrt, pi), bare degree numbers/symbols, '^' for powers -- e.g. 'cosec(A - 20)'",
      "rhs": "right side of the SAME claimed equality -- e.g. 'sec(110 - A)'",
      "operation": "string, e.g. 'cofunction transformation'",
      "reason": "string, e.g. 'cosec x = sec(90 - x)'",
      "concepts_used": ["string"],
      "fixed_values": null
    }
  ],
  "final_answer": {
    "lhs": "the ORIGINAL problem equation's left side, evaluated at the solved value(s)",
    "rhs": "the ORIGINAL problem equation's right side",
    "values": {"symbol_name": numeric_degree_or_value},
    "answer_text": "human-readable final answer, e.g. 'A = 22 degrees'"
  }
}

Rules:
- Every solution_steps entry MUST be a genuine mathematical identity/transformation that holds for ALL \
values of its free variables (it will be checked by substituting several sample values) -- do NOT put the \
problem's own given equation, or an equation only true at the final answer, in solution_steps. Put those in \
final_answer instead, with "values" pinning every free symbol to its solved numeric value so it can be \
checked by direct substitution.
- If a step is only true at a specific value (not a general identity), set "fixed_values" to an object \
pinning every free symbol used in that step to that numeric value.
- constraints entries you cannot express as a "values"-checkable expression should have "values": null and \
will be treated as a warning, not a hard failure -- but include as many as you can express.
- For a "prove this identity" question with no unknown to solve for, final_answer may be null, but at least \
one solution_steps entry MUST reconstruct the full identity end to end (or several steps chained together \
must).
- Do not skip steps or leave unexplained jumps -- every step must have a concepts_used/reason.
"""


def analyze_and_solve(question_input: QuestionInput) -> dict:
    user_prompt = (
        f"Question: {question_input.question}\n"
        f"Class: {question_input.class_ or 'not specified'}\n"
        f"Subject: {question_input.subject or 'not specified'}\n"
        f"Chapter: {question_input.chapter or 'not specified'}\n"
        f"Difficulty: {question_input.difficulty or 'not specified'}\n"
    )
    return call_llm_json("video_generation", _SYSTEM_PROMPT, user_prompt)
