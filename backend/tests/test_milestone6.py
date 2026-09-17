import sys
import os

backend_path = r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend'
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from main import app
from core import db, q, issue_token

client = TestClient(app)

print("1. Fetching active Student account...")
with db() as conn:
    row = conn.execute("""
        SELECT u.id, u.email, utm.tenant_id, utm.role 
        FROM users u 
        JOIN user_tenant_mappings utm ON u.id = utm.user_id 
        WHERE utm.role = 'STUDENT' 
          AND utm.tenant_id IN (SELECT DISTINCT tenant_id FROM assignments)
        LIMIT 1
    """).fetchone()

assert row is not None, "No student account found"
user_id, email, tenant_id, role = str(row[0]), row[1], str(row[2]), row[3]
print(f"Student found: {email}, Tenant: {tenant_id}")

token = issue_token(user_id)
headers = {'Authorization': f'Bearer {token}'}

print("\n2. Testing GET /api/student/study-plan...")
res = client.get('/api/student/study-plan', headers=headers)
print("Study plan status:", res.status_code, res.json())
assert res.status_code == 200
plan_data = res.json()
assert "xp" in plan_data
assert "streak_days" in plan_data
assert "urgent_tasks" in plan_data
assert "recommended_tasks" in plan_data
print(f"Student XP: {plan_data['xp']}, Streak: {plan_data['streak_days']} days, Urgent tasks: {len(plan_data['urgent_tasks'])}, Recommended: {len(plan_data['recommended_tasks'])}")

print("\n3. Testing GET /api/student/assignments...")
res = client.get('/api/student/assignments', headers=headers)
print("Assignments status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
assignments = res.json()
assert len(assignments) >= 1
first_assign = assignments[0]
print(f"First assignment: '{first_assign['title']}', Type: {first_assign['type']}, Points: {first_assign['total_points']}, Status: {first_assign['submission_status']}")

print("\n4. Testing POST /api/student/assignments/{id}/submit (Quiz Runner)...")
submit_payload = {
    "submission_type": "quiz",
    "answers": [
        {"question_id": "q1", "selected": "A"},
        {"question_id": "q2", "selected": "B"},
        {"question_id": "q3", "selected": "Option A"}
    ]
}
res = client.post(f"/api/student/assignments/{first_assign['id']}/submit", json=submit_payload, headers=headers)
print("Submit quiz status:", res.status_code, res.json())
assert res.status_code == 200
sub_res = res.json()
assert sub_res["status"] == "ok"
assert "score" in sub_res
assert "xp_awarded" in sub_res
print(f"Score awarded: {sub_res['score']} / {sub_res['max_score']}, Correct: {sub_res['correct_count']}")

print("\n5. Testing GET /api/student/mistakes (Mistake Journal)...")
res = client.get('/api/student/mistakes', headers=headers)
print("Mistakes status:", res.status_code, "Count:", len(res.json()))
assert res.status_code == 200
mistakes = res.json()
assert len(mistakes) >= 1
sample_mistake = mistakes[0]
print(f"Sample mistake: Chapter '{sample_mistake['chapter']}', Q: '{sample_mistake['question']}', Status: {sample_mistake['status']}")

print("\n6. Testing POST /api/student/mistakes/{id}/resolve (Mastery Fix)...")
res = client.post(f"/api/student/mistakes/{sample_mistake['id']}/resolve", headers=headers)
print("Resolve status:", res.status_code, res.json())
assert res.status_code == 200
assert res.json()["status"] == "ok"
assert res.json()["xp_awarded"] == 20

print("\n7. Testing GET /api/student/heatmap (Mastery Matrix)...")
res = client.get('/api/student/heatmap', headers=headers)
print("Heatmap status:", res.status_code, "Subjects:", len(res.json()))
assert res.status_code == 200
heatmap = res.json()
assert len(heatmap) >= 3
print("Subjects in heatmap:", [s["subject"] for s in heatmap])

print("\n8. Testing GET /api/student/wiki & POST /api/student/wiki (Study Wiki)...")
new_note = {
    "chapter_name": "Arithmetic Progressions",
    "topic_name": "nth term of an AP",
    "note_type": "formula",
    "content": "General term of an AP with first term a and common difference d is given by: an = a + (n - 1)d."
}
res = client.post('/api/student/wiki', json=new_note, headers=headers)
print("Add wiki note status:", res.status_code, res.json())
assert res.status_code == 201

res = client.get('/api/student/wiki', headers=headers)
assert res.status_code == 200
wiki_notes = res.json()
assert len(wiki_notes) >= 4
print(f"Total Wiki notes: {len(wiki_notes)}, Latest: '{wiki_notes[0]['content'][:60]}...'")

print("\n*** ALL MILESTONE 6 BACKEND & DATABASE TESTS PASSED! ***\n")
