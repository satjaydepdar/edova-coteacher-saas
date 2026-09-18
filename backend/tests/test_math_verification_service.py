"""Deterministic tests for the verification gate -- no LLM/API key needed, since this
service never calls one. Uses the two example problems from the Edova AI Mathematics
Explainer Video Factory spec doc, with expected results hand-verified algebraically
(see comments) before being encoded here, so a passing test means the verifier agrees
with real math, not just with itself."""
import sys

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from services.math_verification_service import verify_equation, verify_solution

print("1. Doc example 1 -- identity: (sin+csc)^2 + (cos+sec)^2 = 7 + tan^2 + cot^2")
# Hand check: (s+cscθ)^2=(sin^2+2+csc^2), (cos+sec)^2=(cos^2+2+sec^2), sum=1+4+csc^2+sec^2
# = 5+(1+cot^2)+(1+tan^2) = 7+tan^2+cot^2. True identity for all theta.
result = verify_equation(
    "(sin(theta) + csc(theta))^2 + (cos(theta) + sec(theta))^2",
    "7 + tan(theta)^2 + cot(theta)^2",
)
print("   passed:", result["passed"])
assert result["passed"], f"known-true identity was rejected: {result}"

print("2. Doc example 1 -- a DELIBERATELY WRONG identity must be rejected...")
result = verify_equation("sin(theta) + cos(theta)", "1")
print("   passed:", result["passed"], "(expected False)")
assert not result["passed"], "verifier accepted a false identity -- the gate has no teeth"

print("3. Doc example 2 -- cofunction identity step: cosec(A-20) = sec(110-A)")
# csc(x) = sec(90-x) is the standard cofunction identity; x = A-20 here.
result = verify_equation("cosec(A - 20)", "sec(110 - A)")
print("   passed:", result["passed"])
assert result["passed"], f"known-true cofunction identity was rejected: {result}"

print("4. Doc example 2 -- full verify_solution() pipeline, A = 22...")
problem_analysis = {
    "constraints": [
        {"expression": "0 < 4*A", "values": {"A": 22}},
        {"expression": "4*A < 90", "values": {"A": 22}},
    ]
}
solution_steps = [
    {"step_number": 1, "lhs": "cosec(A - 20)", "rhs": "sec(110 - A)"},
]
final_answer = {"lhs": "sec(4*A)", "rhs": "cosec(A - 20)", "values": {"A": 22}}
report = verify_solution(problem_analysis, solution_steps, final_answer)
print("   status:", report["status"])
print("   constraint_checks:", report["constraint_checks"])
print("   final_answer_check passed:", report["final_answer_check"].get("passed"))
assert report["status"] == "VERIFIED", f"expected VERIFIED, got: {report}"
assert all(c["satisfied"] for c in report["constraint_checks"])
assert report["final_answer_check"]["passed"]

print("5. Same problem but with a WRONG final answer (A = 30) must FAIL...")
bad_final_answer = {"lhs": "sec(4*A)", "rhs": "cosec(A - 20)", "values": {"A": 30}}
bad_report = verify_solution(problem_analysis, solution_steps, bad_final_answer)
print("   status:", bad_report["status"], "(expected FAILED)")
assert bad_report["status"] == "FAILED"

print("6. A step verify_solution() can't even parse must count as FAILED, not crash...")
broken_report = verify_solution({}, [{"step_number": 1, "lhs": "not(a valid((expr", "rhs": "1"}])
assert broken_report["status"] == "FAILED"
assert broken_report["failed_steps"]
print("   unparseable step correctly failed rather than raising.")

print("\n*** ALL MATH VERIFICATION GATE TESTS PASSED! ***")
