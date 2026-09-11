"""Ported from edova-pilot-v4/backend/app/services/engine.py.

Only get_pedagogical_scaffold is ported: that pilot's own migration notes
(PHASE-6C-MIGRATION-NOTES.md) record that step-correctness checking moved
from this module's verify_algebraic_equivalence() to the separate CoTeacher
API -- confirmed by tracing the actual current frontend flow, which never
calls the old /submit endpoint. Porting the deprecated evaluator here would
just be dead code with a sympy dependency to match."""
from typing import Any, Dict

def get_pedagogical_scaffold(
    concept_title: str,
    context: str,
    current_prompt: str,
    sal: float,
    step_data: Dict[str, Any],
    is_retry: bool = False
) -> Dict[str, Any]:
    """Returns pedagogical hint and quick options based on Scaffold Assistance Level (SAL)."""
    hints = step_data.get("hints", {})
    quick_opts = step_data.get("quick_options", [])

    if sal >= 0.7:
        hint_text = hints.get("high", current_prompt)
        strategy = "high_scaffold"
    elif sal >= 0.4:
        hint_text = hints.get("mid", current_prompt)
        strategy = "mid_scaffold"
    else:
        hint_text = hints.get("low", current_prompt)
        strategy = "low_scaffold"

    return {
        "scaffold": hint_text,
        "strategy": strategy,
        "quick_options": quick_opts if sal >= 0.6 else []
    }
