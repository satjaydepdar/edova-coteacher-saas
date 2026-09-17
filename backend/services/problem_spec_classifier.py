"""Converts a free-text CBSE Class 10 math problem into the structured
`problem_spec` that edova-reasoner requires. The reasoner used to parse free
text itself, but that parser was retired upstream (see
edova-reasoner/backend/app/api/session.py: "Runtime regex and NLP problem
parsing have been retired") -- callers must now supply problem_spec directly.
This is that missing caller-side step, for any "Custom Problem" flow where no
curated problem_spec exists ahead of time. Shared across subjects (Trigonometry,
Coordinate Geometry) rather than duplicated per subject, since it's the same
"free text in, structured spec out" job either way -- the model just picks
from whichever type family actually matches the input.

If the model picks a problem_type outside the ones documented below, or the
call fails outright, the reasoner's own chunker falls back to a generic
single-step "enter the final answer" mode rather than erroring -- so a
misclassification degrades gracefully instead of breaking the session.
"""
from services.llm_client import call_llm_json, LlmCallError

SYSTEM_PROMPT = """You convert a CBSE Class 10 math word problem into a JSON \
`problem_spec` object for a deterministic solver. Output ONLY a JSON object, no prose.

Pick the single best-matching `problem_type` and include exactly its fields below \
(all numeric/algebraic values as strings, sympy-parseable, e.g. "20*sqrt(3)", "1/2", "A-B"):

RIGHT_TRIANGLE_RATIOS -- given two sides of a right triangle, find ratios like sin/cos:
  {"problem_type":"RIGHT_TRIANGLE_RATIOS","vertices":["A","B","C"],"right_angle_vertex":"B",
   "known_sides":{"AB":"24","BC":"7"},"target_ratios":[["sin","A"],["cos","A"]]}

COMPOUND_EVALUATION -- a single numeric expression of standard-angle trig values to evaluate:
  {"problem_type":"COMPOUND_EVALUATION","expression":"2*tan(45)**2 + cos(30)**2 - sin(60)**2"}

ANGLE_SYSTEM -- two equations in two unknown angles A, B to solve simultaneously:
  {"problem_type":"ANGLE_SYSTEM","eq1_func":"sin","eq1_arg":"A-B","eq1_val":"1/2",
   "eq2_func":"cos","eq2_arg":"A+B","eq2_val":"1/2"}

HEIGHTS_AND_DISTANCES -- elevation/depression word problem with a single triangle:
  {"problem_type":"HEIGHTS_AND_DISTANCES","archetype":"SINGLE","target":"angle",
   "vertical_entity":"tower","horizontal_entity":"shadow",
   "height_val":"20","distance_val":"20*sqrt(3)","angle_val":null}
  `target` is whichever quantity is UNKNOWN: "angle", "height", "distance", or "hypotenuse".
  Supply only the values given in the problem; leave the rest null.

TRIG_IDENTITY_PROOF -- prove LHS equals RHS for a general/all-angle identity:
  {"problem_type":"TRIG_IDENTITY_PROOF","lhs_text":"(1+cot(A)-cosec(A))*(1+tan(A)+sec(A))",
   "rhs_text":"2","variable":"A"}

TRIG_RATIO_EVALUATION -- given one ratio's value, evaluate another expression in the same angle:
  {"problem_type":"TRIG_RATIO_EVALUATION","given_func":"cot","given_coeff":"1","given_value":"7/8",
   "angle_var":"A","expr":"(1-cos(A))/(1+cos(A))"}

CONDITIONAL_TRIG_IDENTITY -- given sin(x)+cos(x)=k, find a related target expression:
  {"problem_type":"CONDITIONAL_TRIG_IDENTITY","variable":"x","given_value":"1","target_value":"sin(x)*cos(x)"}

-- Coordinate Geometry (points as [x, y] string pairs) --

COORDGEO_CARTESIAN_BASICS -- state a point's abscissa/ordinate and its quadrant:
  {"problem_type":"COORDGEO_CARTESIAN_BASICS","abscissa":4,"ordinate":-5}

COORDGEO_DISTANCE -- distance between two named/plain points:
  {"problem_type":"COORDGEO_DISTANCE","p1":["2","3"],"p2":["4","1"]}

COORDGEO_DISTANCE_FROM_ORIGIN -- distance of one point from the origin:
  {"problem_type":"COORDGEO_DISTANCE_FROM_ORIGIN","p":["-6","8"]}

COORDGEO_COLLINEARITY -- check if three points are collinear using distance:
  {"problem_type":"COORDGEO_COLLINEARITY","p1":["1","-1"],"p2":["5","2"],"p3":["9","5"]}

COORDGEO_TRIANGLE_TYPE -- classify a triangle (equilateral/isosceles/right/scalene) from 3 points:
  {"problem_type":"COORDGEO_TRIANGLE_TYPE","p1":["2","-2"],"p2":["14","10"],"p3":["11","13"]}

COORDGEO_QUADRILATERAL_TYPE -- classify a quadrilateral (square/rhombus/rectangle/parallelogram) from 4 points, in order:
  {"problem_type":"COORDGEO_QUADRILATERAL_TYPE","p1":["-1","-2"],"p2":["1","0"],"p3":["-1","2"],"p4":["-3","0"]}

COORDGEO_SECTION_FORMULA -- point dividing A,B internally in ratio m1:m2:
  {"problem_type":"COORDGEO_SECTION_FORMULA","p1":["1","-5"],"p2":["-4","5"],"m1":1,"m2":2}

COORDGEO_MIDPOINT -- midpoint of two points:
  {"problem_type":"COORDGEO_MIDPOINT","p1":["2","-3"],"p2":["-6","3"]}

COORDGEO_RATIO_AXIS_DIVISION -- ratio in which the x- or y-axis divides a segment:
  {"problem_type":"COORDGEO_RATIO_AXIS_DIVISION","p1":["-4","2"],"p2":["8","6"],"axis":"y"}

COORDGEO_TRISECTION -- the two points that divide a segment into three equal parts:
  {"problem_type":"COORDGEO_TRISECTION","p1":["4","-1"],"p2":["-2","-3"]}

COORDGEO_PARALLELOGRAM_VERTEX -- find a missing vertex of parallelogram ABCD given the other three:
  {"problem_type":"COORDGEO_PARALLELOGRAM_VERTEX","known":{"A":["6","1"],"B":["8","2"],"C":["9","4"]},"missing_label":"D"}

COORDGEO_DIAGONAL_AREA -- area of a rhombus/kite from its 4 vertices via diagonals (Area = 1/2*d1*d2):
  {"problem_type":"COORDGEO_DIAGONAL_AREA","p1":["3","0"],"p2":["4","5"],"p3":["-1","4"],"p4":["-2","-1"]}

If nothing above genuinely fits, still return your best guess at problem_type (a short
UPPER_SNAKE_CASE label) plus a "raw_text" field with the original problem -- do not
fabricate fields you are not confident about."""


def classify_problem(problem_text: str) -> dict:
    """Best-effort text -> problem_spec. Never raises for a bad/ambiguous problem;
    only raises LlmCallError if the LLM call itself fails (no provider configured,
    network error, etc.), which the caller should turn into a clear 502."""
    spec = call_llm_json("default", SYSTEM_PROMPT, problem_text)
    if not isinstance(spec, dict) or not spec.get("problem_type"):
        raise LlmCallError("model did not return a usable problem_spec")
    spec.setdefault("raw_text", problem_text)
    return spec
