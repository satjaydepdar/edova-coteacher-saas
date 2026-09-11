import os
import pytest
from kg_schemas import ConceptNode, ChapterKnowledgeGraph, GraphValidationResult
from kg_compiler import MarkdownKGParser, KnowledgeGraphValidator, KnowledgeGraphEngine

SAMPLE_VALID_MARKDOWN = """---
subject_id: "mathematics"
subject_name: "Mathematics"
chapter_id: "chapter-05-arithmetic-progressions"
chapter_number: 5
chapter_title: "Arithmetic Progressions"
grade_level: "Class 10 (NCERT / CBSE)"
total_concepts: 3
version: "1.0.0"
---

# Chapter 5: Arithmetic Progressions

| Concept ID | Concept Name | Learning Goal | Must Know Before | Unlocks Next | Common Mistake | Hermes Socratic Guiding Question | Key Formula / Rule |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **AP-01** | **Number Patterns & Sequences** | Students recognize sequences. | Basic Arithmetic Operations | Definition of an AP | Confusing doubling with adding | Look at the jump. | $a_1, a_2$ |
| **AP-02** | **Definition of an AP** | Students define an AP. | AP-01 | Common Difference | Changing increments | Does every pair have same step? | $a_{k+1} = a_k + d$ |
| **AP-03** | **Common Difference (d)** | Students calculate d. | AP-02 | nth Term Formula | Subtracting backwards | Always subtract earlier from later. | $d = a_{k+1} - a_k$ |
"""

SAMPLE_CYCLIC_MARKDOWN = """---
subject_id: "mathematics"
subject_name: "Mathematics"
chapter_id: "chapter-05-arithmetic-progressions"
chapter_number: 5
chapter_title: "Arithmetic Progressions"
total_concepts: 3
---

| Concept ID | Concept Name | Learning Goal | Must Know Before | Unlocks Next | Common Mistake | Hermes Socratic Guiding Question | Key Formula / Rule |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **AP-01** | **Concept 1** | Goal 1 | AP-03 | AP-02 | None | Prompt 1 | Form 1 |
| **AP-02** | **Concept 2** | Goal 2 | AP-01 | AP-03 | None | Prompt 2 | Form 2 |
| **AP-03** | **Concept 3** | Goal 3 | AP-02 | AP-01 | None | Prompt 3 | Form 3 |
"""

SAMPLE_DANGLING_MARKDOWN = """---
subject_id: "mathematics"
subject_name: "Mathematics"
chapter_id: "chapter-05-arithmetic-progressions"
chapter_number: 5
chapter_title: "Arithmetic Progressions"
total_concepts: 2
---

| Concept ID | Concept Name | Learning Goal | Must Know Before | Unlocks Next | Common Mistake | Hermes Socratic Guiding Question | Key Formula / Rule |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **AP-01** | **Concept 1** | Goal 1 | None | AP-02 | None | Prompt 1 | Form 1 |
| **AP-02** | **Concept 2** | Goal 2 | AP-99 | None | None | Prompt 2 | Form 2 |
"""

def test_parse_frontmatter_and_table():
    parser = MarkdownKGParser()
    kg = parser.parse_markdown_text(SAMPLE_VALID_MARKDOWN)
    
    assert kg.subject_id == "mathematics"
    assert kg.chapter_number == 5
    assert len(kg.nodes) == 3
    assert "AP-01" in kg.nodes
    assert "AP-02" in kg.nodes
    assert "AP-03" in kg.nodes
    assert kg.nodes["AP-01"].name == "Number Patterns & Sequences"
    assert kg.nodes["AP-02"].prerequisites == ["AP-01"]
    assert kg.nodes["AP-03"].prerequisites == ["AP-02"]

def test_graph_validation_success_and_topological_sort():
    parser = MarkdownKGParser()
    kg = parser.parse_markdown_text(SAMPLE_VALID_MARKDOWN)
    
    validator = KnowledgeGraphValidator()
    result = validator.validate(kg)
    
    assert result.is_valid is True
    assert len(result.errors) == 0
    assert result.topological_order == ["AP-01", "AP-02", "AP-03"]

def test_cycle_detection_failure():
    parser = MarkdownKGParser()
    kg = parser.parse_markdown_text(SAMPLE_CYCLIC_MARKDOWN)
    
    validator = KnowledgeGraphValidator()
    result = validator.validate(kg)
    
    assert result.is_valid is False
    assert any("Cycle detected" in err for err in result.errors)

def test_dangling_reference_detection():
    parser = MarkdownKGParser()
    kg = parser.parse_markdown_text(SAMPLE_DANGLING_MARKDOWN)
    
    validator = KnowledgeGraphValidator()
    result = validator.validate(kg)
    
    assert result.is_valid is False
    assert any("Dangling prerequisite reference" in err for err in result.errors)

def test_engine_prerequisite_check_and_remedial():
    parser = MarkdownKGParser()
    kg = parser.parse_markdown_text(SAMPLE_VALID_MARKDOWN)
    engine = KnowledgeGraphEngine(kg)
    
    mastered = set()
    res = engine.check_readiness("AP-03", mastered)
    assert res.is_ready is False
    assert "AP-02" in res.missing_prerequisites or "AP-01" in res.missing_prerequisites
    assert res.remedial_question is not None
    
    mastered = {"AP-01", "AP-02"}
    res2 = engine.check_readiness("AP-03", mastered)
    assert res2.is_ready is True
    assert len(res2.missing_prerequisites) == 0

def test_compile_live_arithmetic_progression_kg_file():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    ap_kg_path = os.path.join(
        backend_dir,
        "data",
        "curriculum_knowledge_graph",
        "chapter_05_arithmetic_progressions",
        "arithmetic_progression_kg.md"
    )
    
    assert os.path.exists(ap_kg_path), f"File not found: {ap_kg_path}"
    
    parser = MarkdownKGParser()
    kg = parser.parse_file(ap_kg_path)
    
    assert kg.chapter_number == 5
    assert len(kg.nodes) == 23, f"Expected 23 concepts, found {len(kg.nodes)}"
    
    validator = KnowledgeGraphValidator()
    validation = validator.validate(kg)
    
    assert validation.is_valid is True, f"Validation failed with errors: {validation.errors}"
    assert len(validation.topological_order) == 23
    assert validation.topological_order[0] == "AP-01"

def test_fastapi_kg_endpoints():
    from fastapi.testclient import TestClient
    from main import app
    
    client = TestClient(app)
    
    # 1. Test listing all chapters
    resp = client.get("/api/kg/chapters")
    assert resp.status_code == 200
    chapters = resp.json()
    assert isinstance(chapters, list)
    assert len(chapters) >= 1
    
    ap_ch = next((c for c in chapters if c["chapter_id"] == "chapter-05-arithmetic-progressions"), None)
    assert ap_ch is not None
    assert ap_ch["total_concepts"] == 23
    assert ap_ch["validation"]["is_valid"] is True
    
    # 2. Test checking prerequisites via endpoint
    payload = {
        "chapter_id": "chapter-05-arithmetic-progressions",
        "target_concept_id": "AP-05",
        "mastered_concept_ids": ["AP-01", "AP-03"]
    }
    prereq_resp = client.post("/api/kg/check-prerequisites", json=payload)
    assert prereq_resp.status_code == 200
    prereq_data = prereq_resp.json()
    assert prereq_data["concept_id"] == "AP-05"
    assert prereq_data["is_ready"] is True
