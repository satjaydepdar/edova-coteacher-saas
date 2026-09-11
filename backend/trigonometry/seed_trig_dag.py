"""10-node CBSE Class 10 Trigonometry DAG, ported unchanged from
edova-pilot-v4/backend/database/seeds/seed_trig_dag.py. Run manually:
    .venv/Scripts/python.exe -m trigonometry.seed_trig_dag
(not auto-run on every app startup, unlike the pilot -- this is seed data,
not schema, and re-running is idempotent but shouldn't be implicit)."""
from trigonometry.database import init_db, SessionLocal
from trigonometry.models import Concept

TRIG_CONCEPTS = {
    "trig-101": {
        "title": "Right-Angled Triangle Anatomy",
        "chapter": "Introduction to Trigonometry",
        "difficulty": 1.0,
        "description": "Master the side relationships (Hypotenuse, Opposite, Adjacent) and Pythagorean Theorem in right-angled triangles.",
        "formula_reference": "AC^2 = AB^2 + BC^2 | sin(A) = Opp / Hyp",
        "prereqs": [],
        "problem_data": {
            "problem_id": "p101_1",
            "context": "In triangle ABC right-angled at B, AB = 24 cm and BC = 7 cm. Find: (i) the length of hypotenuse AC, (ii) \\sin(A).",
            "initial_state": "AB = 24, BC = 7, \\angle B = 90^\\circ",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Calculate the length of the Hypotenuse AC using the Pythagorean Theorem (AC = sqrt(24^2 + 7^2)).",
                    "expected_math": "25",
                    "expected_latex": "AC = 25\\text{ cm}",
                    "hints": {
                        "high": "Use the Pythagorean theorem: AC = sqrt(24^2 + 7^2) = sqrt(576 + 49) = sqrt(625). What is sqrt(625)?",
                        "mid": "Compute 24^2 + 7^2 and take the square root to find AC.",
                        "low": "Find AC using AC^2 = AB^2 + BC^2."
                    },
                    "quick_options": ["25", "26", "23", "sqrt(625)"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: With respect to angle A, find the value of sin(A) = Opposite / Hypotenuse = BC / AC.",
                    "expected_math": "7/25",
                    "expected_latex": "\\sin(A) = \\frac{7}{25}",
                    "hints": {
                        "high": "For angle A, the opposite side is BC = 7 and hypotenuse is AC = 25. Write the fraction 7/25.",
                        "mid": "Recall that sin(A) = Opposite / Hypotenuse. Substitute BC = 7 and AC = 25.",
                        "low": "Express sin(A) as BC / AC."
                    },
                    "quick_options": ["7/25", "24/25", "7/24", "25/7"]
                }
            ]
        }
    },
    "trig-102": {
        "title": "Primary Trigonometric Ratios (sin, cos, tan)",
        "chapter": "Introduction to Trigonometry",
        "difficulty": 1.5,
        "description": "Define and calculate sine, cosine, and tangent ratios for acute angles.",
        "formula_reference": "sin(theta) = Opp/Hyp | cos(theta) = Adj/Hyp | tan(theta) = Opp/Adj",
        "prereqs": ["trig-101"],
        "problem_data": {
            "problem_id": "p102_1",
            "context": "In a right-angled triangle with acute angle A, given that \\tan(A) = \\frac{4}{3}, find the hypotenuse and the trigonometric ratio \\cos(A).",
            "initial_state": "\\tan(A) = \\frac{4}{3} = \\frac{\\text{Opposite}}{\\text{Adjacent}}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: If Opposite = 4k and Adjacent = 3k, find the Hypotenuse k-multiple (sqrt(4^2 + 3^2)).",
                    "expected_math": "5",
                    "expected_latex": "\\text{Hypotenuse} = 5",
                    "hints": {
                        "high": "Hypotenuse = sqrt(4^2 + 3^2) = sqrt(16 + 9) = sqrt(25) = 5.",
                        "mid": "Apply the Pythagorean theorem to 3 and 4.",
                        "low": "Find the hypotenuse from opposite 4 and adjacent 3."
                    },
                    "quick_options": ["5", "7", "sqrt(7)", "25"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Find the primary ratio cos(A) = Adjacent / Hypotenuse.",
                    "expected_math": "3/5",
                    "expected_latex": "\\cos(A) = \\frac{3}{5}",
                    "hints": {
                        "high": "cos(A) = Adjacent / Hypotenuse = 3 / 5.",
                        "mid": "Use cos(A) = Adjacent / Hypotenuse.",
                        "low": "What is the ratio of adjacent (3) to hypotenuse (5)?"
                    },
                    "quick_options": ["3/5", "4/5", "3/4", "5/3"]
                }
            ]
        }
    },
    "trig-103": {
        "title": "Reciprocal Trigonometric Ratios (cosec, sec, cot)",
        "chapter": "Introduction to Trigonometry",
        "difficulty": 1.8,
        "description": "Evaluate cosecant, secant, and cotangent as reciprocals of sine, cosine, and tangent.",
        "formula_reference": "cosec(theta) = 1/sin(theta) | sec(theta) = 1/cos(theta) | cot(theta) = 1/tan(theta)",
        "prereqs": ["trig-102"],
        "problem_data": {
            "problem_id": "p103_1",
            "context": "In a right triangle with acute angle \\theta, given that \\sec(\\theta) = \\frac{13}{12}, find the opposite side and calculate \\cot(\\theta).",
            "initial_state": "\\sec(\\theta) = \\frac{13}{12} = \\frac{\\text{Hypotenuse}}{\\text{Adjacent}}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Find the Opposite side length given Hypotenuse = 13 and Adjacent = 12.",
                    "expected_math": "5",
                    "expected_latex": "\\text{Opposite} = \\sqrt{13^2 - 12^2} = 5",
                    "hints": {
                        "high": "Opposite = sqrt(13^2 - 12^2) = sqrt(169 - 144) = sqrt(25) = 5.",
                        "mid": "Use Opposite^2 = Hypotenuse^2 - Adjacent^2.",
                        "low": "Calculate sqrt(169 - 144)."
                    },
                    "quick_options": ["5", "1", "sqrt(313)", "25"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Calculate the reciprocal ratio cot(theta) = Adjacent / Opposite.",
                    "expected_math": "12/5",
                    "expected_latex": "\\cot(\\theta) = \\frac{12}{5}",
                    "hints": {
                        "high": "cot(theta) is Adjacent / Opposite = 12 / 5.",
                        "mid": "cot(theta) is the reciprocal of tan(theta). Substitute 12 and 5.",
                        "low": "Express Adjacent (12) over Opposite (5)."
                    },
                    "quick_options": ["12/5", "5/12", "13/5", "5/13"]
                }
            ]
        }
    },
    "trig-104": {
        "title": "Quotient & Product Relations",
        "chapter": "Introduction to Trigonometry",
        "difficulty": 2.0,
        "description": "Apply quotient identities tan(theta) = sin(theta)/cos(theta) and cot(theta) = cos(theta)/sin(theta).",
        "formula_reference": "tan(theta) = sin(theta)/cos(theta) | cot(theta) = cos(theta)/sin(theta)",
        "prereqs": ["trig-102", "trig-103"],
        "problem_data": {
            "problem_id": "p104_1",
            "context": "Simplify the algebraic trigonometric expression: (tan(theta) * cos(theta)) / sin(theta).",
            "initial_state": "\\frac{\\tan(\\theta) \\cdot \\cos(\\theta)}{\\sin(\\theta)}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Rewrite tan(theta) using the quotient relation (sin(theta)/cos(theta)) and simplify tan(theta) * cos(theta).",
                    "expected_math": "sin(theta)",
                    "expected_latex": "\\tan(\\theta) \\cdot \\cos(\\theta) = \\sin(\\theta)",
                    "hints": {
                        "high": "Substitute tan(theta) = sin(theta)/cos(theta). Notice cos(theta) cancels out to leave sin(theta).",
                        "mid": "Replace tan(theta) with sin(theta)/cos(theta) and multiply by cos(theta).",
                        "low": "What is (sin(theta)/cos(theta)) * cos(theta)?"
                    },
                    "quick_options": ["sin(theta)", "cos(theta)", "1", "tan(theta)"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Now evaluate sin(theta) / sin(theta) to get the final simplified integer value.",
                    "expected_math": "1",
                    "expected_latex": "1",
                    "hints": {
                        "high": "Any non-zero expression divided by itself equals 1.",
                        "mid": "Simplify sin(theta) / sin(theta).",
                        "low": "What is x / x?"
                    },
                    "quick_options": ["1", "0", "sin(theta)", "-1"]
                }
            ]
        }
    },
    "trig-105": {
        "title": "Trigonometric Ratios of Standard Angles",
        "chapter": "Introduction to Trigonometry",
        "difficulty": 2.5,
        "description": "Evaluate exact values of standard angles (0 deg, 30 deg, 45 deg, 60 deg, 90 deg).",
        "formula_reference": "sin(30)=1/2 | cos(30)=sqrt(3)/2 | tan(45)=1 | sin(60)=sqrt(3)/2",
        "prereqs": ["trig-102", "trig-103"],
        "problem_data": {
            "problem_id": "p105_1",
            "context": "Evaluate: 2*tan^2(45 deg) + cos^2(30 deg) - sin^2(60 deg).",
            "initial_state": "2\\tan^2(45^\\circ) + \\cos^2(30^\\circ) - \\sin^2(60^\\circ)",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Evaluate the first term: 2 * tan^2(45 deg). Note that tan(45 deg) = 1.",
                    "expected_math": "2",
                    "expected_latex": "2(1)^2 = 2",
                    "hints": {
                        "high": "tan(45 deg) = 1, so 2 * (1)^2 = 2 * 1 = 2.",
                        "mid": "Substitute tan(45 deg) = 1 into 2 * tan^2(45 deg).",
                        "low": "Evaluate 2 * (1)^2."
                    },
                    "quick_options": ["2", "1", "4", "0"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Since cos(30 deg) = sqrt(3)/2 and sin(60 deg) = sqrt(3)/2, what is cos^2(30 deg) - sin^2(60 deg)?",
                    "expected_math": "0",
                    "expected_latex": "\\left(\\frac{\\sqrt{3}}{2}\\right)^2 - \\left(\\frac{\\sqrt{3}}{2}\\right)^2 = 0",
                    "hints": {
                        "high": "(sqrt(3)/2)^2 - (sqrt(3)/2)^2 = 3/4 - 3/4 = 0.",
                        "mid": "Both terms are equal to 3/4. Subtracting them gives 0.",
                        "low": "Subtract 3/4 - 3/4."
                    },
                    "quick_options": ["0", "3/4", "3/2", "1"]
                },
                {
                    "step_index": 2,
                    "prompt": "Step 3: Combine all terms: 2 + 0 to find the total expression value.",
                    "expected_math": "2",
                    "expected_latex": "2 + 0 = 2",
                    "hints": {
                        "high": "The total is 2 + 0 = 2.",
                        "mid": "Add the first term (2) to the difference (0).",
                        "low": "What is 2 + 0?"
                    },
                    "quick_options": ["2", "0", "1", "4"]
                }
            ]
        }
    },
    "trig-106": {
        "title": "The Core Pythagorean Identity (sin^2 theta + cos^2 theta = 1)",
        "chapter": "Trigonometric Identities",
        "difficulty": 3.2,
        "description": "Prove and apply the fundamental identity sin^2 theta + cos^2 theta = 1 in transformations.",
        "formula_reference": "sin^2(theta) + cos^2(theta) = 1 | sin^2(theta) = 1 - cos^2(theta)",
        "prereqs": ["trig-102", "trig-104"],
        "problem_data": {
            "problem_id": "p106_1",
            "context": "Simplify: (1 - cos^2(theta)) * cosec^2(theta).",
            "initial_state": "(1 - \\cos^2(\\theta)) \\cdot \\csc^2(\\theta)",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Using sin^2(theta) + cos^2(theta) = 1, rewrite (1 - cos^2(theta)) in terms of sine.",
                    "expected_math": "sin(theta)^2",
                    "expected_latex": "1 - \\cos^2(\\theta) = \\sin^2(\\theta)",
                    "hints": {
                        "high": "From sin^2(theta) + cos^2(theta) = 1, we get 1 - cos^2(theta) = sin^2(theta).",
                        "mid": "Isolate sin^2(theta) in the Pythagorean identity.",
                        "low": "What is 1 - cos^2(theta) equal to?"
                    },
                    "quick_options": ["sin(theta)^2", "cos(theta)^2", "tan(theta)^2", "1"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Multiply sin^2(theta) * cosec^2(theta) using the reciprocal relation cosec(theta) = 1/sin(theta).",
                    "expected_math": "1",
                    "expected_latex": "\\sin^2(\\theta) \\cdot \\frac{1}{\\sin^2(\\theta)} = 1",
                    "hints": {
                        "high": "sin^2(theta) * (1/sin^2(theta)) = 1.",
                        "mid": "Substitute cosec^2(theta) = 1/sin^2(theta) and simplify.",
                        "low": "Multiply sin^2(theta) by its reciprocal."
                    },
                    "quick_options": ["1", "sin(theta)", "cosec(theta)", "0"]
                }
            ]
        }
    },
    "trig-107": {
        "title": "Derived Pythagorean Identities",
        "chapter": "Trigonometric Identities",
        "difficulty": 3.8,
        "description": "Derive and utilize 1 + tan^2 theta = sec^2 theta and 1 + cot^2 theta = cosec^2 theta.",
        "formula_reference": "1 + tan^2(theta) = sec^2(theta) | 1 + cot^2(theta) = cosec^2(theta)",
        "prereqs": ["trig-106"],
        "problem_data": {
            "problem_id": "p107_1",
            "context": "Simplify: (sec^2(theta) - 1) * (cosec^2(theta) - 1).",
            "initial_state": "(\\sec^2(\\theta) - 1)(\\csc^2(\\theta) - 1)",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Rewrite (sec^2(theta) - 1) using the derived identity 1 + tan^2(theta) = sec^2(theta).",
                    "expected_math": "tan(theta)^2",
                    "expected_latex": "\\sec^2(\\theta) - 1 = \\tan^2(\\theta)",
                    "hints": {
                        "high": "Subtract 1 from both sides of 1 + tan^2(theta) = sec^2(theta) to get tan^2(theta).",
                        "mid": "Use 1 + tan^2(theta) = sec^2(theta).",
                        "low": "What is sec^2(theta) - 1?"
                    },
                    "quick_options": ["tan(theta)^2", "cot(theta)^2", "sin(theta)^2", "1"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Rewrite (cosec^2(theta) - 1) using 1 + cot^2(theta) = cosec^2(theta).",
                    "expected_math": "cot(theta)^2",
                    "expected_latex": "\\csc^2(\\theta) - 1 = \\cot^2(\\theta)",
                    "hints": {
                        "high": "1 + cot^2(theta) = cosec^2(theta) implies cosec^2(theta) - 1 = cot^2(theta).",
                        "mid": "Isolate cot^2(theta) from the identity 1 + cot^2(theta) = cosec^2(theta).",
                        "low": "What is cosec^2(theta) - 1?"
                    },
                    "quick_options": ["cot(theta)^2", "tan(theta)^2", "cos(theta)^2", "1"]
                },
                {
                    "step_index": 2,
                    "prompt": "Step 3: Multiply tan^2(theta) * cot^2(theta).",
                    "expected_math": "1",
                    "expected_latex": "\\tan^2(\\theta) \\cdot \\frac{1}{\\tan^2(\\theta)} = 1",
                    "hints": {
                        "high": "Since cot(theta) = 1/tan(theta), tan^2(theta) * cot^2(theta) = 1.",
                        "mid": "Recall that tan and cot are reciprocals.",
                        "low": "Evaluate tan^2(theta) * (1/tan^2(theta))."
                    },
                    "quick_options": ["1", "tan(theta)", "cot(theta)", "0"]
                }
            ]
        }
    },
    "trig-108": {
        "title": "Complex Trigonometric Proofs & Simplifications",
        "chapter": "Trigonometric Identities",
        "difficulty": 4.5,
        "description": "Multi-step algebraic proofs combining algebraic expansions and trigonometric identities.",
        "formula_reference": "(a+b)^2 = a^2 + 2ab + b^2 | 1/(1+cos(theta)) rationalization",
        "prereqs": ["trig-104", "trig-107"],
        "problem_data": {
            "problem_id": "p108_1",
            "context": "Simplify LHS: sin(theta)/(1 + cos(theta)) + (1 + cos(theta))/sin(theta).",
            "initial_state": "\\frac{\\sin(\\theta)}{1 + \\cos(\\theta)} + \\frac{1 + \\cos(\\theta)}{\\sin(\\theta)}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: Cross-multiply numerators: sin^2(theta) + (1 + cos(theta))^2. Expand and simplify using sin^2(theta) + cos^2(theta) = 1.",
                    "expected_math": "2 + 2*cos(theta)",
                    "expected_latex": "\\sin^2(\\theta) + 1 + 2\\cos(\\theta) + \\cos^2(\\theta) = 2 + 2\\cos(\\theta)",
                    "hints": {
                        "high": "sin^2(theta) + (1 + 2cos(theta) + cos^2(theta)) = (sin^2(theta) + cos^2(theta)) + 1 + 2cos(theta) = 1 + 1 + 2cos(theta) = 2 + 2cos(theta).",
                        "mid": "Expand (1+cos(theta))^2 and use sin^2(theta) + cos^2(theta) = 1.",
                        "low": "Simplify the expanded numerator 1 + 1 + 2cos(theta)."
                    },
                    "quick_options": ["2 + 2*cos(theta)", "2*(1+cos(theta))", "2", "sin(theta) + cos(theta)"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Factoring numerator as 2(1 + cos(theta)) over denominator sin(theta)(1 + cos(theta)), cancel common factors.",
                    "expected_math": "2*cosec(theta)",
                    "expected_latex": "\\frac{2(1 + \\cos(\\theta))}{\\sin(\\theta)(1 + \\cos(\\theta))} = \\frac{2}{\\sin(\\theta)} = 2\\csc(\\theta)",
                    "hints": {
                        "high": "2(1+cos(theta)) / [sin(theta)(1+cos(theta))] = 2 / sin(theta) = 2*cosec(theta).",
                        "mid": "Cancel (1+cos(theta)) and express 2/sin(theta) using cosecant.",
                        "low": "Rewrite 2/sin(theta) as 2*cosec(theta)."
                    },
                    "quick_options": ["2*cosec(theta)", "2/sin(theta)", "2*sec(theta)", "2*sin(theta)"]
                }
            ]
        }
    },
    "trig-109": {
        "title": "Applications: Angles of Elevation & Depression",
        "chapter": "Some Applications of Trigonometry",
        "difficulty": 3.5,
        "description": "Solve single-triangle real-world heights and distances problems using tan, sin, and cos.",
        "formula_reference": "tan(theta) = Height / Distance | Elevation: upward from horizontal",
        "prereqs": ["trig-102", "trig-105"],
        "problem_data": {
            "problem_id": "p109_1",
            "context": "A tower stands vertically on level ground. From a point 15 m away from the foot, the angle of elevation of the top is 60 deg.",
            "initial_state": "\\text{Distance } d = 15\\text{ m}, \\text{Angle } \\theta = 60^\\circ, \\tan(60^\\circ) = \\frac{h}{15}",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: State the exact value of tan(60 deg).",
                    "expected_math": "sqrt(3)",
                    "expected_latex": "\\tan(60^\\circ) = \\sqrt{3}",
                    "hints": {
                        "high": "The exact standard ratio for tan(60 deg) is sqrt(3).",
                        "mid": "Recall the standard angle ratio: tan(60 deg) = sin(60 deg)/cos(60 deg) = sqrt(3).",
                        "low": "What is tan(60 deg)?"
                    },
                    "quick_options": ["sqrt(3)", "1/sqrt(3)", "1", "sqrt(3)/2"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Using tan(60 deg) = h / 15, solve for the height of the tower h.",
                    "expected_math": "15*sqrt(3)",
                    "expected_latex": "h = 15\\sqrt{3}\\text{ m}",
                    "hints": {
                        "high": "Multiply both sides by 15: h = 15 * tan(60 deg) = 15 * sqrt(3).",
                        "mid": "h = 15 * sqrt(3).",
                        "low": "Solve h = 15 * tan(60 deg)."
                    },
                    "quick_options": ["15*sqrt(3)", "15/sqrt(3)", "30", "15"]
                }
            ]
        }
    },
    "trig-110": {
        "title": "Advanced Multi-Triangle Heights & Distances Problems",
        "chapter": "Some Applications of Trigonometry",
        "difficulty": 4.8,
        "description": "Multi-triangle geometric problem solving combining angles of elevation and depression.",
        "formula_reference": "tan(theta1) = h1/d | tan(theta2) = h2/d | Total Height = h1 + h2",
        "prereqs": ["trig-109"],
        "problem_data": {
            "problem_id": "p110_1",
            "context": "From the top of a 7 m high building, the angle of elevation of the top of a cable tower is 60 deg and the angle of depression of its foot is 45 deg.",
            "initial_state": "\\text{Building height } = 7\\text{ m}, \\text{Depression } = 45^\\circ, \\text{Elevation } = 60^\\circ",
            "steps": [
                {
                    "step_index": 0,
                    "prompt": "Step 1: From the depression angle: tan(45 deg) = 7 / d. Find the horizontal distance d between building and tower.",
                    "expected_math": "7",
                    "expected_latex": "d = \\frac{7}{\\tan(45^\\circ)} = 7\\text{ m}",
                    "hints": {
                        "high": "Since tan(45 deg) = 1, d = 7 / 1 = 7 m.",
                        "mid": "Substitute tan(45 deg) = 1 into d = 7 / tan(45 deg).",
                        "low": "What is 7 / 1?"
                    },
                    "quick_options": ["7", "7*sqrt(3)", "14", "1"]
                },
                {
                    "step_index": 1,
                    "prompt": "Step 2: Let the height of the tower above the building level be h_top. Using tan(60 deg) = h_top / 7, find h_top.",
                    "expected_math": "7*sqrt(3)",
                    "expected_latex": "h_{\\text{top}} = 7\\tan(60^\\circ) = 7\\sqrt{3}\\text{ m}",
                    "hints": {
                        "high": "h_top = d * tan(60 deg) = 7 * sqrt(3).",
                        "mid": "Multiply distance 7 by tan(60 deg) = sqrt(3).",
                        "low": "Compute 7 * sqrt(3)."
                    },
                    "quick_options": ["7*sqrt(3)", "7/sqrt(3)", "21", "14"]
                },
                {
                    "step_index": 2,
                    "prompt": "Step 3: Calculate the total height of the tower H = 7 + h_top.",
                    "expected_math": "7*(1 + sqrt(3))",
                    "expected_latex": "H = 7 + 7\\sqrt{3} = 7(1 + \\sqrt{3})\\text{ m}",
                    "hints": {
                        "high": "Total height H = 7 + 7*sqrt(3) = 7*(1 + sqrt(3)).",
                        "mid": "Add the building height (7) to the upper tower section (7*sqrt(3)).",
                        "low": "Factor 7 from (7 + 7*sqrt(3))."
                    },
                    "quick_options": ["7*(1 + sqrt(3))", "7 + 7*sqrt(3)", "14*sqrt(3)", "7*sqrt(3)"]
                }
            ]
        }
    }
}

