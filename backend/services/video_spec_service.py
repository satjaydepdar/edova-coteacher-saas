"""Video Production Specification generator (spec doc section 8). Deterministic --
maps a verified solution + Socratic teaching sequence into the Remotion-consumable
scene spec (video-factory/packages/storyboard's Zod schema). No LLM call here; by the
time this runs, all the language content has already been generated (Astra) and
checked (the verification gate) -- this function only shapes it into scenes.
"""
import re
from typing import Optional


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48] or "video"


def build_video_spec(
    question: str,
    verified_solution_steps: list[dict],
    teaching_sequence: dict,
    video_id: Optional[str] = None,
    fps: int = 30,
) -> dict:
    vid = video_id or _slugify(question)
    scenes = [{
        "id": "intro",
        "type": "core.stepReveal",
        "narration": teaching_sequence.get("intro_narration") or question,
        "padMs": 500,
        "purpose": "problem_introduction",
        "visual": {"explanation": question},
    }]

    ped_steps = {s.get("step_number"): s for s in teaching_sequence.get("steps", [])}
    for step in verified_solution_steps:
        n = step.get("step_number")
        ped = ped_steps.get(n, {})
        socratic_q = ped.get("socratic_question")
        pause_s = ped.get("thinking_pause_seconds") or 0 if socratic_q else 0
        explanation = ped.get("explanation") or step.get("reason") or step.get("expression", "")
        narration = f"{socratic_q} {explanation}".strip() if socratic_q else explanation

        scenes.append({
            "id": f"step-{n}",
            "type": "core.stepReveal",
            "narration": narration,
            "padMs": 500,
            "purpose": "step_reveal",
            "equation": step.get("expression"),
            "socraticQuestion": socratic_q,
            "thinkingPauseMs": int(pause_s * 1000),
            "visual": {
                "equation": step.get("expression"),
                "socraticQuestion": socratic_q,
                "thinkingPauseFrames": int(pause_s * fps),
                "explanation": explanation,
            },
        })

    closing = teaching_sequence.get("closing_narration") or "That's our final answer."
    scenes.append({
        "id": "final-answer",
        "type": "core.answer",
        "narration": closing,
        "padMs": 600,
        "purpose": "final_answer",
        "visual": {"headline": closing},
    })

    return {
        "videoId": vid,
        "title": question[:120],
        "template": "astra-generated",
        "schemaVersion": "1.0",
        "question": question,
        "aspect": "16:9",
        "fps": fps,
        "scenes": scenes,
        "componentLock": {"core.stepReveal": "0.1.0", "core.answer": "0.1.0"},
    }
