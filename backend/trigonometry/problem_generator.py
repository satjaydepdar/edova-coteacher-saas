"""Ported from edova-pilot-v4/backend/app/services/problem_generator.py, unchanged."""
import random
from typing import Dict, Any

PYTHAGOREAN_TRIPLETS = [
    (3, 4, 5), (4, 3, 5), (5, 12, 13), (12, 5, 13), (7, 24, 25), (24, 7, 25),
    (8, 15, 17), (15, 8, 17), (20, 21, 29), (21, 20, 29), (9, 40, 41), (40, 9, 41)
]

TRIANGLE_LABELS = [
    ("A", "B", "C"), ("P", "Q", "R"), ("X", "Y", "Z"), ("L", "M", "N")
]

def generate_dynamic_problem(concept_id: str) -> Dict[str, Any]:
    """Generates dynamic randomized mathematical problem instances with complete CBSE question formulations."""

    if concept_id == "trig-101":
        a, b, c = random.choice(PYTHAGOREAN_TRIPLETS)
        v1, v2, v3 = random.choice(TRIANGLE_LABELS)

        side_adj = f"{v1}{v2}"
        side_opp = f"{v2}{v3}"
        side_hyp = f"{v1}{v3}"

        return {
            "problem_id": f"p101_dyn_{random.randint(1000, 9999)}",
            "context": f"In triangle {v1}{v2}{v3} right-angled at {v2}, {side_adj} = {a} cm and {side_opp} = {b} cm. Find: (i) the length of hypotenuse {side_hyp}, (ii) \\sin({v1}).",
            "initial_state": f"{side_adj} = {a}, {side_opp} = {b}, \\angle {v2} = 90^\\circ",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": f"Step 1: Calculate the length of Hypotenuse {side_hyp} using {side_hyp} = \\sqrt{{{a}^2 + {b}^2}}.",
                    "expected_math": str(c),
                    "expected_latex": f"{side_hyp} = {c}\\text{{ cm}}",
                    "hints": {
                        "high": f"Compute \\sqrt{{{a}^2 + {b}^2}} = \\sqrt{{{a*a} + {b*b}}} = \\sqrt{{{c*c}}} = {c}.",
                        "mid": f"Substitute {a} and {b} into the Pythagorean formula {side_hyp}^2 = {side_adj}^2 + {side_opp}^2.",
                        "low": f"Find {side_hyp} using {side_hyp}^2 = {side_adj}^2 + {side_opp}^2."
                    },
                    "quick_options": [str(c), str(c + 1), str(max(1, c - 2)), f"\\sqrt{{{c*c}}}"]
                },
                {
                    "step_index": 1,
                    "prompt": f"Step 2: With respect to angle {v1}, find \\sin({v1}) = \\frac{{\\text{{Opposite}}}}{{\\text{{Hypotenuse}}}} = \\frac{{{side_opp}}}{{{side_hyp}}}.",
                    "expected_math": f"{b}/{c}",
                    "expected_latex": f"\\sin({v1}) = \\frac{{{b}}}{{{c}}}",
                    "hints": {
                        "high": f"For angle {v1}, opposite is {side_opp} = {b} and hypotenuse is {side_hyp} = {c}. Write {b}/{c}.",
                        "mid": f"Use \\sin({v1}) = \\frac{{{side_opp}}}{{{side_hyp}}}.",
                        "low": f"Write the fraction {b}/{c}."
                    },
                    "quick_options": [f"{b}/{c}", f"{a}/{c}", f"{b}/{a}", f"{c}/{b}"]
                }
            ]
        }

    elif concept_id == "trig-102":
        opp, adj, hyp = random.choice(PYTHAGOREAN_TRIPLETS)
        return {
            "problem_id": f"p102_dyn_{random.randint(1000, 9999)}",
            "context": f"In a right-angled triangle with acute angle A, given that \\tan(A) = \\frac{{{opp}}}{{{adj}}}, find the hypotenuse and the trigonometric ratio \\cos(A).",
            "initial_state": f"\\tan(A) = \\frac{{{opp}}}{{{adj}}} = \\frac{{\\text{{Opposite}}}}{{\\text{{Adjacent}}}}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": f"Step 1: If Opposite = {opp}k and Adjacent = {adj}k, calculate the Hypotenuse (\\sqrt{{{opp}^2 + {adj}^2}}).",
                    "expected_math": str(hyp),
                    "expected_latex": f"\\text{{Hypotenuse}} = {hyp}",
                    "hints": {
                        "high": f"Hypotenuse = \\sqrt{{{opp*opp} + {adj*adj}}} = \\sqrt{{{hyp*hyp}}} = {hyp}.",
                        "mid": f"Apply the Pythagorean theorem to {opp} and {adj}.",
                        "low": f"Calculate the hypotenuse from {opp} and {adj}."
                    },
                    "quick_options": [str(hyp), str(hyp + 2), str(opp + adj), f"\\sqrt{{{hyp*hyp}}}"]
                },
                {
                    "step_index": 1,
                    "prompt": f"Step 2: Find the primary ratio \\cos(A) = \\frac{{\\text{{Adjacent}}}}{{\\text{{Hypotenuse}}}}.",
                    "expected_math": f"{adj}/{hyp}",
                    "expected_latex": f"\\cos(A) = \\frac{{{adj}}}{{{hyp}}}",
                    "hints": {
                        "high": f"\\cos(A) = \\frac{{{adj}}}{{{hyp}}}.",
                        "mid": f"Use Adjacent / Hypotenuse = {adj} / {hyp}.",
                        "low": f"Form the ratio {adj}/{hyp}."
                    },
                    "quick_options": [f"{adj}/{hyp}", f"{opp}/{hyp}", f"{adj}/{opp}", f"{hyp}/{adj}"]
                }
            ]
        }

    elif concept_id == "trig-103":
        opp, adj, hyp = random.choice(PYTHAGOREAN_TRIPLETS)
        return {
            "problem_id": f"p103_dyn_{random.randint(1000, 9999)}",
            "context": f"In a right triangle with acute angle \\theta, given that \\sec(\\theta) = \\frac{{{hyp}}}{{{adj}}}, find the opposite side and calculate \\cot(\\theta).",
            "initial_state": f"\\sec(\\theta) = \\frac{{{hyp}}}{{{adj}}} = \\frac{{\\text{{Hypotenuse}}}}{{\\text{{Adjacent}}}}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": f"Step 1: Find the Opposite side length given Hypotenuse = {hyp} and Adjacent = {adj}.",
                    "expected_math": str(opp),
                    "expected_latex": f"\\text{{Opposite}} = \\sqrt{{{hyp}^2 - {adj}^2}} = {opp}",
                    "hints": {
                        "high": f"Opposite = \\sqrt{{{hyp}^2 - {adj}^2}} = \\sqrt{{{hyp*hyp} - {adj*adj}}} = {opp}.",
                        "mid": "Use Opposite^2 = Hypotenuse^2 - Adjacent^2.",
                        "low": f"Calculate \\sqrt{{{hyp*hyp - adj*adj}}}."
                    },
                    "quick_options": [str(opp), str(opp + 1), str(max(1, opp - 2)), f"\\sqrt{{{opp*opp}}}"]
                },
                {
                    "step_index": 1,
                    "prompt": f"Step 2: Calculate the reciprocal ratio \\cot(\\theta) = \\frac{{\\text{{Adjacent}}}}{{\\text{{Opposite}}}}.",
                    "expected_math": f"{adj}/{opp}",
                    "expected_latex": f"\\cot(\\theta) = \\frac{{{adj}}}{{{opp}}}",
                    "hints": {
                        "high": f"\\cot(\\theta) = \\frac{{{adj}}}{{{opp}}}.",
                        "mid": f"cot is Adjacent / Opposite = {adj} / {opp}.",
                        "low": f"Form the ratio {adj}/{opp}."
                    },
                    "quick_options": [f"{adj}/{opp}", f"{opp}/{adj}", f"{hyp}/{opp}", f"{hyp}/{adj}"]
                }
            ]
        }

    elif concept_id == "trig-105":
        standard_angles = [
            ("30^\\circ", "1/2", "\\frac{1}{2}", "30°"),
            ("45^\\circ", "1/sqrt(2)", "\\frac{1}{\\sqrt{2}}", "45°"),
            ("60^\\circ", "sqrt(3)/2", "\\frac{\\sqrt{3}}{2}", "60°"),
            ("90^\\circ", "1", "1", "90°")
        ]
        angle_tex, ans_math, ans_tex, angle_str = random.choice(standard_angles)
        return {
            "problem_id": f"p105_dyn_{random.randint(1000, 9999)}",
            "context": f"Evaluate the exact trigonometric value of \\sin({angle_tex}).",
            "initial_state": f"\\text{{Target: }} \\sin({angle_tex})",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": f"Step 1: From the CBSE Standard Angles Table, state the exact value of \\sin({angle_tex}).",
                    "expected_math": ans_math,
                    "expected_latex": f"\\sin({angle_tex}) = {ans_tex}",
                    "hints": {
                        "high": f"Recall standard angle values: \\sin({angle_tex}) is {ans_tex}.",
                        "mid": f"Check the standard angle table for {angle_str}.",
                        "low": f"Write the exact value for \\sin({angle_tex})."
                    },
                    "quick_options": ["1/2", "1/\\sqrt{2}", "\\sqrt{3}/2", "1", "0"]
                }
            ]
        }

    return None
