"""Mathematical Verification Gate (Edova AI Mathematics Explainer Video Factory spec,
section 5). Deterministic -- does NOT call any LLM. Astra's reasoning is never trusted
as final authority; every step here is checked with SymPy before a video can render.

Verification is numeric, not purely symbolic: trig identity notation varies too much
for robust symbolic simplification to be practical for a v1 gate, so each step is
checked by substituting several numeric sample points (avoiding poles) and comparing
both sides within a tolerance. This is standard practice for identity verification and
is what a human would do to spot-check a claimed identity by hand.

Expression format solution steps must use (this is enforced by the prompt in
astra_reasoning_service.py, not re-derived here): plain ASCII math using sympy's
function names (sin, cos, tan, sec, csc, cot, sqrt, pi), angles in DEGREES as bare
numbers or symbols (e.g. "sec(4*A)", "cosec(A - 20)" -- "cosec" is normalized to csc),
"=" separating the two sides of an equation, "^" for powers.
"""
from typing import Any, Literal, Optional

import sympy as sp
from sympy import Symbol, csc, cos, cot, pi, sec, sin, sqrt, sympify, tan

# Trig functions take their FULL argument expression in degrees (e.g. sec(110 - A) with
# A a plain degree number) and convert to radians internally -- as opposed to converting
# just a substituted symbol to radians and leaving literal numbers in the same
# expression un-converted, which silently mixes units (radians(A) - 20 is nonsense).
def _deg_wrap(fn):
    return lambda x: fn(x * pi / 180)


_LOCAL_FUNCS = {
    "sin": _deg_wrap(sin), "cos": _deg_wrap(cos), "tan": _deg_wrap(tan),
    "sec": _deg_wrap(sec), "csc": _deg_wrap(csc), "cosec": _deg_wrap(csc), "cot": _deg_wrap(cot),
    "sqrt": sqrt, "pi": pi,
}

# Degrees safely away from poles of tan/sec/cot (90, 270) and csc/cot (0, 180) for
# single-variable sampling. Good enough for a v1 gate across arbitrary CBSE trig
# identities in one variable; multi-variable steps sample the cartesian product,
# capped to keep runtime bounded.
_DEFAULT_SAMPLE_DEGREES = [17, 34, 51, 68]
_MAX_SAMPLES = 12
_TOLERANCE = 1e-6


class VerificationError(Exception):
    pass


def _normalize(expr_str: str) -> str:
    return expr_str.replace("^", "**").replace("°", "").strip()


def _parse(expr_str: str, symbol_names: list[str]) -> Any:
    local_dict = {**_LOCAL_FUNCS, **{name: Symbol(name) for name in symbol_names}}
    try:
        return sympify(_normalize(expr_str), locals=local_dict)
    except (sp.SympifyError, SyntaxError, TypeError) as exc:
        raise VerificationError(f"could not parse expression {expr_str!r}: {exc}") from exc


def _free_symbol_names(*expressions: Any) -> list[str]:
    names: set[str] = set()
    for e in expressions:
        names.update(str(s) for s in e.free_symbols)
    return sorted(names)


def _sample_points(symbol_names: list[str], fixed_values: Optional[dict] = None) -> list[dict]:
    """Cartesian product of _DEFAULT_SAMPLE_DEGREES over any free (non-fixed) symbols,
    capped at _MAX_SAMPLES."""
    fixed_values = fixed_values or {}
    free = [n for n in symbol_names if n not in fixed_values]
    if not free:
        return [dict(fixed_values)]

    samples = [dict(fixed_values)]
    for name in free:
        next_samples = []
        for base in samples:
            for deg in _DEFAULT_SAMPLE_DEGREES:
                next_samples.append({**base, name: deg})
        samples = next_samples
        if len(samples) >= _MAX_SAMPLES:
            break
    return samples[:_MAX_SAMPLES]


