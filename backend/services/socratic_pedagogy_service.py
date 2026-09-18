"""Pedagogical/Socratic Planning (spec doc section 6-7). Runs AFTER the verification
gate, on the VERIFIED steps only -- so the teaching sequence never explains a step that
turned out to be wrong, and pedagogy is applied to what's actually correct, not to
Astra's raw (unverified) first draft.
"""
from services.llm_client import call_llm_json

_SYSTEM_PROMPT = """You are a CBSE mathematics teacher turning a VERIFIED step-by-step solution into a \
Socratic teaching script for a short explainer video. Every step given to you has already been checked by a \
deterministic math verifier and is mathematically correct -- your job is teaching sequence, not correctness.

For each step, decide whether it's substantial enough to deserve a Socratic question (a question that invites \
the student to think before being told the answer) or whether it's a trivial mechanical step that should just \
be explained directly. Do not ask a Socratic question for every step -- only where it improves understanding.

Reply with ONLY a JSON object:
{
  "intro_narration": "1-2 sentence introduction to the problem, spoken to the student",
  "steps": [
    {
      "step_number": 1,
      "socratic_question": "string or null if this step doesn't warrant one",
      "thinking_pause_seconds": 3,
      "explanation": "the teacher's spoken explanation of this step, conversational Indian English, no jargon \
beyond what's needed, proportional in length to the step's difficulty"
    }
  ],
  "closing_narration": "1-2 sentence wrap-up stating the final answer, spoken to the student"
}

Tone: clear, calm, encouraging, teacher-like, simple, conversational. Avoid unnecessary jargon and excessive \
verbosity. Narration must be short enough to fit a single video scene (roughly 2-4 sentences per step).
"""


def build_teaching_sequence(verified_solution_steps: list[dict], final_answer_text: str = "") -> dict:
    steps_text = "\n".join(
        f"Step {s.get('step_number')}: {s.get('expression', '')} -- reason: {s.get('reason', s.get('operation', ''))}"
        for s in verified_solution_steps
    )
    user_prompt = f"Verified solution steps:\n{steps_text}\n\nFinal answer: {final_answer_text or 'see steps'}"
    return call_llm_json("video_generation", _SYSTEM_PROMPT, user_prompt)
