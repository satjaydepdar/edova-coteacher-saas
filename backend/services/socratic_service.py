import math
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env from root and backend directories
_root_env = Path(__file__).resolve().parent.parent / ".env"
_backend_env = Path(__file__).resolve().parent / ".env"
if _root_env.exists():
    load_dotenv(dotenv_path=_root_env, override=True)
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env, override=True)

logger = logging.getLogger("edova.socratic")

# Schemas
class SocraticChatRequest(BaseModel):
    message: str
    simulation_id: str
    current_step: int = 1
    current_slider_val: Optional[float] = None
    chat_history: Optional[List[Dict[str, str]]] = []
    user_id: Optional[str] = None
    chapter_id: Optional[str] = None
    concept_id: Optional[str] = None
    mastered_concept_ids: Optional[List[str]] = []

class SocraticChatResponse(BaseModel):
    reply: str
    pitfall_detected: Optional[str] = None
    suggested_action: Optional[str] = None
    llm_model: str = "edova-socratic-agent"
    concept_id: Optional[str] = None
    is_ready: Optional[bool] = None
    missing_prerequisites: Optional[List[str]] = None
    remedial_concept_id: Optional[str] = None
    next_recommended_concept: Optional[str] = None

class MathSolveRequest(BaseModel):
    a: float
    b: float
    c: float
    target_area: Optional[float] = None

class MathStepResponse(BaseModel):
    step_number: int
    title: str
    formula: Optional[str] = None
    explanation: str

class MathSolveResponse(BaseModel):
    a: float
    b: float
    c: float
    discriminant: float
    factored_form: str
    roots: List[float]
    valid_root: float
    steps: List[MathStepResponse]


