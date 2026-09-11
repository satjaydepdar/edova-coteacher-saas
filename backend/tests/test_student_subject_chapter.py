"""subjects[] breakdown on GET /api/teacher/analytics/student/{student_id}: Subject ->
Chapter mastery, nested. Proven two ways:
  (a) against the ONE real chapter that's actually authored today (Mathematics /
      Arithmetic Progressions) -- a real, correct answer, not a mock.
  (b) against two synthetic chapters (a second Mathematics chapter + a Science
      chapter) inserted directly into the in-process COMPILED_GRAPHS, to prove the
      grouping logic itself is correct for multi-chapter/multi-subject cases --
      clearly NOT real curriculum content, just fixture data for this test.
Uses TestClient (in-process) rather than the live server over HTTP specifically so
the synthetic COMPILED_GRAPHS entries below are visible to the route handler --
httpx against a separate uvicorn process could not see an in-process monkeypatch.
"""

import psycopg
from fastapi.testclient import TestClient
from main import app, DB_DSN, hash_password
import kg_service
from kg_schemas import ChapterKnowledgeGraph, ConceptNode

from testutil import check, finish

client = TestClient(app)

REAL_CHAPTER_ID = "chapter-05-arithmetic-progressions"  # 23 real concepts, Mathematics

# --- synthetic fixtures, inserted only for this test ---
TRIG_CHAPTER_ID = "test-trig-chapter"
OPTICS_CHAPTER_ID = "test-optics-chapter"


def _fake_graph(chapter_id, subject_id, subject_name, chapter_title, concept_ids):
    nodes = {cid: ConceptNode(id=cid, name=f"{chapter_title} concept {cid}",
                               topic=chapter_title, learning_goal="test") for cid in concept_ids}
    return ChapterKnowledgeGraph(
        subject_id=subject_id, subject_name=subject_name, chapter_id=chapter_id,
        chapter_number=1, chapter_title=chapter_title, total_concepts=len(concept_ids), nodes=nodes,
    )


kg_service.COMPILED_GRAPHS[TRIG_CHAPTER_ID] = _fake_graph(
    TRIG_CHAPTER_ID, "mathematics", "Mathematics", "Trigonometry", ["T-01", "T-02", "T-03", "T-04"])
kg_service.COMPILED_GRAPHS[OPTICS_CHAPTER_ID] = _fake_graph(
    OPTICS_CHAPTER_ID, "science", "Science", "Optics", ["O-01", "O-02"])

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SubjectChapterTest Tenant')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SubjectChapterTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'SubjectChapterTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'SubjectChapterTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'SubjectChapterTest Tenant'")
    conn.execute("DELETE FROM users WHERE email = 'subjectchaptertest.teacher@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('SubjectChapterTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('SubjectChapterTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SC Teacher') RETURNING id",
        ("subjectchaptertest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')", (uid, tid))

login_r = client.post("/auth/login", json={"email": "subjectchaptertest.teacher@test.dev", "password": "testpass"})
T = {"Authorization": f"Bearer {login_r.json()['access_token']}"}

section_id = client.post("/api/teacher/sections", json={"name": "SC-A"}, headers=T).json()["id"]

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))


def record(concept_id, chapter_id):
    client.post("/api/teacher/telemetry/record-mastery", json={
        "classroom_id": section_id, "student_id": "sc_student_1", "chapter_id": chapter_id,
        "concept_id": concept_id, "event_type": "mastery",
    })


record("AP-01", REAL_CHAPTER_ID)                       # 1/23 mastered in the real chapter
record("T-01", TRIG_CHAPTER_ID); record("T-02", TRIG_CHAPTER_ID)   # 2/4 mastered in synthetic Trig
record("O-01", OPTICS_CHAPTER_ID)                       # 1/2 mastered in synthetic Optics

r = client.get("/api/teacher/analytics/student/sc_student_1", headers=T)
check("endpoint responds", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}

subjects_by_name = {s["subject_name"]: s for s in data.get("subjects", [])}
check("both subjects present", set(subjects_by_name.keys()) == {"Mathematics", "Science"},
      f"got={sorted(subjects_by_name.keys())}")

math = subjects_by_name.get("Mathematics", {})
math_chapters = {c["chapter_id"]: c for c in math.get("chapters", [])}
check("Mathematics has both chapters (real + synthetic)",
      set(math_chapters.keys()) == {REAL_CHAPTER_ID, TRIG_CHAPTER_ID}, f"got={sorted(math_chapters.keys())}")
check("real chapter (Arithmetic Progressions) mastery_pct = 1/23 = 4.3",
      math_chapters.get(REAL_CHAPTER_ID, {}).get("mastery_pct") == 4.3,
      f"got={math_chapters.get(REAL_CHAPTER_ID)}")
check("synthetic Trigonometry chapter mastery_pct = 2/4 = 50.0",
      math_chapters.get(TRIG_CHAPTER_ID, {}).get("mastery_pct") == 50.0,
      f"got={math_chapters.get(TRIG_CHAPTER_ID)}")
check("Mathematics subject-level mastery_pct = (1+2)/(23+4) = 11.1",
      math.get("mastery_pct") == 11.1, f"got={math.get('mastery_pct')}")

science = subjects_by_name.get("Science", {})
science_chapters = {c["chapter_id"]: c for c in science.get("chapters", [])}
check("synthetic Optics chapter mastery_pct = 1/2 = 50.0",
      science_chapters.get(OPTICS_CHAPTER_ID, {}).get("mastery_pct") == 50.0,
      f"got={science_chapters.get(OPTICS_CHAPTER_ID)}")
check("Science subject-level mastery_pct = 1/2 = 50.0", science.get("mastery_pct") == 50.0,
      f"got={science.get('mastery_pct')}")

check("existing top-level mastery_pct field still present and unchanged in shape",
      isinstance(data.get("mastery_pct"), float), f"got={data.get('mastery_pct')}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (section_id,))

finish()