def verify_equation(
    lhs_str: str,
    rhs_str: str,
    *,
    fixed_values: Optional[dict[str, float]] = None,
    tolerance: float = _TOLERANCE,
) -> dict:
    """Checks lhs == rhs. If fixed_values pins every free symbol, this is a single
    substitution check (e.g. a final-answer or constraint check). Otherwise it's
    treated as a claimed identity and checked at several sample points."""
    fixed_values = fixed_values or {}
    try:
        lhs = _parse(lhs_str, list(fixed_values.keys()))
        rhs = _parse(rhs_str, list(fixed_values.keys()))
    except VerificationError as exc:
        return {"passed": False, "error": str(exc), "samples": []}

    symbol_names = _free_symbol_names(lhs, rhs)
    samples = _sample_points(symbol_names, fixed_values)

    results = []
    for sample in samples:
        # Plain degree numbers -- the _deg_wrap'd trig functions do the radian
        # conversion on the whole argument expression, not on this substitution alone.
        subs = {Symbol(k): v for k, v in sample.items()}
        try:
            lval = complex(lhs.subs(subs).evalf())
            rval = complex(rhs.subs(subs).evalf())
        except (TypeError, ValueError, ZeroDivisionError) as exc:
            results.append({"sample": sample, "error": str(exc)})
            continue
        diff = abs(lval - rval)
        results.append({"sample": sample, "lhs": lval.real, "rhs": rval.real, "match": diff < tolerance})

    usable = [r for r in results if "match" in r]
    passed = len(usable) > 0 and all(r["match"] for r in usable)
    return {"passed": passed, "samples": results}


def verify_constraint(constraint_expr: str, values: dict[str, float]) -> dict:
    """constraint_expr is a Python/sympy-parseable boolean inequality string using the
    given symbol names, e.g. "0 < 4*A" and "4*A < 90" (split the "0 < x < 90" form into
    two before calling, since sympy doesn't parse chained inequalities from a string)."""
    try:
        expr = _parse(constraint_expr, list(values.keys()))
        result = bool(expr.subs({Symbol(k): v for k, v in values.items()}))
        return {"constraint": constraint_expr, "values": values, "satisfied": result}
    except VerificationError as exc:
        return {"constraint": constraint_expr, "values": values, "satisfied": False, "error": str(exc)}


Status = Literal["VERIFIED", "FAILED", "NEEDS_REVIEW"]


def verify_solution(problem_analysis: dict, solution_steps: list[dict], final_answer: Optional[dict] = None) -> dict:
    """Runs every step, every constraint, and the final answer through deterministic
    checks. Returns the exact shape the spec doc asks for. Never raises -- a step that
    can't even be parsed counts as FAILED, not an exception that skips verification."""
    verified_steps, failed_steps, warnings = [], [], []

    for step in solution_steps:
        lhs, rhs = step.get("lhs"), step.get("rhs")
        if not lhs or not rhs:
            failed_steps.append({**step, "reason": "step missing lhs/rhs to verify"})
            continue
        result = verify_equation(lhs, rhs, fixed_values=step.get("fixed_values"))
        record = {"step_number": step.get("step_number"), "expression": f"{lhs} = {rhs}", **result}
        (verified_steps if result["passed"] else failed_steps).append(record)

    constraint_checks = []
    for c in problem_analysis.get("constraints", []):
        expr = c.get("expression")
        values = c.get("values")
        if not expr or not values:
            warnings.append(f"constraint {c!r} missing expression/values -- skipped, not verified")
            continue
        constraint_checks.append(verify_constraint(expr, values))

    final_answer_check = {}
    if final_answer:
        lhs, rhs = final_answer.get("lhs"), final_answer.get("rhs")
        values = final_answer.get("values")
        if lhs and rhs and values:
            final_answer_check = {**verify_equation(lhs, rhs, fixed_values=values), "lhs": lhs, "rhs": rhs, "values": values}
        else:
            warnings.append("final_answer missing lhs/rhs/values -- not verified")

    all_constraints_ok = all(c.get("satisfied") for c in constraint_checks) if constraint_checks else True
    final_answer_ok = final_answer_check.get("passed", True) if final_answer else True

    if not solution_steps:
        status: Status = "NEEDS_REVIEW"
        warnings.append("no solution steps provided")
    elif failed_steps or not all_constraints_ok or not final_answer_ok:
        status = "FAILED"
    else:
        status = "VERIFIED"

    return {
        "status": status,
        "verified_steps": verified_steps,
        "failed_steps": failed_steps,
        "constraint_checks": constraint_checks,
        "final_answer_check": final_answer_check,
        "warnings": warnings,
    }