class MathSolverService:
    """
    Symbolic mathematical solver engine for quadratic equations and geometric models.
    """
    def solve_quadratic(self, a: float, b: float, c: float, target_area: Optional[float] = None) -> Dict[str, Any]:
        ac = a * c
        discriminant = (b * b) - (4 * a * c)

        # 1. AC Factor Pair Search
        factor_pair = self._find_factor_pair(int(ac), int(b))

        # 2. Compute Roots
        roots: List[float] = []
        if discriminant >= 0:
            sqrt_d = math.sqrt(discriminant)
            r1 = (-b + sqrt_d) / (2 * a)
            r2 = (-b - sqrt_d) / (2 * a)
            roots = [round(r1, 2), round(r2, 2)]

        valid_root = next((r for r in roots if r > 0), roots[0] if roots else 0.0)

        # 3. Factored Form
        factored_form = f"({int(a)}x + {int(b)}) = 0"
        if factor_pair:
            f1, f2 = factor_pair
            g1 = math.gcd(int(abs(a)), int(abs(f1)))
            p = int(a // g1)
            q = int(f1 // g1)
            r = g1
            s = int(f2 // p)
            sign_q = f"+ {q}" if q >= 0 else f"- {abs(q)}"
            sign_s = f"+ {s}" if s >= 0 else f"- {abs(s)}"
            r_str = "x" if r == 1 else f"{r}x"
            factored_form = f"({p}x {sign_q})({r_str} {sign_s}) = 0"

        # 4. Generate 5 Pedagogical Steps
        sign_b = f"+ {int(b)}x" if b >= 0 else f"- {int(abs(b))}x"
        sign_c = f"+ {int(c)}" if c >= 0 else f"- {int(abs(c))}"
        standard_eq = f"{int(a)}x² {sign_b} {sign_c} = 0"

        steps = [
            {
                "step_number": 1,
                "title": "Problem Formulation",
                "formula": f"Area = Length × Breadth = x(2x + 1) = {int(target_area)}" if target_area else standard_eq,
                "explanation": f"Let breadth = x. Length is one more than twice breadth (2x + 1). Total Area = {int(target_area)} m²." if target_area else f"Given quadratic expression with a = {a}, b = {b}, c = {c}."
            },
            {
                "step_number": 2,
                "title": "Standard Quadratic Form (ax² + bx + c = 0)",
                "formula": standard_eq,
                "explanation": f"Here, a = {int(a)}, b = {int(b)}, and c = {int(c)}. The product a·c = {int(a)} × ({int(c)}) = {int(ac)}."
            },
            {
                "step_number": 3,
                "title": "Splitting the Middle Term (AC Method)",
                "formula": f"{int(a)}x² + {factor_pair[0]}x {factor_pair[1]}x {sign_c} = 0" if factor_pair else f"D = {discriminant}",
                "explanation": f"We find two numbers that multiply to {int(ac)} and add to {int(b)}: factors are {factor_pair[0]} and {factor_pair[1]}." if factor_pair else "Applying quadratic formula."
            },
            {
                "step_number": 4,
                "title": "Factor by Grouping",
                "formula": factored_form,
                "explanation": "Factoring out common terms from the grouped binomials yields the linear product."
            },
            {
                "step_number": 5,
                "title": "Evaluating Real Geometric Roots",
                "formula": f"x = {valid_root} m (discard negative root)",
                "explanation": f"Setting each factor to zero gives mathematical roots {roots}. Since physical length/breadth cannot be negative, breadth x = {valid_root} m, and length = {round(2*valid_root + 1, 1)} m."
            }
        ]

        return {
            "a": a,
            "b": b,
            "c": c,
            "discriminant": discriminant,
            "factored_form": factored_form,
            "roots": roots,
            "valid_root": valid_root,
            "steps": steps
        }

    def _find_factor_pair(self, ac: int, b: int) -> Optional[Tuple[int, int]]:
        limit = int(math.isqrt(abs(ac))) + abs(b) + 50
        for i in range(-limit, limit + 1):
            if i == 0:
                continue
            if ac % i == 0:
                j = ac // i
                if i + j == b:
                    return (max(i, j), min(i, j))
        return (b, 0)


class GeminiSocraticService:
    """
    Socratic Co-Teacher Service with an LLM (provider/model/key come from the
    admin-managed llm_providers registry, "default" purpose -- see
    services/llm_config_service.py), Knowledge Graph readiness gating, and rich
    heuristic Socratic domain engines.
    """
    def __init__(self):
        self.model = None
        self.model_name = None
        self._configured_key = None
        self._ensure_model()

    def _ensure_model(self):
        """Re-checks the admin-configured default LLM and (re)initializes the client
        if it changed -- so an admin swapping the default model takes effect on the
        next request, no restart needed. Best-effort: any failure here just falls
        back to the heuristic Socratic engine, same as before."""
        try:
            from services.llm_config_service import get_llm_config_or_none
            cfg = get_llm_config_or_none("default")
        except Exception as ex:
            logger.warning(f"Could not read default LLM config: {ex}. Using heuristic Socratic engine.")
            return
        if not cfg or cfg["provider_name"].lower() != "google":
            # Non-Google default: this service only speaks the Gemini SDK today.
            return
        if cfg["api_key"] == self._configured_key and cfg["model_name"] == self.model_name:
            return  # already configured with current settings
        try:
            import google.generativeai as genai
            genai.configure(api_key=cfg["api_key"], transport="rest")
            self.model = genai.GenerativeModel(cfg["model_name"])
            self.model_name = cfg["model_name"]
            self._configured_key = cfg["api_key"]
            logger.info(f"Gemini Socratic Co-Teacher initialized with model: {cfg['model_name']}")
        except Exception as ex:
            logger.warning(f"Could not initialize Gemini LLM: {ex}. Using heuristic Socratic engine.")

    async def get_socratic_response(
        self,
        message: str,
        simulation_id: str,
        current_step: int = 1,
        current_slider_val: Optional[float] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        chapter_id: Optional[str] = None,
        concept_id: Optional[str] = None,
        mastered_concept_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        self._ensure_model()
        msg_lower = message.lower().strip()
        mastered_set: Set[str] = set(mastered_concept_ids or [])
        sim_id_lower = (simulation_id or "").lower()
        chap_id_lower = (chapter_id or "").lower()

        # =====================================================================
        # 1. Long-Term Concept Memory & Recall Engine (Meta-Historical Queries)
        # =====================================================================
        is_recall_query = any(w in msg_lower for w in [
            "recall", "remind me", "earlier", "last time", "before",
            "previous session", "what did we learn", "what did i learn",
            "how did we solve", "past work", "remember"
        ])

        if is_recall_query:
            if "ap-05" in msg_lower or "common difference" in msg_lower or ("difference" in msg_lower and "ap" in msg_lower):
                return {
                    "reply": "🧠 **Hermes Long-Term Memory Recall:** In your earlier practice on <b>Common Difference (AP-05)</b>, we discovered that when sequences decrease, <b>d must be negative</b> because you always subtract earlier from later (a₂ − a₁). For example, in 10, 7, 4..., d = 7 − 10 = -3.",
                    "pitfall_detected": None,
                    "suggested_action": "apply_memory_recall",
                    "llm_model": "kg-memory-recall-engine",
                    "concept_id": "AP-05",
                    "is_ready": True
                }
            elif "ap-03" in msg_lower or "definition of an ap" in msg_lower or "ap def" in msg_lower:
                return {
                    "reply": "🧠 **Hermes Long-Term Memory Recall:** In your earlier session on <b>Definition of an AP (AP-03)</b>, you verified that every consecutive pair in an Arithmetic Progression must have the <b>exact same fixed step size</b> (aₖ₊₁ − aₖ = d) throughout the entire list!",
                    "pitfall_detected": None,
                    "suggested_action": "apply_memory_recall",
                    "llm_model": "kg-memory-recall-engine",
                    "concept_id": "AP-03",
                    "is_ready": True
                }
            elif "ap-09" in msg_lower or "nth term" in msg_lower:
                return {
                    "reply": "🧠 **Hermes Long-Term Memory Recall:** In your previous work on <b>n-th Term (AP-09)</b>, you derived aₙ = a + (n − 1)d, remembering that we multiply by (n − 1) because the initial term a didn't receive any added d's!",
                    "pitfall_detected": None,
                    "suggested_action": "apply_memory_recall",
                    "llm_model": "kg-memory-recall-engine",
                    "concept_id": "AP-09",
                    "is_ready": True
                }
            elif "negative" in msg_lower or "dimension" in msg_lower or "park" in msg_lower or "root" in msg_lower:
                return {
                    "reply": "🧠 **Hermes Long-Term Memory Recall:** In your earlier session on <b>Quadratic Dimensions</b>, you solved 2x² + x − 528 = 0 yielding roots x = -16.5 and x = 16. You realized physical dimensions cannot be negative, discarding -16.5 to keep <b>x = 16 m</b>.",
                    "pitfall_detected": None,
                    "suggested_action": "apply_memory_recall",
                    "llm_model": "kg-memory-recall-engine",
                    "concept_id": "quad-park-528",
                    "is_ready": True
                }

        # =====================================================================
        # 2. Knowledge Graph Resolution & Prerequisite Validation
        # =====================================================================
        if chapter_id and concept_id and (chapter_id.startswith("chapter-05") or concept_id.startswith("AP-")):
            try:
                from kg_service import GRAPH_ENGINES, find_and_load_all_graphs
                if chapter_id not in GRAPH_ENGINES:
                    find_and_load_all_graphs()

                engine = GRAPH_ENGINES.get(chapter_id)
                if engine and concept_id in engine.graph.nodes:
                    node = engine.graph.nodes[concept_id]
                    readiness = engine.check_readiness(concept_id, mastered_set)

                    # Prerequisite Backtracking
                    if not readiness.is_ready:
                        primary_missing = readiness.missing_prerequisites[0] if readiness.missing_prerequisites else None
                        missing_node = engine.graph.nodes.get(primary_missing) if primary_missing else None
                        remedial_prompt = readiness.remedial_question or (missing_node.hermes_guiding_question if missing_node else "Let's review the foundational concept first!")

                        return {
                            "reply": f"Before we dive into **{node.name}**, let's build the foundation: {remedial_prompt}",
                            "pitfall_detected": "missing_prerequisite",
                            "suggested_action": "review_prerequisite",
                            "llm_model": "kg-socratic-backtracker",
                            "concept_id": concept_id,
                            "is_ready": False,
                            "missing_prerequisites": readiness.missing_prerequisites,
                            "remedial_concept_id": primary_missing,
                            "next_recommended_concept": primary_missing
                        }

                    # Mastery Transition
                    has_mastery_phrase = any(w in msg_lower for w in ["understand", "got it", "i get it", "mastered", "solved", "clear now"])
                    has_struggle_phrase = any(w in msg_lower for w in ["struggle", "confused", "hard", "don't", "dont", "problem", "difficult", "many student", "backwards", "subtract"])
                    is_explicit_mastery = has_mastery_phrase and not has_struggle_phrase
                    if is_explicit_mastery:
                        downstream = engine.graph.adjacency_list.get(concept_id, [])
                        if not downstream:
                            topo = engine.graph.topological_order
                            if concept_id in topo:
                                idx = topo.index(concept_id)
                                if idx + 1 < len(topo):
                                    downstream = [topo[idx + 1]]

                        next_concept_id = downstream[0] if downstream else None
                        next_node = engine.graph.nodes.get(next_concept_id) if next_concept_id else None
                        next_name = next_node.name if next_node else "the next lesson"

                        return {
                            "reply": f"Awesome job mastering **{node.name}**! 🎉 You're ready to step forward to **{next_name}**.",
                            "pitfall_detected": None,
                            "suggested_action": "advance_concept",
                            "llm_model": "kg-socratic-navigator",
                            "concept_id": concept_id,
                            "is_ready": True,
                            "missing_prerequisites": [],
                            "remedial_concept_id": None,
                            "next_recommended_concept": next_concept_id
                        }

                    # Concept Pitfall Trigger
                    if node.common_pitfall and ("mistake" in msg_lower or "backwards" in msg_lower or "subtracted wrong" in msg_lower or "subtract" in msg_lower):
                        return {
                            "reply": node.hermes_guiding_question or f"Let's reflect on {node.name}: {node.learning_goal}",
                            "pitfall_detected": "concept_pitfall",
                            "suggested_action": "remedial_reflection",
                            "llm_model": "kg-pitfall-miner",
                            "concept_id": concept_id,
                            "is_ready": True,
                            "missing_prerequisites": [],
                            "remedial_concept_id": None,
                            "next_recommended_concept": concept_id
                        }
            except Exception as ex:
                logger.warning(f"Knowledge Graph resolution error: {ex}")

        # =====================================================================
        # 3. Live Google Gemini Socratic Co-Teacher Generation
        # =====================================================================
        if self.model:
            try:
                system_prompt = (
                    "You are Hermes, a warm, encouraging, highly skilled AI Socratic Co-Teacher for high school STEM students. "
                    "Your goal is to guide students conceptually by explaining the core mathematical and scientific meaning "
                    "in clear, engaging terms, and prompting them with a helpful Socratic question. "
                    "Use HTML formatting like <b>bold</b>, <i>italics</i>, and <span class='font-mono'>math notation</span> where helpful. "
                    "Keep responses concise (2 to 4 sentences)."
                )

                history_context = ""
                if chat_history:
                    recent = chat_history[-4:]
                    history_context = "Recent conversation:\n" + "\n".join(
                        f"- {c.get('role', 'user')}: {c.get('content', '')}" for c in recent
                    )

                prompt = (
                    f"{system_prompt}\n\n"
                    f"Active Simulation: {simulation_id} (Chapter: {chapter_id}, Concept: {concept_id})\n"
                    f"Current Slider/Input Value: {current_slider_val}\n"
                    f"{history_context}\n\n"
                    f"Student asks: {message}\n"
                    f"Provide your pedagogical Socratic response:"
                )

                response = self.model.generate_content(prompt)
                if response and response.text:
                    return {
                        "reply": response.text.strip(),
                        "pitfall_detected": None,
                        "suggested_action": "guided_reflection",
                        "llm_model": self.model_name,
                        "concept_id": concept_id,
                        "is_ready": True
                    }
            except Exception as ex:
                logger.error(f"Gemini LLM call failed: {ex}. Falling back to domain heuristics.")

        # =====================================================================
        # 4. Heuristic Domain: Fractions & Area Models
        # =====================================================================
        if "fraction" in sim_id_lower or "fraction" in chap_id_lower or any(w in msg_lower for w in ["denominator", "numerator", "fraction", "simplify", "shaded", "portion", "parts of"]):
            if any(w in msg_lower for w in ["denominator", "what does denominator", "bottom number"]):
                return {
                    "reply": "In an area model, the <b>denominator</b> represents the <b>total number of equal parts</b> into which the whole unit area is divided.<br><br>For example, in <b>1/8</b>, the denominator <b>8</b> tells us the unit rectangle is partitioned into 8 equal slices, defining the size of each fractional piece.",
                    "pitfall_detected": None,
                    "suggested_action": "explore_denominator",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "MENS-01",
                    "is_ready": True
                }
            elif any(w in msg_lower for w in ["numerator", "what does numerator", "top number", "shaded"]):
                return {
                    "reply": "The <b>numerator</b> represents <b>how many of those equal parts are currently selected or shaded</b>.<br><br>In <b>1/8</b>, the numerator <b>1</b> shows that exactly 1 out of the 8 equal parts is shaded.",
                    "pitfall_detected": None,
                    "suggested_action": "explore_numerator",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "MENS-01",
                    "is_ready": True
                }
            elif any(w in msg_lower for w in ["simplify", "how to simplify", "equivalent", "lowest terms"]):
                return {
                    "reply": "To simplify a fraction, divide both the numerator and the denominator by their <b>Greatest Common Divisor (GCD)</b>.<br><br>For example, if you shade <b>2/8</b>, dividing both numbers by 2 gives the simplified equivalent fraction <b>1/4 (0.25)</b>.",
                    "pitfall_detected": None,
                    "suggested_action": "simplify_fraction",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "MENS-01",
                    "is_ready": True
                }

        # =====================================================================
        # 5. Heuristic Domain: Angles Around a Point & Geometry
        # =====================================================================
        if "angle" in sim_id_lower or "geom" in sim_id_lower or any(w in msg_lower for w in ["360", "angle", "degrees", "rotation", "circle"]):
            return {
                "reply": "A full circular rotation around a single central vertex forms a complete turn of <b>360°</b>.<br><br>When you partition a point into adjacent angle slices (such as θ₁, θ₂, θ₃), their sum must always equal <b>360°</b>!",
                "pitfall_detected": None,
                "suggested_action": "explore_angles",
                "llm_model": "heuristic-socratic-miner",
                "concept_id": concept_id or "GEOM-01",
                "is_ready": True
            }

        # =====================================================================
        # 6. Heuristic Domain: Statistics, Mean, and Outliers
        # =====================================================================
        if "stat" in sim_id_lower or "dataset" in sim_id_lower or any(w in msg_lower for w in ["mean", "median", "outlier", "average", "central tendency"]):
            if "outlier" in msg_lower:
                return {
                    "reply": "An <b>outlier</b> is an extreme value that is far higher or lower than the rest of the dataset. Adding an outlier pulls the <b>Mean</b> heavily in its direction, whereas the <b>Median</b> remains resistant!",
                    "pitfall_detected": None,
                    "suggested_action": "observe_outlier",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "STAT-01",
                    "is_ready": True
                }
            return {
                "reply": "The <b>Arithmetic Mean (μ)</b> is calculated by summing all values and dividing by the total count: <span class='font-mono'>Mean = (∑ xᵢ) / N</span>.<br><br>Try adding or removing numbers on the right to see how the mean dynamically shifts!",
                "pitfall_detected": None,
                "suggested_action": "explore_mean",
                "llm_model": "heuristic-socratic-miner",
                "concept_id": concept_id or "STAT-01",
                "is_ready": True
            }

        # =====================================================================
        # 7. Heuristic Domain: Quadratic Equations & Geometry Specific Direct Answers
        # =====================================================================
        is_quad_context = "quad" in sim_id_lower or "park" in sim_id_lower or "algebra-tile" in sim_id_lower
        if is_quad_context or any(w in msg_lower for w in ["negative root", "discard negative", "why discard", "negative dimension", "form the equation", "how to form", "ac method"]):
            if any(w in msg_lower for w in ["negative", "discard", "root", "-16.5", "-33"]):
                return {
                    "reply": "Great question! When solving the quadratic equation <b>2x² + x − 528 = 0</b>, algebra produces two mathematical roots: <i>x = 16</i> and <i>x = -16.5 (-33/2)</i>.<br><br>However, <b>x represents the physical breadth of a real park</b>. In physical geometry, a width or distance cannot be negative! Therefore, we discard <i>x = -16.5</i> and accept <b>x = 16 m</b> as the only valid physical dimension.",
                    "pitfall_detected": "negative-root-geometry",
                    "suggested_action": "discard_negative_root",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "QUAD-02",
                    "is_ready": True
                }
            elif any(w in msg_lower for w in ["form the equation", "how to form", "form equation", "twice its breadth", "one more than", "why 2x + 1", "standard form"]):
                return {
                    "reply": "Let's break the word problem down into step-by-step algebraic formulation:<br><br>"
                             "<b>1. Assign the Variable</b>: Let Breadth = <b>x</b>.<br>"
                             "<b>2. Translate Word Clues</b>: 'One more than twice its breadth' gives <b>Length = 2x + 1</b>.<br>"
                             "<b>3. Formulate Area Equation</b>: Area = Breadth × Length → <span class='font-mono'>x(2x + 1) = 528</span>.<br>"
                             "<b>4. Expand & Rearrange</b>: <span class='font-mono'>2x² + x − 528 = 0</span> in standard form <span class='font-mono'>ax² + bx + c = 0</span>!",
                    "pitfall_detected": "formulation-translating-words",
                    "suggested_action": "formulate_equation",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "QUAD-01",
                    "is_ready": True
                }
            elif any(w in msg_lower for w in ["ac method", "what is ac", "how does ac", "why ac", "middle term", "split the middle", "factors of -1056"]):
                return {
                    "reply": "The <b>AC Method</b> factors quadratic trinomials <span class='font-mono'>ax² + bx + c = 0</span>:<br><br>"
                             "1. <b>Multiply a × c</b>: 2 × (-528) = <b>-1056</b>.<br>"
                             "2. <b>Find Two Numbers</b> that multiply to -1056 and add to +1: factors are <b>+33</b> and <b>-32</b>.<br>"
                             "3. <b>Split & Group</b>: <span class='font-mono'>2x² + 33x − 32x − 528 = 0 → (2x + 33)(x − 16) = 0</span>.",
                    "pitfall_detected": "ac-splitting-middle-term",
                    "suggested_action": "explain_ac_method",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "QUAD-03",
                    "is_ready": True
                }
            elif "why is this the answer" in msg_lower or "why this answer" in msg_lower:
                return {
                    "reply": "At Breadth <b>x = 16 m</b>, Length is 2(16) + 1 = <b>33 m</b>. Multiplying them gives exact Area = 16 × 33 = <b>528 m²</b>, which matches the required target area perfectly!",
                    "pitfall_detected": None,
                    "suggested_action": "verify_solution",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": concept_id or "QUAD-02",
                    "is_ready": True
                }

        # =====================================================================
        # 8. Heuristic Domain: Kinematics / Rocket Trajectories
        # =====================================================================
        if "rocket" in sim_id_lower or "projectile" in sim_id_lower or "trajectory" in msg_lower:
            if any(w in msg_lower for w in ["landing", "hit the ground", "h=0", "impact"]):
                return {
                    "reply": "When the rocket impacts the ground, its height becomes zero: <span class='font-mono'>h(t) = 0 m</span>.<br><br>Setting <span class='font-mono'>-5t² + 20t + 25 = 0</span> yields roots <b>t = 5 s</b> and <b>t = -1 s</b>. Discarding negative time gives total <b>Landing Time = 5 seconds</b>!",
                    "pitfall_detected": None,
                    "suggested_action": "test_landing_5s",
                    "llm_model": "heuristic-socratic-miner",
                    "concept_id": "PHYS-04",
                    "is_ready": True
                }
            return {
                "reply": "In vertical projectile motion <span class='font-mono'>h(t) = -5t² + 20t + 25</span>, the vertex occurs at time <span class='font-mono'>t = -b/(2a) = 2 seconds</span>, reaching maximum apex height <b>h(2) = 45 meters</b>!",
                "pitfall_detected": None,
                "suggested_action": "find_vertex",
                "llm_model": "heuristic-socratic-miner",
                "concept_id": "PHYS-04",
                "is_ready": True
            }

        # =====================================================================
        # 9. Heuristic Domain: Chemistry Titration
        # =====================================================================
        if "titration" in sim_id_lower or "ph" in msg_lower:
            return {
                "reply": "In a strong acid (HCl) + strong base (NaOH) titration, neutralization occurs when moles of H⁺ equal moles of OH⁻ (<span class='font-mono'>M₁V₁ = M₂V₂</span>). At this equivalence point, the solution contains only water and NaCl, yielding a neutral <b>pH of 7.00</b>.",
                "pitfall_detected": "neutralization-equivalence",
                "suggested_action": "observe_ph_7",
                "llm_model": "heuristic-socratic-miner",
                "concept_id": "CHEM-02",
                "is_ready": True
            }

        # =====================================================================
        # 10. Default Fallback
        # =====================================================================
        return {
            "reply": "I am observing your current exploration! Adjust the interactive controls on the right or ask any specific question about the concepts.",
            "pitfall_detected": None,
            "suggested_action": "explore_slider",
            "llm_model": "edova-socratic-agent",
            "concept_id": concept_id,
            "is_ready": True
        }

    def classify_misconception_pattern(self, struggling_notes: List[Dict[str, str]]) -> Optional[str]:
        """Teacher Analytics Level-3: given a student's struggling topics (each with a
        concept_name and a free-text error_detail), ask Gemini whether they share one
        underlying misconception -- may honestly find none, must never fabricate a
        connection. Best-effort: any failure (no API key, timeout, bad response) returns
        None, same graceful-degradation contract as get_socratic_response's LLM branch."""
        if not self.model or len(struggling_notes) < 2:
            return None
        try:
            notes_text = "\n".join(
                f"- {n['concept_name']}: {n['error_detail']}" for n in struggling_notes if n.get("error_detail")
            )
            prompt = (
                "A student is struggling on these topics, each with the teacher's note on what "
                "went wrong:\n" + notes_text + "\n\n"
                "Is there ONE shared underlying misconception across at least two of these? "
                "If yes, reply with exactly one sentence naming the misconception and which "
                "topics it showed up in. If there is no clear shared pattern, reply with "
                "exactly the single word NONE."
            )
            response = self.model.generate_content(prompt)
            text = response.text.strip() if response and response.text else ""
            if not text or text.upper() == "NONE":
                return None
            return text
        except Exception as ex:
            logger.error(f"Gemini misconception-pattern call failed: {ex}")
            return None

gemini_socratic_service = GeminiSocraticService()
math_solver_service = MathSolverService()
