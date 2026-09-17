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

if not row:
    print("ERROR: No teacher found")
    sys.exit(1)

user_id, email, tenant_id, role = str(row[0]), row[1], str(row[2]), row[3]
print(f"Teacher found: {email}, ID: {user_id}, Tenant: {tenant_id}")

token = issue_token(user_id)
headers = {'Authorization': f'Bearer {token}'}

print("3. Testing GET /api/calendar/events...")
res = client.get('/api/calendar/events', headers=headers)
print("Events status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200

print("4. Testing POST /api/calendar/events...")
new_event = {
    'title': 'Test Lesson: Quadratic Equations Mastery',
    'description': 'Integration test event for milestone 1',
    'event_type': 'class',
    'start_at': datetime.now(timezone.utc).isoformat(),
    'end_at': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
    'all_day': False,
    'location': 'Smart Classroom 101'
}
res = client.post('/api/calendar/events', json=new_event, headers=headers)
print("POST status:", res.status_code, "Response:", res.json())
assert res.status_code == 201
created_id = res.json()['id']

print("5. Verifying DB Persistence...")
with db() as conn:
    persisted = conn.execute('SELECT title, location FROM calendar_events WHERE id = %s', (created_id,)).fetchone()
print("Persisted in DB:", persisted)
assert persisted[0] == new_event['title']
assert persisted[1] == new_event['location']

print("6. Testing DELETE /api/calendar/events/{id}...")
res = client.delete(f'/api/calendar/events/{created_id}', headers=headers)
print("DELETE status:", res.status_code)
assert res.status_code == 200

with db() as conn:
    deleted_check = conn.execute('SELECT id FROM calendar_events WHERE id = %s', (created_id,)).fetchone()
assert deleted_check is None
print("Deletion verified from DB.")

print("7. Testing GET /api/syllabus/pacing...")
res = client.get('/api/syllabus/pacing', headers=headers)
print("GET syllabus pacing status:", res.status_code, res.json())
assert res.status_code == 200

print("8. Testing POST /api/syllabus/pacing/toggle (mark complete)...")
toggle_payload = {'topic_id': 'topic-1-1-1', 'is_completed': True}
res = client.post('/api/syllabus/pacing/toggle', json=toggle_payload, headers=headers)
print("Toggle status:", res.status_code, res.json())
assert res.status_code == 200
assert res.json()['is_completed'] is True

with db() as conn:
    pacing_row = conn.execute(
        'SELECT topic_id, is_completed FROM section_syllabus_pacing WHERE topic_id = %s AND tenant_id = %s',
        ('topic-1-1-1', tenant_id)
    ).fetchone()
print("Persisted pacing row:", pacing_row)
assert pacing_row[1] is True

print("9. Testing POST /api/syllabus/pacing/toggle (reset to incomplete)...")
toggle_payload = {'topic_id': 'topic-1-1-1', 'is_completed': False}
res = client.post('/api/syllabus/pacing/toggle', json=toggle_payload, headers=headers)
print("Toggle status:", res.status_code, res.json())
assert res.status_code == 200
assert res.json()['is_completed'] is False

print("\n*** ALL BACKEND & DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY! ***")
