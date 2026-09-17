import sys
import os

backend_path = r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend'
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from main import app
from core import db, q, issue_token
from datetime import date, timedelta

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

# PART 1: LEARNING RESOURCES
print("\n--- Testing Learning Resources ---")
print("2. Testing GET /api/resources...")
res = client.get('/api/resources', headers=headers)
print("List status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
assert len(res.json()) >= 5
sample = res.json()[0]
print(f"Sample resource: '{sample['title']}', Type: {sample['resource_type']}, Status: {sample['status']}, Assigned: {sample['assigned_sections']}")

print("3. Testing POST /api/resources (Create)...")
new_res = {
    "title": "Trigonometric Identities & Proofs Visual Mindmap",
    "description": "Visual derivation tree of Pythagorean identities sin^2 + cos^2 = 1.",
    "resource_type": "notes",
    "subject_id": sample.get("subject_id"),
    "chapter_id": sample.get("chapter_id"),
    "file_url": "/assets/docs/trig_mindmap.pdf",
    "meta": {"format": "PDF", "pages": 3},
    "assigned_sections": [],
    "status": "ready"
}
res = client.post('/api/resources', json=new_res, headers=headers)
print("Create status:", res.status_code, res.json())
assert res.status_code == 201
created_id = res.json()["id"]

print("4. Testing POST /api/resources/{id}/assign (Classroom Assignment)...")
assign_payload = {"section_names": ["10-A", "10-B"], "action": "assign"}
res = client.post(f'/api/resources/{created_id}/assign', json=assign_payload, headers=headers)
print("Assign status:", res.status_code, res.json())
assert res.status_code == 200
assert "10-A" in res.json()["assigned_sections"]
assert res.json()["resource_status"] == "assigned"

print("5. Testing GET /api/resources/{id}...")
res = client.get(f'/api/resources/{created_id}', headers=headers)
assert res.status_code == 200
assert res.json()["title"] == new_res["title"]

print("6. Testing PUT /api/resources/{id}...")
res = client.put(f'/api/resources/{created_id}', json={"title": "Trigonometric Identities (Updated)"}, headers=headers)
assert res.status_code == 200

print("7. Testing DELETE /api/resources/{id}...")
res = client.delete(f'/api/resources/{created_id}', headers=headers)
assert res.status_code == 200
print("Learning resources CRUD verified successfully!")

# PART 2: STUDENT ATTENDANCE
print("\n--- Testing Student Attendance ---")
today_str = date.today().isoformat()
print(f"8. Testing GET /api/attendance for section 10-A on {today_str}...")
res = client.get(f'/api/attendance?section_name=10-A&attendance_date={today_str}', headers=headers)
print("Attendance status:", res.status_code, "Total students:", res.json()["total_students"], "Is saved:", res.json()["is_saved"])
assert res.status_code == 200
att_data = res.json()
assert len(att_data["records"]) >= 10

print("9. Testing POST /api/attendance (Mark & Save Register)...")
records = att_data["records"]
# reset all to present first, then mark one absent and one late
for r in records:
    r["status"] = "present"
    r["note"] = ""

records[1]["status"] = "absent"
records[1]["note"] = "Doctor appointment"
records[2]["status"] = "late"
records[2]["note"] = "Arrived 15 mins late"

save_payload = {
    "section_name": "10-A",
    "attendance_date": today_str,
    "records": records
}
res = client.post('/api/attendance', json=save_payload, headers=headers)
print("Save attendance status:", res.status_code, res.json())
assert res.status_code == 200
assert res.json()["absent_count"] == 1
assert res.json()["late_count"] == 1
assert res.json()["present_count"] == len(records) - 2

print("10. Testing GET /api/attendance after saving...")
res = client.get(f'/api/attendance?section_name=10-A&attendance_date={today_str}', headers=headers)
assert res.status_code == 200
assert res.json()["is_saved"] is True
assert res.json()["absent_count"] == 1
print("Persisted attendance verified!")

print("11. Testing GET /api/attendance/summary...")
res = client.get('/api/attendance/summary?section_name=10-A', headers=headers)
print("Summary status:", res.status_code, "Avg rate:", res.json()["average_rate"], "Sessions:", res.json()["total_sessions"])
assert res.status_code == 200
assert res.json()["total_sessions"] >= 1

print("\n*** ALL MILESTONE 5 BACKEND & DATABASE TESTS PASSED! ***\n")
