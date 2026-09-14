"""Curated Question Bank for CBSE Class 10 Trigonometry (trig-101..trig-110).
Seeds the trig_questions table with pre-parsed mathematical specifications (problem_spec JSONB)
so edova-reasoner bypasses all runtime regex and NLP parsing.

Run manually:
    .venv/Scripts/python -m trigonometry.seed_trig_questions
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from trigonometry.database import init_db, SessionLocal
from trigonometry.models import TrigQuestion

CURATED_QUESTIONS = [
    # trig-101: Right-Angled Triangle Anatomy
    {
        "concept_id": "trig-101",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.1 Q1 (24, 7)",
        "difficulty": 1.0,
        "problem_text": "In triangle ABC right angled at B, AB = 24 cm, BC = 7 cm. Determine: (i) sin A, cos A",
        "problem_spec": {
            "problem_type": "RIGHT_TRIANGLE_RATIOS",
            "vertices": ["A", "B", "C"],
            "right_angle_vertex": "B",
            "known_sides": {"AB": "24", "BC": "7"},
            "side_sum": None,
            "target_ratios": [["sin", "A"], ["cos", "A"]]
        }
    },
    {
        "concept_id": "trig-101",
        "chapter": "Introduction to Trigonometry",
        "title": "Pythagorean Triplet (5, 12)",
        "difficulty": 1.0,
        "problem_text": "In triangle ABC right angled at B, AB = 5 cm, BC = 12 cm. Determine: (i) sin A, cos A",
        "problem_spec": {
            "problem_type": "RIGHT_TRIANGLE_RATIOS",
            "vertices": ["A", "B", "C"],
            "right_angle_vertex": "B",
            "known_sides": {"AB": "5", "BC": "12"},
            "side_sum": None,
            "target_ratios": [["sin", "A"], ["cos", "A"]]
        }
    },

    # trig-102: Primary Trigonometric Ratios (sin, cos, tan)
    {
        "concept_id": "trig-102",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.1 Q3 (3, 4)",
        "difficulty": 1.5,
        "problem_text": "In triangle ABC right angled at B, AB = 3 cm, BC = 4 cm. Determine: (i) sin A, cos A",
        "problem_spec": {
            "problem_type": "RIGHT_TRIANGLE_RATIOS",
            "vertices": ["A", "B", "C"],
            "right_angle_vertex": "B",
            "known_sides": {"AB": "3", "BC": "4"},
            "side_sum": None,
            "target_ratios": [["sin", "A"], ["cos", "A"]]
        }
    },
    {
        "concept_id": "trig-102",
        "chapter": "Introduction to Trigonometry",
        "title": "Given tan A, evaluate sin A",
        "difficulty": 1.5,
        "problem_text": "If tan A = 4/3, evaluate sin A",
        "problem_spec": {
            "problem_type": "TRIG_RATIO_EVALUATION",
            "given_func": "tan",
            "given_coeff": "1",
            "given_value": "4/3",
            "angle_var": "A",
            "expr": "SINA"
        }
    },

    # trig-103: Reciprocal Trigonometric Ratios (cosec, sec, cot)
    {
        "concept_id": "trig-103",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.1 Reciprocal Ratios",
        "difficulty": 1.8,
        "problem_text": "In triangle ABC right angled at B, AB = 12 cm, BC = 5 cm. Determine: (i) sec A, cot A",
        "problem_spec": {
            "problem_type": "RIGHT_TRIANGLE_RATIOS",
            "vertices": ["A", "B", "C"],
            "right_angle_vertex": "B",
            "known_sides": {"AB": "12", "BC": "5"},
            "side_sum": None,
            "target_ratios": [["sec", "A"], ["cot", "A"]]
        }
    },
    {
        "concept_id": "trig-103",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.1 Q8 Evaluation",
        "difficulty": 2.0,
        "problem_text": "If 3 cot A = 4, evaluate (1 - tan^2 A) / (1 + tan^2 A)",
        "problem_spec": {
            "problem_type": "TRIG_RATIO_EVALUATION",
            "given_func": "cot",
            "given_coeff": "3",
            "given_value": "4",
            "angle_var": "A",
            "expr": "(1 - TANA**2) / (1 + TANA**2)"
        }
    },

    # trig-104: Quotient & Product Relations
    {
        "concept_id": "trig-104",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.4 Q1 (in terms of cot A)",
        "difficulty": 2.2,
        "problem_text": "Express sin A, sec A and tan A in terms of cot A",
        "problem_spec": {
            "problem_type": "EXPRESS_RATIOS_IN_TERMS_OF",
            "base_func": "cot",
            "target_funcs": ["sin", "sec", "tan"],
            "variable": "A"
        }
    },
    {
        "concept_id": "trig-104",
        "chapter": "Introduction to Trigonometry",
        "title": "Express ratios in terms of sin A",
        "difficulty": 2.2,
        "problem_text": "Express cos A, tan A and sec A in terms of sin A",
        "problem_spec": {
            "problem_type": "EXPRESS_RATIOS_IN_TERMS_OF",
            "base_func": "sin",
            "target_funcs": ["cos", "tan", "sec"],
            "variable": "A"
        }
    },

    # trig-105: Trigonometric Ratios of Standard Angles
    {
        "concept_id": "trig-105",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.2 Q1 Compound Evaluation",
        "difficulty": 2.0,
        "problem_text": "Evaluate: 2 tan^2 45 + cos^2 30 - sin^2 60",
        "problem_spec": {
            "problem_type": "COMPOUND_EVALUATION",
            "expression": "2*tan(45)**2 + cos(30)**2 - sin(60)**2"
        }
    },
    {
        "concept_id": "trig-105",
        "chapter": "Introduction to Trigonometry",
        "title": "NCERT Ex 8.2 Q3 Angle System",
        "difficulty": 2.5,
        "problem_text": "If tan (A + B) = sqrt(3) and tan (A - B) = 1/sqrt(3), find A and B.",
        "problem_spec": {
            "problem_type": "ANGLE_SYSTEM",
            "eq1_func": "tan",
            "eq1_arg": "A + B",
            "eq1_val": "sqrt(3)",
            "eq2_func": "tan",
            "eq2_arg": "A - B",
            "eq2_val": "1/sqrt(3)"
        }
    },

    # trig-106: The Core Pythagorean Identity
    {
        "concept_id": "trig-106",
        "chapter": "Trigonometric Identities",
        "title": "Conditional Identity (sin + cos = sqrt 3)",
        "difficulty": 2.5,
        "problem_text": "If sin A + cos A = sqrt(3), prove that tan A + cot A = 1",
        "problem_spec": {
            "problem_type": "CONDITIONAL_TRIG_IDENTITY",
            "variable": "A",
            "given_value": "sqrt(3)",
            "target_value": "1"
        }
    },
    {
        "concept_id": "trig-106",
        "chapter": "Trigonometric Identities",
        "title": "Reciprocal Conjugate Identity (7)",
        "difficulty": 2.5,
        "problem_text": "If sec A + tan A = 7, compute sec A - tan A",
        "problem_spec": {
            "problem_type": "RECIPROCAL_CONJUGATE_IDENTITY",
            "variable": "A",
            "func1": "sec",
            "func2": "tan",
            "given_sign": "+",
            "given_value": "7",
            "target_sign": "-"
        }
    },

    # trig-107: Derived Pythagorean Identities
    {
        "concept_id": "trig-107",
        "chapter": "Trigonometric Identities",
        "title": "Reciprocal Conjugate sec/tan (5)",
        "difficulty": 2.8,
        "problem_text": "If sec A + tan A = 5, compute sec A - tan A",
        "problem_spec": {
            "problem_type": "RECIPROCAL_CONJUGATE_IDENTITY",
            "variable": "A",
            "func1": "sec",
            "func2": "tan",
            "given_sign": "+",
            "given_value": "5",
            "target_sign": "-"
        }
    },
    {
        "concept_id": "trig-107",
        "chapter": "Trigonometric Identities",
        "title": "Reciprocal Conjugate csc/cot (3)",
        "difficulty": 2.8,
        "problem_text": "If csc A + cot A = 3, compute csc A - cot A",
        "problem_spec": {
            "problem_type": "RECIPROCAL_CONJUGATE_IDENTITY",
            "variable": "A",
            "func1": "csc",
            "func2": "cot",
            "given_sign": "+",
            "given_value": "3",
            "target_sign": "-"
        }
    },

    # trig-108: Complex Trigonometric Proofs & Simplifications
    {
        "concept_id": "trig-108",
        "chapter": "Trigonometric Identities",
        "title": "NCERT Ex 8.4 Q5 (viii) Proof",
        "difficulty": 3.2,
        "problem_text": "Prove that (sin A + csc A)^2 + (cos A + sec A)^2 = 7 + tan^2 A + cot^2 A",
        "problem_spec": {
            "problem_type": "TRIG_IDENTITY_PROOF",
            "lhs_text": "(sin(A) + csc(A))**2 + (cos(A) + sec(A))**2",
            "rhs_text": "7 + tan(A)**2 + cot(A)**2",
            "variable": "A"
        }
    },
    {
        "concept_id": "trig-108",
        "chapter": "Trigonometric Identities",
        "title": "NCERT Ex 8.4 Q5 (x) Proof",
        "difficulty": 3.0,
        "problem_text": "Prove that (1 + tan^2 A) / (1 + cot^2 A) = tan^2 A",
        "problem_spec": {
            "problem_type": "TRIG_IDENTITY_PROOF",
            "lhs_text": "(1 + tan(A)**2)/(1 + cot(A)**2)",
            "rhs_text": "tan(A)**2",
            "variable": "A"
        }
    },

    # trig-109: Applications: Angles of Elevation & Depression
    {
        "concept_id": "trig-109",
        "chapter": "Some Applications of Trigonometry",
        "title": "NCERT Ex 9.1 Q1 Tower Elevation",
        "difficulty": 2.5,
        "problem_text": "A tower stands vertically on the ground. From a point on the ground, which is 15 m away from the foot of the tower, the angle of elevation of the top of the tower is found to be 60 degrees. Find the height of the tower.",
        "problem_spec": {
            "problem_type": "HEIGHTS_AND_DISTANCES",
            "vertical_entity": "tower",
            "horizontal_entity": "ground",
            "distance_val": "15",
            "angle_val": 60,
            "target": "height",
            "archetype": "SINGLE"
        }
    },
    {
        "concept_id": "trig-109",
        "chapter": "Some Applications of Trigonometry",
        "title": "Oswaal Shadow Altitude",
        "difficulty": 2.5,
        "problem_text": "A tower AB is 20 m high and BC, its shadow on the ground, is 20 sqrt(3) m long. Find the Sun's altitude.",
        "problem_spec": {
            "problem_type": "HEIGHTS_AND_DISTANCES",
            "vertical_entity": "tower",
            "horizontal_entity": "ground",
            "height_val": "20",
            "distance_val": "20*sqrt(3)",
            "target": "angle",
            "archetype": "SINGLE"
        }
    },

    # trig-110: Advanced Multi-Triangle Heights & Distances Problems
    {
        "concept_id": "trig-110",
        "chapter": "Some Applications of Trigonometry",
        "title": "NCERT Ex 9.1 Bridge River Width",
        "difficulty": 3.5,
        "problem_text": "From a point on a bridge across a river, the angles of depression of the banks on opposite sides of the river are 30 degrees and 45 degrees. If the bridge is at a height of 3 m from the banks, find the width of the river.",
        "problem_spec": {
            "problem_type": "HEIGHTS_AND_DISTANCES",
            "vertical_entity": "bridge",
            "horizontal_entity": "river",
            "archetype": "CROSS",
            "theta1": 30,
            "theta2": 45,
            "measure": "3"
        }
    },
    {
        "concept_id": "trig-110",
        "chapter": "Some Applications of Trigonometry",
        "title": "NCERT Ex 9.1 Two Equal Poles",
        "difficulty": 3.5,
        "problem_text": "Two poles of equal heights are standing opposite each other on either side of the road, which is 80 m wide. From a point between them on the road, the angles of elevation of the tops of the poles are 60 degrees and 30 degrees. Find the height of the poles.",
        "problem_spec": {
            "problem_type": "HEIGHTS_AND_DISTANCES",
            "vertical_entity": "poles",
            "horizontal_entity": "road",
            "archetype": "EQUAL_POLES",
            "theta1": 60,
            "theta2": 30,
            "measure": "80"
        }
    }
]

def seed_trig_questions():
    init_db()
    db = SessionLocal()
    try:
        inserted = 0
        updated = 0
        for item in CURATED_QUESTIONS:
            existing = db.query(TrigQuestion).filter(
                TrigQuestion.concept_id == item["concept_id"],
                TrigQuestion.title == item["title"]
            ).first()
            if not existing:
                q = TrigQuestion(
                    concept_id=item["concept_id"],
                    chapter=item["chapter"],
                    title=item["title"],
                    difficulty=item["difficulty"],
                    problem_text=item["problem_text"],
                    problem_spec=item["problem_spec"]
                )
                db.add(q)
                inserted += 1
            else:
                existing.problem_spec = item["problem_spec"]
                existing.problem_text = item["problem_text"]
                existing.difficulty = item["difficulty"]
                existing.chapter = item["chapter"]
                updated += 1
        db.commit()
        print(f"Trig questions seed complete: {inserted} inserted, {updated} updated with problem_spec.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_trig_questions()
