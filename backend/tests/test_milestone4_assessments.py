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

print("2. Testing GET /api/assessments...")
res = client.get('/api/assessments', headers=headers)
print("List status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
assert len(res.json()) >= 3
sample = res.json()[0]
print(f"Sample assessment: '{sample['title']}', Blueprint: {sample['blueprint_type']}, Questions: {sample['question_count']}, Marks: {sample['total_marks']}, Difficulty: {sample['difficulty_spread']}")

print("3. Testing POST /api/assessments (Create)...")
new_test = {
    "title": "Unit 3 & 4 Periodic Assessment: Geometry & Coordinate Geometry",
    "subject": "Mathematics",
    "class_label": "Class 10",
    "section_name": "10-A",
    "blueprint_type": "periodic_40m",
    "duration_minutes": 90,
    "total_marks": 40,
    "instructions": "All questions are compulsory. Use of calculators is not permitted.",
    "sections": [
        {
            "section_id": "sec-a",
            "name": "Section A",
            "type": "mcq",
            "marks_per_q": 1,
            "instructions": "1 mark MCQs",
            "questions": [
                {
                    "id": "q-1",
                    "text": "The distance of the point P(-6, 8) from the origin is:",
                    "options": [
                        {"key": "A", "text": "8", "correct": False},
                        {"key": "B", "text": "2*sqrt(7)", "correct": False},
                        {"key": "C", "text": "10", "correct": True},
                        {"key": "D", "text": "6", "correct": False}
                    ],
                    "difficulty": "Easy",
                    "bloom": "Remember",
                    "marks": 1
                }
            ]
        },
        {
            "section_id": "sec-b",
            "name": "Section B",
            "type": "short_answer_1",
            "marks_per_q": 2,
            "instructions": "2 marks each",
            "questions": [
                {
                    "id": "q-2",
                    "text": "Find the ratio in which the y-axis divides the line segment joining the points (5, -6) and (-1, -4).",
                    "difficulty": "Medium",
                    "bloom": "Apply",
                    "rubric": "1 mark for setting x-coordinate to 0; 1 mark for ratio 5:1.",
                    "marks": 2
                }
            ]
        }
    ],
    "status": "draft"
}
res = client.post('/api/assessments', json=new_test, headers=headers)
print("Create status:", res.status_code, "ID:", res.json().get('id'))
assert res.status_code == 201
created = res.json()
test_id = created['id']
assert created['title'] == new_test['title']
assert created['total_marks'] == 40
assert len(created['sections']) == 2

print("4. Testing GET /api/assessments/{id}...")
res = client.get(f'/api/assessments/{test_id}', headers=headers)
assert res.status_code == 200
assert res.json()['duration_minutes'] == 90

print("5. Testing PUT /api/assessments/{id}...")
update_payload = {
    "title": "Unit 3 & 4 Periodic Assessment: Geometry (Updated)",
    "status": "ready"
}
res = client.put(f'/api/assessments/{test_id}', json=update_payload, headers=headers)
assert res.status_code == 200
assert res.json()['title'] == update_payload['title']
assert res.json()['status'] == 'ready'

print("6. Testing POST /api/assessments/{id}/schedule (Calendar Exam Sync)...")
exam_date = (date.today() + timedelta(days=14)).isoformat()
sched_payload = {
    "scheduled_date": exam_date,
    "start_time": "10:00",
    "location": "Auditorium Hall 1"
}
res = client.post(f'/api/assessments/{test_id}/schedule', json=sched_payload, headers=headers)
print("Schedule status:", res.status_code, "Calendar ID:", res.json().get('calendar_event_id'))
assert res.status_code == 200
cal_id = res.json()['calendar_event_id']
assert cal_id is not None

# Verify calendar_events record in DB
with db() as conn:
    cal_row = conn.execute("SELECT title, event_type, location FROM calendar_events WHERE id = %s", (cal_id,)).fetchone()
print("Persisted Calendar Event:", cal_row)
assert cal_row is not None
assert cal_row[1] == 'exam'
assert "Auditorium Hall 1" in cal_row[2]

print("7. Testing DELETE /api/assessments/{id}...")
res = client.delete(f'/api/assessments/{test_id}', headers=headers)
assert res.status_code == 200

# Verify deletion from DB
with db() as conn:
    test_check = conn.execute("SELECT id FROM assessments WHERE id = %s", (test_id,)).fetchone()
    cal_check = conn.execute("SELECT id FROM calendar_events WHERE id = %s", (cal_id,)).fetchone()
assert test_check is None
assert cal_check is None
print("Assessment and calendar exam event verified deleted from DB.")

print("\n*** ALL MILESTONE 4 BACKEND & DATABASE TESTS PASSED! ***")
