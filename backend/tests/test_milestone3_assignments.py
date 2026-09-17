import sys
import os

backend_path = r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend'
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from main import app
from core import db, q, issue_token
from datetime import datetime, timedelta, timezone

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

print("2. Testing GET /api/assignments...")
res = client.get('/api/assignments', headers=headers)
print("List status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
assert len(res.json()) >= 3
sample = res.json()[0]
print(f"Sample assignment: '{sample['title']}', Type: {sample['type']}, Students: {sample['total_students']}, Submitted: {sample['submitted_count']}, Avg: {sample['avg_score']}")

print("3. Testing POST /api/assignments (Create with Calendar sync)...")
due_dt = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
new_asg = {
    "title": "Pair of Linear Equations: Word Problems",
    "description": "Formulate algebraic equations for age and speed word problems and solve algebraically.",
    "section_name": "10-A",
    "subject": "Mathematics",
    "type": "homework",
    "total_points": 100.0,
    "due_date": due_dt,
    "sync_calendar": True,
    "status": "published"
}
res = client.post('/api/assignments', json=new_asg, headers=headers)
print("Create status:", res.status_code, "ID:", res.json().get('id'))
assert res.status_code == 201
created = res.json()
asg_id = created['id']
cal_id = created['calendar_event_id']
assert cal_id is not None, "Expected calendar_event_id to be populated"
print(f"Calendar Event ID linked: {cal_id}")

# Verify calendar_events record exists in DB
with db() as conn:
    cal_row = conn.execute("SELECT title, event_type FROM calendar_events WHERE id = %s", (cal_id,)).fetchone()
print("Persisted Calendar Event:", cal_row)
assert cal_row is not None
assert cal_row[1] == 'homework'

print("4. Testing GET /api/assignments/{id} with submissions...")
res = client.get(f'/api/assignments/{asg_id}', headers=headers)
assert res.status_code == 200
detail = res.json()
submissions = detail['submissions']
print(f"Submissions count: {len(submissions)}")
assert len(submissions) > 0
student_to_grade = submissions[0]['student_id']

print("5. Testing POST /api/assignments/{id}/grade...")
grade_payload = {
    "student_id": student_to_grade,
    "score": 94.5,
    "feedback": "Outstanding work on the upstream/downstream speed problem!"
}
res = client.post(f'/api/assignments/{asg_id}/grade', json=grade_payload, headers=headers)
print("Grade status:", res.status_code, res.json())
assert res.status_code == 200
assert res.json()['status'] == 'graded'
assert res.json()['score'] == 94.5

print("6. Testing PUT /api/assignments/{id} (Update)...")
update_payload = {"title": "Pair of Linear Equations: Word Problems (Updated)", "total_points": 80.0}
res = client.put(f'/api/assignments/{asg_id}', json=update_payload, headers=headers)
assert res.status_code == 200
assert res.json()['title'] == update_payload['title']
assert res.json()['total_points'] == 80.0

print("7. Testing DELETE /api/assignments/{id} (and cascading calendar event)...")
res = client.delete(f'/api/assignments/{asg_id}', headers=headers)
assert res.status_code == 200

# Verify deletion from DB
with db() as conn:
    asg_check = conn.execute("SELECT id FROM assignments WHERE id = %s", (asg_id,)).fetchone()
    cal_check = conn.execute("SELECT id FROM calendar_events WHERE id = %s", (cal_id,)).fetchone()
assert asg_check is None
assert cal_check is None
print("Assignment and Calendar event deletion verified from DB.")

print("\n*** ALL MILESTONE 3 BACKEND & DATABASE TESTS PASSED! ***")
