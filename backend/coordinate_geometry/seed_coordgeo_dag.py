"""12-concept CBSE Class 10 Coordinate Geometry DAG (C1..C12), per the content
spec reviewed and approved across several rounds (Coordinate-Geometry-Dag.md,
then C4 split into three granular concepts -- Collinearity / Triangle Types /
Quadrilateral Types -- confirmed as the final C12 structure).

Run manually:
    .venv/Scripts/python.exe -m coordinate_geometry.seed_coordgeo_dag
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from coordinate_geometry.database import init_db, SessionLocal
from coordinate_geometry.models import Concept, CoordGeoQuestion

CHAPTER = "Coordinate Geometry"

COORDGEO_CONCEPTS = {
    "coordgeo-c1": {
        "title": "Cartesian Basics",
        "difficulty": 1.0,
        "description": "Abscissa (x), ordinate (y), origin (0,0), plotting P(x,y), and identifying quadrants.",
        "formula_reference": "Point = (abscissa, ordinate) = (x, y)",
        "prereqs": [],
    },
    "coordgeo-c2": {
        "title": "Distance Formula Between Two Points",
        "difficulty": 1.2,
        "description": "Distance between P(x1,y1) and Q(x2,y2), derived from the Pythagorean theorem.",
        "formula_reference": "PQ = sqrt((x2-x1)^2 + (y2-y1)^2)",
        "prereqs": ["coordgeo-c1"],
    },
    "coordgeo-c3": {
        "title": "Distance From Origin",
        "difficulty": 1.2,
        "description": "Special case of the distance formula where one point is the origin (0,0).",
        "formula_reference": "OP = sqrt(x^2 + y^2)",
        "prereqs": ["coordgeo-c2"],
    },
    "coordgeo-c4": {
        "title": "Collinearity of Points (using Distance)",
        "difficulty": 1.6,
        "description": "Using distance to prove three points are collinear: AB + BC = AC.",
        "formula_reference": "Collinear if AB + BC = AC",
        "prereqs": ["coordgeo-c2", "coordgeo-c3"],
    },
    "coordgeo-c5": {
        "title": "Verifying Triangle Types (using Distance)",
        "difficulty": 1.6,
        "description": "Using distance to verify equilateral, isosceles, or right-angled triangles.",
        "formula_reference": "Right angle if a^2 + b^2 = c^2 (Pythagoras converse)",
        "prereqs": ["coordgeo-c2", "coordgeo-c3"],
    },
    "coordgeo-c6": {
        "title": "Verifying Quadrilateral Types (using Distance)",
        "difficulty": 1.7,
        "description": "Using distance to verify square, rhombus, or parallelogram properties (sides and diagonals).",
        "formula_reference": "Square: all sides equal AND both diagonals equal",
        "prereqs": ["coordgeo-c2", "coordgeo-c3"],
    },
    "coordgeo-c7": {
        "title": "Section Formula - Internal Division",
        "difficulty": 1.8,
        "description": "Point P(x,y) dividing A(x1,y1) and B(x2,y2) internally in ratio m1:m2.",
        "formula_reference": "x = (m1*x2+m2*x1)/(m1+m2), y = (m1*y2+m2*y1)/(m1+m2)",
        "prereqs": ["coordgeo-c1"],
    },
    "coordgeo-c8": {
        "title": "Midpoint Formula",
        "difficulty": 1.4,
        "description": "Special case of the section formula where the ratio is 1:1.",
        "formula_reference": "M = ((x1+x2)/2, (y1+y2)/2)",
        "prereqs": ["coordgeo-c7"],
    },
    "coordgeo-c9": {
        "title": "Finding Ratio / Axis Division",
        "difficulty": 2.0,
        "description": "Inverse of the section formula: given the dividing point, find the ratio k:1. On the y-axis x=0; on the x-axis y=0.",
        "formula_reference": "Set x=0 (or y=0) in the section formula and solve for k",
        "prereqs": ["coordgeo-c7"],
    },
    "coordgeo-c10": {
        "title": "Division into Equal Parts - Trisection",
        "difficulty": 2.2,
        "description": "Dividing AB into 3 equal parts: P divides 1:2, Q divides 2:1 (Q is also the midpoint of PB).",
        "formula_reference": "P=((x2+2x1)/3,(y2+2y1)/3), Q=((2x2+x1)/3,(2y2+y1)/3)",
        "prereqs": ["coordgeo-c8", "coordgeo-c9"],
    },
    "coordgeo-c11": {
        "title": "Parallelogram Diagonal Property",
        "difficulty": 1.9,
        "description": "Diagonals of a parallelogram bisect each other: midpoint of AC = midpoint of BD.",
        "formula_reference": "(x1+x3)/2 = (x2+x4)/2, and the same for y",
        "prereqs": ["coordgeo-c8"],
    },
    "coordgeo-c12": {
        "title": "Advanced Area Application - Rhombus",
        "difficulty": 2.4,
        "description": "Combining distance and midpoint to find area: Area of a rhombus = 1/2 * product of diagonals.",
        "formula_reference": "Area = 1/2 * d1 * d2",
        "prereqs": ["coordgeo-c6", "coordgeo-c8", "coordgeo-c11"],
    },
}

# One curated NCERT/board question per concept (Coord-12-Real-Problems.md).
COORDGEO_QUESTIONS = [
    {
        "concept_id": "coordgeo-c1", "title": "Quadrant Identification", "difficulty": 1.0,
        "problem_text": "If the abscissa of a point is 4 and ordinate is -5, write the point. In which quadrant does it lie?",
        "hints": {"high": "Abscissa = x, Ordinate = y. Quadrant IV is (+, -).", "mid": "Point = (abscissa, ordinate).", "low": "x > 0, y < 0 -- which quadrant?"},
        "worked_solution": ["Point = (abscissa, ordinate) = (4, -5)", "x > 0, y < 0 => 4th quadrant"],
        "expected_answer": "(4, -5), Quadrant IV",
        "problem_spec": {"problem_type": "COORDGEO_CARTESIAN_BASICS", "abscissa": 4, "ordinate": -5},
    },
    {
        "concept_id": "coordgeo-c2", "title": "NCERT Ex 7.1 Q1", "difficulty": 1.2,
        "problem_text": "Find the distance between A(2,3) and B(4,1).",
        "hints": {"high": "Use sqrt[(x2-x1)^2+(y2-y1)^2]. Watch the sign.", "mid": "Subtract x's and y's, square, add, root.", "low": "AB = sqrt[(4-2)^2 + (1-3)^2]"},
        "worked_solution": ["x2-x1 = 2, y2-y1 = -2", "AB = sqrt[2^2 + (-2)^2] = sqrt(8) = 2*sqrt(2)"],
        "expected_answer": "2*sqrt(2) units",
        "problem_spec": {"problem_type": "COORDGEO_DISTANCE", "p1": ["2", "3"], "p2": ["4", "1"]},
    },
    {
        "concept_id": "coordgeo-c3", "title": "NCERT Ex 7.1 Q2", "difficulty": 1.2,
        "problem_text": "Find the distance of point P(-6,8) from the origin.",
        "hints": {"high": "Origin is (0,0). Use sqrt(x^2+y^2).", "mid": "OP = sqrt[(-6)^2 + 8^2]", "low": "Square both coordinates and add, then root."},
        "worked_solution": ["OP = sqrt[(-6-0)^2 + (8-0)^2] = sqrt(36+64) = sqrt(100)"],
        "expected_answer": "10 units",
        "problem_spec": {"problem_type": "COORDGEO_DISTANCE_FROM_ORIGIN", "p": ["-6", "8"]},
    },
    {
        "concept_id": "coordgeo-c4", "title": "NCERT Ex 7.1 Q3 (verified set)", "difficulty": 1.6,
        "problem_text": "Check if A(1,-1), B(5,2), C(9,5) are collinear.",
        "hints": {"high": "Find AB, BC, AC. If AB+BC=AC, the points are collinear.", "mid": "Use the distance formula for all three pairs.", "low": "Compare the sum of the two smaller distances to the largest."},
        "worked_solution": ["AB = sqrt(4^2+3^2) = 5", "BC = sqrt(4^2+3^2) = 5", "AC = sqrt(8^2+6^2) = 10", "AB+BC = 5+5 = 10 = AC => Collinear"],
        "expected_answer": "Collinear",
        "problem_spec": {"problem_type": "COORDGEO_COLLINEARITY", "p1": ["1", "-1"], "p2": ["5", "2"], "p3": ["9", "5"]},
    },
    {
        "concept_id": "coordgeo-c5", "title": "Right Triangle Verification", "difficulty": 1.6,
        "problem_text": "Prove that A(2,-2), B(14,10), C(11,13) forms a right triangle.",
        "hints": {"high": "Find AB^2, BC^2, AC^2. Check if the Pythagoras converse holds.", "mid": "Use the distance formula for all three sides.", "low": "Which side is the longest? Check a^2+b^2=c^2."},
        "worked_solution": ["AB^2 = 12^2+12^2 = 288", "BC^2 = 3^2+3^2 = 18", "AC^2 = 9^2+15^2 = 306", "AB^2+BC^2 = 288+18 = 306 = AC^2 => right angle at B"],
        "expected_answer": "Right triangle, right angle at B",
        "problem_spec": {"problem_type": "COORDGEO_TRIANGLE_TYPE", "p1": ["2", "-2"], "p2": ["14", "10"], "p3": ["11", "13"]},
    },
    {
        "concept_id": "coordgeo-c6", "title": "Square Verification", "difficulty": 1.7,
        "problem_text": "Show that points (-1,-2),(1,0),(-1,2),(-3,0) form a square.",
        "hints": {"high": "Check all four sides are equal AND both diagonals are equal.", "mid": "Find AB, BC, CD, DA and both diagonals.", "low": "Use the distance formula for each side and diagonal."},
        "worked_solution": ["AB=BC=CD=DA=sqrt(8) => all sides equal", "Diagonal AC = 4, BD = 4 => diagonals equal", "All sides equal + diagonals equal => Square"],
        "expected_answer": "Square",
        "problem_spec": {"problem_type": "COORDGEO_QUADRILATERAL_TYPE", "p1": ["-1", "-2"], "p2": ["1", "0"], "p3": ["-1", "2"], "p4": ["-3", "0"]},
    },
    {
        "concept_id": "coordgeo-c7", "title": "NCERT Ex 7.2 Q1", "difficulty": 1.8,
        "problem_text": "Find the point P which divides the line segment joining A(1,-5) and B(-4,5) in the ratio 1:2.",
        "hints": {"high": "Use x=(m1*x2+m2*x1)/(m1+m2) and the same form for y.", "mid": "m1=1, m2=2.", "low": "Substitute into the section formula."},
        "worked_solution": ["x = (1*(-4)+2*1)/3 = -2/3", "y = (1*5+2*(-5))/3 = -5/3"],
        "expected_answer": "(-2/3, -5/3)",
        "problem_spec": {"problem_type": "COORDGEO_SECTION_FORMULA", "p1": ["1", "-5"], "p2": ["-4", "5"], "m1": 1, "m2": 2},
    },
    {
        "concept_id": "coordgeo-c8", "title": "NCERT Ex 7.2 Q7", "difficulty": 1.4,
        "problem_text": "Find the midpoint of A(2,-3) and B(-6,3).",
        "hints": {"high": "M = ((x1+x2)/2, (y1+y2)/2).", "mid": "Add the x's, divide by 2; add the y's, divide by 2.", "low": "Average the two x-coordinates and the two y-coordinates."},
        "worked_solution": ["x = (2+(-6))/2 = -2", "y = (-3+3)/2 = 0"],
        "expected_answer": "(-2, 0)",
        "problem_spec": {"problem_type": "COORDGEO_MIDPOINT", "p1": ["2", "-3"], "p2": ["-6", "3"]},
    },
    {
        "concept_id": "coordgeo-c9", "title": "NCERT Ex 7.2 Q9", "difficulty": 2.0,
        "problem_text": "Find the ratio in which the y-axis divides the line joining P(-4,2) and Q(8,6). Also find the point of intersection.",
        "hints": {"high": "On the y-axis, x=0. Set the section-formula x-expression to 0 and solve for k.", "mid": "Let the ratio be k:1.", "low": "x = (k*8 + 1*(-4))/(k+1) = 0"},
        "worked_solution": ["8k - 4 = 0 => k = 1/2 => ratio 1:2", "y = ((1/2)*6 + 2)/(3/2) = 10/3"],
        "expected_answer": "Ratio 1:2, point (0, 10/3)",
        "problem_spec": {"problem_type": "COORDGEO_RATIO_AXIS_DIVISION", "p1": ["-4", "2"], "p2": ["8", "6"], "axis": "y"},
    },
    {
        "concept_id": "coordgeo-c10", "title": "NCERT Ex 7.2 Q4", "difficulty": 2.2,
        "problem_text": "Find the trisection points of A(4,-1) and B(-2,-3).",
        "hints": {"high": "P divides 1:2, Q divides 2:1.", "mid": "Apply the section formula twice.", "low": "Q is also the midpoint of P and B."},
        "worked_solution": ["P = ((-2+8)/3, (-3-2)/3) = (2, -5/3)", "Q = ((-4+4)/3, (-6-1)/3) = (0, -7/3)"],
        "expected_answer": "P(2, -5/3), Q(0, -7/3)",
        "problem_spec": {"problem_type": "COORDGEO_TRISECTION", "p1": ["4", "-1"], "p2": ["-2", "-3"]},
    },
    {
        "concept_id": "coordgeo-c11", "title": "NCERT Ex 7.2 Q10", "difficulty": 1.9,
        "problem_text": "If A(6,1), B(8,2), C(9,4), D(p,3) are vertices of a parallelogram ABCD, find p.",
        "hints": {"high": "Midpoint of AC = midpoint of BD.", "mid": "Set up the midpoint of each diagonal.", "low": "Equate the x-coordinates of both midpoints."},
        "worked_solution": ["Mid AC = (7.5, 2.5)", "Mid BD = ((8+p)/2, 2.5)", "7.5 = (8+p)/2 => p = 7"],
        "expected_answer": "p = 7",
        "problem_spec": {"problem_type": "COORDGEO_PARALLELOGRAM_VERTEX", "known": {"A": ["6", "1"], "B": ["8", "2"], "C": ["9", "4"]}, "missing_label": "D"},
    },
    {
        "concept_id": "coordgeo-c12", "title": "Board 2020 Rhombus Area", "difficulty": 2.4,
        "problem_text": "Find the area of a rhombus whose vertices are (3,0),(4,5),(-1,4),(-2,-1), taken in order.",
        "hints": {"high": "Area = 1/2 * d1 * d2. Find both diagonals using the distance formula.", "mid": "The diagonals connect opposite vertices.", "low": "d1 = distance between vertex 1 and 3; d2 = distance between vertex 2 and 4."},
        "worked_solution": ["d1 = AC = sqrt(16+16) = 4*sqrt(2)", "d2 = BD = sqrt(36+36) = 6*sqrt(2)", "Area = 1/2 * 4*sqrt(2) * 6*sqrt(2) = 24"],
        "expected_answer": "24 sq units",
        "problem_spec": {"problem_type": "COORDGEO_DIAGONAL_AREA", "p1": ["3", "0"], "p2": ["4", "5"], "p3": ["-1", "4"], "p4": ["-2", "-1"]},
    },
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        for cid, data in COORDGEO_CONCEPTS.items():
            existing = db.query(Concept).filter(Concept.id == cid).first()
            if existing:
                continue
            db.add(Concept(
                id=cid,
                title=data["title"],
                chapter=CHAPTER,
                difficulty=data["difficulty"],
                description=data["description"],
                formula_reference=data["formula_reference"],
                problem_data={},
            ))
        db.commit()

        # Prerequisites (second pass, once every Concept row exists).
        for cid, data in COORDGEO_CONCEPTS.items():
            concept = db.query(Concept).filter(Concept.id == cid).first()
            concept.prerequisites = [
                db.query(Concept).filter(Concept.id == pid).first() for pid in data["prereqs"]
            ]
        db.commit()

        for q in COORDGEO_QUESTIONS:
            exists = db.query(CoordGeoQuestion).filter(
                CoordGeoQuestion.concept_id == q["concept_id"],
                CoordGeoQuestion.title == q["title"],
            ).first()
            if exists:
                continue
            db.add(CoordGeoQuestion(
                concept_id=q["concept_id"],
                chapter=CHAPTER,
                difficulty=q["difficulty"],
                title=q["title"],
                problem_text=q["problem_text"],
                hints=q["hints"],
                worked_solution=q["worked_solution"],
                expected_answer=q["expected_answer"],
                problem_spec=q.get("problem_spec"),
            ))
        db.commit()
        print(f"Seeded {len(COORDGEO_CONCEPTS)} concepts and {len(COORDGEO_QUESTIONS)} questions.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
