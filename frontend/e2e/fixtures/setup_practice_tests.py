"""Idempotent DB+API fixture for practice-tests.spec.ts: a tenant with an
activation key, one chapter, one authored question (with a passage + math), and
three test assignments (OPEN/UPCOMING/CLOSED, tenant-wide) so the student-facing
Tests section has real data in every status. Same direct-DB-fixture convention
as backend/test_*.py, invoked from Node's beforeAll since Playwright/TS has no
psycopg. Prints {"key_code": ...}."""
import json
import os
import sys
from datetime import datetime, timedelta, timezone

import httpx
import psycopg

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
from main import DB_DSN

BASE = "http://127.0.0.1:8001"
now = datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat()


with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subjects WHERE name = 'PracticeTestsE2E Subject'")  # cascades chapters/questions
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeTestsE2E Tenant')")
    conn.execute("DELETE FROM activation_keys WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'PracticeTestsE2E Tenant')")
    conn.execute("DELETE FROM tenants WHERE name = 'PracticeTestsE2E Tenant'")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'PracticeTestsE2E Plan'")

    tid = conn.execute("INSERT INTO tenants (name, type, status) "
                       "VALUES ('PracticeTestsE2E Tenant', 'SCHOOL', 'ACTIVE') RETURNING id").fetchone()[0]
    pid = conn.execute("INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
                       "VALUES ('PracticeTestsE2E Plan', 4, true, true, true) RETURNING id").fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    sid = conn.execute("INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                       "VALUES (%s, 'PracticeTestsE2E Subject', '9', 970) RETURNING id", (tid,)).fetchone()[0]
    cid = conn.execute("INSERT INTO chapters (subject_id, name, sequence_order) "
                       "VALUES (%s, 'PracticeTestsE2E Chapter', 1) RETURNING id", (sid,)).fetchone()[0]

TID, CID = str(tid), str(cid)

login = httpx.post(f"{BASE}/auth/login", json={"email": "admin@edova.dev", "password": "testpass"})
login.raise_for_status()
auth = {"Authorization": f"Bearer {login.json()['access_token']}"}

r = httpx.post(f"{BASE}/admin/questions", json={
    "chapter_id": CID, "question_type": "CASE_STUDY", "marks": 2,
    "question_text": '<p>Solve <span class="qmath" data-latex="x^2-4=0"></span></p>',
    "passage": "<p>A short E2E fixture passage.</p>",
    "options": [{"key": "A", "text": "x=2 or x=-2", "correct": True}, {"key": "B", "text": "x=4", "correct": False}],
}, headers=auth)
r.raise_for_status()
version_id = r.json()["version_id"]


def publish(title, opens_at, closes_at):
    r = httpx.post(f"{BASE}/admin/tests", json={
        "chapter_id": CID, "title": title, "timer_minutes": 30,
        "questions": [{"version_id": version_id, "marks": 2}],
        "assignments": [{"section_id": None, "opens_at": iso(opens_at), "closes_at": iso(closes_at)}],
    }, headers=auth)
    r.raise_for_status()


publish("Open Test", now - timedelta(hours=1), now + timedelta(days=2))
publish("Upcoming Test", now + timedelta(days=1), now + timedelta(days=3))
publish("Closed Test", now - timedelta(days=5), now - timedelta(days=1))

r = httpx.post(f"{BASE}/admin/tenants/{TID}/activation-keys", json={"max_devices": 50}, headers=auth)
r.raise_for_status()
key_code = r.json()["key_code"]

print(json.dumps({"key_code": key_code}))
