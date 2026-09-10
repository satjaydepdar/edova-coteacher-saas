"""Proves DuckDB can attach to Postgres (via its postgres scanner) and compute the
Level-1 cross-chapter rollup for one classroom_id directly from mastery_events with
plain SQL -- no new backend endpoint, no live fan-out of HTTP calls needed."""

import duckdb
import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish

CLASSROOM_ID = "test-duckdb-rollup-classroom"
CHAPTER_A = "chapter-05-arithmetic-progressions"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (CLASSROOM_ID,))

# 2 students master AP-01, 1 student struggles on AP-05 -- via the real, unchanged endpoint.
for student_id, concept_id, event_type in [
    ("dd_student_1", "AP-01", "mastery"),
    ("dd_student_2", "AP-01", "mastery"),
    ("dd_student_3", "AP-05", "struggle"),
]:
    httpx.post(f"{BASE}/api/teacher/telemetry/record-mastery", json={
        "classroom_id": CLASSROOM_ID, "student_id": student_id, "chapter_id": CHAPTER_A,
        "concept_id": concept_id, "event_type": event_type,
    })

con = duckdb.connect()
con.execute("INSTALL postgres")
con.execute("LOAD postgres")
con.execute(f"ATTACH '{DB_DSN}' AS pg (TYPE POSTGRES, READ_ONLY)")

row = con.execute(
    "SELECT event_type, count(DISTINCT student_id) FROM pg.mastery_events "
    "WHERE classroom_id = ? GROUP BY event_type ORDER BY event_type",
    [CLASSROOM_ID],
).fetchall()
check("duckdb rollup counts distinct students per event_type", row == [("mastery", 2), ("struggle", 1)],
      f"row={row}")

total_events = con.execute(
    "SELECT count(*) FROM pg.mastery_events WHERE classroom_id = ?", [CLASSROOM_ID]
).fetchone()
check("duckdb sees all 3 events for this classroom_id", total_events == (3,), f"total_events={total_events}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM mastery_events WHERE classroom_id = %s", (CLASSROOM_ID,))

finish()
