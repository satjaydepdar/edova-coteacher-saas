import pytest
from fastapi.testclient import TestClient
from main import app
from socratic_service import gemini_socratic_service

@pytest.fixture
def client():
    return TestClient(app)

def test_hermes_prerequisite_backtracking(client):
    """
    When student asks question on AP-05 (Common Difference) without mastering prerequisites (AP-01/AP-03),
    Hermes detects missing prerequisites and replies Socratically with the prerequisite building block prompt.
    """
    payload = {
        "message": "How do I calculate the difference d?",
        "simulation_id": "ap-sim-1",
        "chapter_id": "chapter-05-arithmetic-progressions",
        "concept_id": "AP-05",
        "mastered_concept_ids": [] # No prerequisites mastered yet
    }
    
    resp = client.post("/api/socratic/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["concept_id"] == "AP-05"
    assert data["is_ready"] is False
    assert len(data["missing_prerequisites"]) > 0
    assert "AP-03" in data["missing_prerequisites"] or "AP-01" in data["missing_prerequisites"]
    assert data["remedial_concept_id"] is not None
    assert len(data["reply"]) > 10

def test_hermes_ready_concept_with_pitfall(client):
    """
    When prerequisites are mastered but student triggers a known pitfall on AP-05 (subtracting backwards),
    Hermes flags the pitfall and provides the exact remedial guidance.
    """
    payload = {
        "message": "I subtracted backwards and got positive 3 instead of -3",
        "simulation_id": "ap-sim-1",
        "chapter_id": "chapter-05-arithmetic-progressions",
        "concept_id": "AP-05",
        "mastered_concept_ids": ["AP-01", "AP-03"] # Prerequisites mastered
    }
    
    resp = client.post("/api/socratic/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["concept_id"] == "AP-05"
    assert data["is_ready"] is True
    assert data["missing_prerequisites"] == []
    assert "subtract" in data["reply"].lower() or "earlier" in data["reply"].lower() or "later" in data["reply"].lower() or "decreasing" in data["reply"].lower()

def test_hermes_concept_mastery_next_recommendation(client):
    """
    When student confirms mastery on AP-01, Hermes suggests the next topological concept (AP-02 or AP-03).
    """
    payload = {
        "message": "I understand number patterns now! Each term increases by 5.",
        "simulation_id": "ap-sim-1",
        "chapter_id": "chapter-05-arithmetic-progressions",
        "concept_id": "AP-01",
        "mastered_concept_ids": ["AP-01"]
    }
    
    resp = client.post("/api/socratic/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["is_ready"] is True
    assert data["next_recommended_concept"] in ["AP-02", "AP-03"]
    assert "awesome job" in data["reply"].lower()

def test_hermes_long_term_memory_recall(client):
    """
    When student asks to recall previous lessons or concepts (e.g. 'Remind me how we did AP-05 earlier'),
    Hermes activates the Long-Term Memory Recall engine and returns pedagogical historical insights.
    """
    payload = {
        "message": "Remind me how we calculated common difference on AP-05 earlier?",
        "simulation_id": "ap-sim-1",
        "chapter_id": "chapter-05-arithmetic-progressions",
        "concept_id": "AP-05"
    }
    
    resp = client.post("/api/socratic/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    
    assert "Long-Term Memory Recall" in data["reply"]
    assert "negative" in data["reply"].lower()
    assert "a2" in data["reply"].lower() or "a_2" in data["reply"].lower() or "a₂" in data["reply"].lower()
