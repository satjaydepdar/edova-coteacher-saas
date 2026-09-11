import pytest
from fastapi.testclient import TestClient
from main import app
from teacher_analytics import teacher_analytics_service

@pytest.fixture
def client():
    return TestClient(app)

def test_record_student_events_and_heatmap_calculation(client):
    """
    Simulate 10 students in class-10A practicing Chapter 5 (Arithmetic Progressions).
    Verify that concept heatmaps, mastery counts, and struggling rates calculate accurately.
    """
    classroom_id = "class-10a"
    chapter_id = "chapter-05-arithmetic-progressions"

    # Reset/clear previous test state
    teacher_analytics_service.reset_classroom_state(classroom_id)

    # 8 students master AP-01 (80% mastery)
    for i in range(1, 9):
        client.post("/api/teacher/telemetry/record-mastery", json={
            "classroom_id": classroom_id,
            "student_id": f"student_{i}",
            "student_name": f"Student {i}",
            "chapter_id": chapter_id,
            "concept_id": "AP-01",
            "event_type": "mastery"
        })

    # 6 students struggle with AP-05 (Common Difference negative signs)
    for i in range(1, 7):
        client.post("/api/teacher/telemetry/record-mastery", json={
            "classroom_id": classroom_id,
            "student_id": f"student_{i}",
            "student_name": f"Student {i}",
            "chapter_id": chapter_id,
            "concept_id": "AP-05",
            "event_type": "struggle",
            "error_detail": "Subtracted backwards a1 - a2 resulting in wrong positive d"
        })

    # Fetch real-time classroom heatmap
    resp = client.get(f"/api/teacher/classroom/{classroom_id}/heatmap/{chapter_id}")
    assert resp.status_code == 200
    data = resp.json()

    assert data["classroom_id"] == classroom_id
    assert data["chapter_id"] == chapter_id
    assert len(data["concept_heatmaps"]) == 23

    # Check AP-01 node
    ap01 = next(c for c in data["concept_heatmaps"] if c["concept_id"] == "AP-01")
    assert ap01["mastered_count"] == 8
    assert ap01["status"] == "mastered"

    # Check AP-05 node (Struggling Hotspot)
    ap05 = next(c for c in data["concept_heatmaps"] if c["concept_id"] == "AP-05")
    assert ap05["struggling_count"] == 6
    assert ap05["status"] == "struggling-hotspot"

def test_bottleneck_detection_and_alerts(client):
    """
    Verify that when struggling percentage on a concept exceeds 30%, a high-priority
    BottleneckAlert is automatically generated for the teacher.
    """
    classroom_id = "class-10a"
    chapter_id = "chapter-05-arithmetic-progressions"

    resp = client.get(f"/api/teacher/classroom/{classroom_id}/heatmap/{chapter_id}")
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["bottleneck_alerts"]) >= 1
    alert_05 = next((a for a in data["bottleneck_alerts"] if a["concept_id"] == "AP-05"), None)
    assert alert_05 is not None
    assert alert_05["severity"] == "HIGH"
    assert "Common Difference" in alert_05["concept_name"]

def test_student_intervention_queue(client):
    """
    Verify that individual students struggling with concepts appear in the teacher's
    intervention queue with actionable Socratic prompts.
    """
    classroom_id = "class-10a"
    chapter_id = "chapter-05-arithmetic-progressions"

    resp = client.get(f"/api/teacher/classroom/{classroom_id}/heatmap/{chapter_id}")
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["intervention_queue"]) >= 1
    first_stuck = data["intervention_queue"][0]
    assert first_stuck["stuck_concept_id"] == "AP-05"
    assert len(first_stuck["suggested_teacher_prompt"]) > 10