def seed_trig_dag():
    init_db()
    db = SessionLocal()
    try:
        nodes = {}
        for cid, info in TRIG_CONCEPTS.items():
            existing = db.query(Concept).filter_by(id=cid).first()
            if not existing:
                node = Concept(
                    id=cid,
                    title=info["title"],
                    chapter=info["chapter"],
                    difficulty=info["difficulty"],
                    description=info["description"],
                    formula_reference=info.get("formula_reference", ""),
                    problem_data=info.get("problem_data", {})
                )
                db.add(node)
                nodes[cid] = node
                print(f" -> Created Concept: [{cid}] {info['title']}")
            else:
                existing.title = info["title"]
                existing.chapter = info["chapter"]
                existing.difficulty = info["difficulty"]
                existing.description = info["description"]
                existing.formula_reference = info.get("formula_reference", "")
                existing.problem_data = info.get("problem_data", {})
                nodes[cid] = existing
                print(f" -> Updated Concept: [{cid}] {info['title']}")

        db.flush()

        for cid, info in TRIG_CONCEPTS.items():
            child = nodes[cid]
            child.prerequisites = []
            for prereq_id in info["prereqs"]:
                if prereq_id in nodes:
                    parent = nodes[prereq_id]
                    child.prerequisites.append(parent)
                    print(f"    [DAG Link] {parent.id} ---> {child.id}")

        db.commit()
        print("\nSUCCESS: 10-Node CBSE Class 10 Trigonometry DAG fully seeded with rich problem sets!")
    except Exception as e:
        db.rollback()
        print(f"ERROR during DAG seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_trig_dag()
