"""POST /api/teacher/telemetry/record-mastery must keep working exactly as before
(in-memory heatmap engine untouched) AND now also persist a durable row to the new
mastery_events table, for DuckDB to later read. classroom_id/chapter_id/concept_id/
student_id are free-form strings today (not FKs to sections/chapters/users) -- the
new table must accept the same non-UUID slugs the existing engine already accepts,
or it would break currently-working callers like test_teacher_analytics.py."""

import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish

CLASSROOM_ID = "test-mastery-events-classroom"  # deliberately NOT a UUID
CHAPTER_ID = "chapter-05-arithmetic-progressions"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (CLASSROOM_ID,))

# TC1: existing endpoint still responds exactly as before (unchanged contract)
r = httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
    "classroom_id": CLASSROOM_ID, "student_id": "me_student_1", "student_name": "ME Student 1",
    "chapter_id": CHAPTER_ID, "concept_id": "AP-01", "event_type": "mastery",
})
check("existing endpoint response unchanged", r.status_code == 200 and r.json().get("status") == "recorded",
      f"status={r.status_code} body={r.text}")

# TC2: a struggle event with error_detail
r2 = httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
    "classroom_id": CLASSROOM_ID, "student_id": "me_student_2", "student_name": "ME Student 2",
    "chapter_id": CHAPTER_ID, "concept_id": "AP-05", "event_type": "struggle",
    "error_detail": "mastery-events persistence test",
})
check("struggle event also accepted", r2.status_code == 200, f"status={r2.status_code} body={r2.text}")

# TC3: both events landed in the new durable table with correct fields
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    rows = conn.execute(
        "SELECT student_id, concept_id, event_type, error_detail FROM mastery_events "
        "WHERE classroom_id = %s ORDER BY concept_id", (CLASSROOM_ID,)
    ).fetchall()

check("both events persisted to mastery_events", len(rows) == 2, f"rows={rows}")
check("mastery event fields correct", rows[0] == ("me_student_1", "AP-01", "mastery", None) if rows else False,
      f"row0={rows[0] if rows else None}")
check("struggle event fields correct",
      rows[1] == ("me_student_2", "AP-05", "struggle", "mastery-events persistence test") if len(rows) > 1 else False,
      f"row1={rows[1] if len(rows) > 1 else None}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (CLASSROOM_ID,))

finish()
