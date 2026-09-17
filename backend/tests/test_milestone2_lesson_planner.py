import sys
import os

backend_path = r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend'
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from main import app
from core import db, q, issue_token
from datetime import datetime, timedelta, timezone, date

client = TestClient(app)

print("1. Fetching active Teacher...")
with db() as conn:
    row = conn.execute("""
        SELECT u.id, u.email, utm.tenant_id, utm.role 
        FROM users u 
        JOIN user_tenant_mappings utm ON u.id = utm.user_id 
        WHERE utm.role = 'TEACHER' 
        LIMIT 1
    """).fetchone()

assert row is not None, "No teacher account found"
user_id, email, tenant_id, role = str(row[0]), row[1], str(row[2]), row[3]
print(f"Teacher found: {email}, Tenant: {tenant_id}")

token = issue_token(user_id)
headers = {'Authorization': f'Bearer {token}'}

print("2. Testing GET /api/lessons/plans...")
res = client.get('/api/lessons/plans', headers=headers)
print("List status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
assert len(res.json()) >= 3, "Expected at least 3 seeded lesson plans"
first_plan = res.json()[0]
print(f"Sample plan: '{first_plan['title']}', Status: {first_plan['status']}, Bloom: {first_plan['bloom_levels']}")

print("3. Testing POST /api/lessons/plans (Create)...")
new_plan_payload = {
    "title": "Pair of Linear Equations: Graphical Method",
    "subject": "Mathematics",
    "class_label": "Class 10",
    "section_name": "Section A",
    "unit_id": "unit-2",
    "chapter_id": "ch-2-1",
    "topic_id": "topic-2-1-2",
    "duration_minutes": 45,
    "objective": "Determine consistency and find graphical solutions of intersecting, parallel, and coincident lines.",
    "outcomes": [
        "Plot pairs of linear equations on Cartesian coordinate axes",
        "Deduce consistency criteria using ratio comparisons a1/a2, b1/b2, c1/c2"
    ],
    "bloom_levels": ["Understand", "Analyze"],
    "nep_tags": ["Concept", "Critical thinking"],
    "phases": {
        "warmup": "Plot 2x + 3y = 6 intercepts on board.",
        "instruction": "Explain conditions for unique solution, no solution, and infinitely many solutions.",
        "activity": "Graphing worksheet on Cartesian grid.",
        "assessment": "Quick poll on consistency of parallel lines.",
        "homework": "Exercise 3.2 Questions 1 to 3."
    },
    "materials": ["Graph paper", "Colored pencils", "Ruler"],
    "status": "draft"
}
res = client.post('/api/lessons/plans', json=new_plan_payload, headers=headers)
print("Create status:", res.status_code, "ID:", res.json().get('id'))
assert res.status_code == 201
created_plan = res.json()
created_id = created_plan['id']
assert created_plan['title'] == new_plan_payload['title']

print("4. Testing GET /api/lessons/plans/{id}...")
res = client.get(f'/api/lessons/plans/{created_id}', headers=headers)
assert res.status_code == 200
assert res.json()['objective'] == new_plan_payload['objective']

print("5. Testing PUT /api/lessons/plans/{id} (Update)...")
update_payload = {
    "title": "Pair of Linear Equations: Graphical Method (Updated)",
    "status": "planned",
    "duration_minutes": 50
}
res = client.put(f'/api/lessons/plans/{created_id}', json=update_payload, headers=headers)
assert res.status_code == 200
updated_plan = res.json()
assert updated_plan['title'] == update_payload['title']
assert updated_plan['status'] == "planned"
assert updated_plan['duration_minutes'] == 50

print("6. Testing POST /api/lessons/plans/{id}/schedule (Calendar Integration)...")
sched_date = (date.today() + timedelta(days=3)).isoformat()
sched_payload = {
    "scheduled_date": sched_date,
    "start_time": "10:30",
    "location": "Math Lab Room 204"
}
res = client.post(f'/api/lessons/plans/{created_id}/schedule', json=sched_payload, headers=headers)
print("Schedule status:", res.status_code, "Calendar Event ID:", res.json().get('calendar_event_id'))
assert res.status_code == 200
sched_res = res.json()
assert sched_res['status'] == 'scheduled'
cal_event_id = sched_res['calendar_event_id']
assert cal_event_id is not None

# Verify calendar_events record exists in DB
with db() as conn:
    cal_ev = conn.execute("SELECT title, start_at, location FROM calendar_events WHERE id = %s", (cal_event_id,)).fetchone()
print("Persisted Calendar Event:", cal_ev)
assert cal_ev is not None
assert "Pair of Linear Equations" in cal_ev[0]
assert cal_ev[2] == "Math Lab Room 204"

print("7. Testing DELETE /api/lessons/plans/{id}...")
res = client.delete(f'/api/lessons/plans/{created_id}', headers=headers)
assert res.status_code == 200

with db() as conn:
    del_check = conn.execute("SELECT id FROM lesson_plans WHERE id = %s", (created_id,)).fetchone()
assert del_check is None
print("Deleted plan verified from DB.")

print("\n*** ALL MILESTONE 2 BACKEND & DATABASE TESTS PASSED! ***")
