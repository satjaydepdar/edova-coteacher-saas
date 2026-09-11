"""GET /api/teacher/analytics/section/{id}: Level-2's Subject filter data source. Same
shared math as /analytics/overview (proven identical by that test), scoped to one
section. Proven against the one real chapter (Mathematics) plus a synthetic Science
chapter inserted into COMPILED_GRAPHS for this test only, to show multi-subject
grouping works even though only one subject is actually authored today."""

import psycopg
from fastapi.testclient import TestClient
from main import app, DB_DSN, hash_password
import kg_service
from kg_schemas import ChapterKnowledgeGraph, ConceptNode

from testutil import check, finish

client = TestClient(app)

REAL_CHAPTER_ID = "chapter-05-arithmetic-progressions"
OPTICS_CHAPTER_ID = "test-analytics-section-optics"

kg_service.COMPILED_GRAPHS[OPTICS_CHAPTER_ID] = ChapterKnowledgeGraph(
    subject_id="science", subject_name="Science", chapter_id=OPTICS_CHAPTER_ID,
    chapter_number=1, chapter_title="Optics", total_concepts=2,
    nodes={
        "O-01": ConceptNode(id="O-01", name="Reflection", topic="Optics", learning_goal="test"),
        "O-02": ConceptNode(id="O-02", name="Refraction", topic="Optics", learning_goal="test"),
    },
)

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsSectionTest Tenant')")
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsSectionTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'AnalyticsSectionTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'AnalyticsSectionTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'AnalyticsSectionTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'analyticssectiontest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('AnalyticsSectionTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('AnalyticsSectionTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    teacher_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'AS Teacher') RETURNING id",
        ("analyticssectiontest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                 (teacher_uid, tid))

login_r = client.post("/auth/login", json={"email": "analyticssectiontest.teacher@test.dev", "password": "testpass"})
T = {"Authorization": f"Bearer {login_r.json()['access_token']}"}

sec_a = client.post("/api/teacher/sections", json={"name": "AS-A", "grade": "9"}, headers=T).json()["id"]
sec_b = client.post("/api/teacher/sections", json={"name": "AS-B", "grade": "9"}, headers=T).json()["id"]

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (sec_a, sec_b))


def record(section, student, chapter, concept, event="mastery"):
    client.post("/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section, "student_id": student, "chapter_id": chapter,
        "concept_id": concept, "event_type": event,
    })


# Section A: touches both Math (real) and Science (synthetic). Section B: Math only.
record(sec_a, "as_student_1", REAL_CHAPTER_ID, "AP-01")
record(sec_a, "as_student_1", OPTICS_CHAPTER_ID, "O-01")
record(sec_a, "as_student_2", OPTICS_CHAPTER_ID, "O-01")
record(sec_b, "as_student_3", REAL_CHAPTER_ID, "AP-01")

r = client.get(f"/api/teacher/analytics/section/{sec_a}", headers=T)
check("section endpoint responds", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}

check("section metadata correct (id, name, grade)",
      data.get("section", {}).get("name") == "AS-A" and data.get("section", {}).get("grade") == "9",
      f"section={data.get('section')}")

chapters_by_subject = {}
for c in data.get("chapters", []):
    chapters_by_subject.setdefault(c["subject_name"], []).append(c["chapter_id"])
check("Section A's chapters span both Math and Science subjects",
      set(chapters_by_subject.keys()) == {"Mathematics", "Science"}, f"got={chapters_by_subject}")
check("Optics chapter correctly tagged under Science",
      chapters_by_subject.get("Science") == [OPTICS_CHAPTER_ID], f"got={chapters_by_subject.get('Science')}")

# Section B never touched Optics -- must not leak into its response.
r2 = client.get(f"/api/teacher/analytics/section/{sec_b}", headers=T)
subjects_b = {c["subject_name"] for c in r2.json().get("chapters", [])} if r2.status_code == 200 else set()
check("Section B (Math only) does not see Section A's Science chapter",
      subjects_b == {"Mathematics"}, f"got={subjects_b}")

# Unknown section (or another tenant's) -> 404, not a leak.
r3 = client.get("/api/teacher/analytics/section/00000000-0000-0000-0000-000000000000", headers=T)
check("unknown section id -> 404", r3.status_code == 404, f"status={r3.status_code}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id IN (%s, %s)", (sec_a, sec_b))

finish()
