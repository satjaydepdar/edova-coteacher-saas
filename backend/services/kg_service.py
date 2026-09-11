import os
import glob
import logging
from typing import List, Dict, Set, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Body
from schemas.kg_schemas import (
    ChapterKnowledgeGraph,
    GraphValidationResult,
    PrerequisiteCheckResponse,
    PrerequisiteCheckPayload,
    ConceptNode,
)
from services.kg_compiler import (
    MarkdownKGParser,
    KnowledgeGraphValidator,
    KnowledgeGraphEngine,
)

logger = logging.getLogger("edova.kg_service")

router = APIRouter(prefix="/api/kg", tags=["Knowledge Graph Engine"])

# In-memory storage for compiled chapter graphs
COMPILED_GRAPHS: Dict[str, ChapterKnowledgeGraph] = {}
GRAPH_ENGINES: Dict[str, KnowledgeGraphEngine] = {}

def find_and_load_all_graphs():
    global COMPILED_GRAPHS, GRAPH_ENGINES
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kg_root_dir = os.path.join(backend_dir, "data", "curriculum_knowledge_graph")

    if not os.path.exists(kg_root_dir):
        logger.warning(f"Knowledge Graph directory not found at {kg_root_dir}")
        return

    parser = MarkdownKGParser()
    validator = KnowledgeGraphValidator()

    for md_file in glob.glob(os.path.join(kg_root_dir, "**", "*.md"), recursive=True):
        try:
            graph = parser.parse_file(md_file)
            validation = validator.validate(graph)
            graph.validation = validation
            COMPILED_GRAPHS[graph.chapter_id] = graph
            GRAPH_ENGINES[graph.chapter_id] = KnowledgeGraphEngine(graph)
            logger.info(f"Loaded Knowledge Graph for chapter: {graph.chapter_id} ({len(graph.nodes)} concepts)")
        except Exception as ex:
            logger.error(f"Error compiling KG from {md_file}: {ex}")

# Pre-load graphs on module import
find_and_load_all_graphs()

@router.get("/chapters", response_model=List[ChapterKnowledgeGraph])
async def list_all_compiled_chapters():
    """
    Returns all compiled knowledge graphs with validation and topological roadmaps.
    """
    if not COMPILED_GRAPHS:
        find_and_load_all_graphs()
    return list(COMPILED_GRAPHS.values())

@router.get("/chapter/{chapter_id}", response_model=ChapterKnowledgeGraph)
async def get_chapter_knowledge_graph(chapter_id: str):
    """
    Retrieves full compiled Knowledge Graph for a specific chapter.
    """
    if not COMPILED_GRAPHS:
        find_and_load_all_graphs()
    graph = COMPILED_GRAPHS.get(chapter_id)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Knowledge Graph for chapter '{chapter_id}' not found.")
    return graph

@router.post("/check-prerequisites", response_model=PrerequisiteCheckResponse)
async def check_student_prerequisites(payload: PrerequisiteCheckPayload):
    """
    Real-time O(1) prerequisite readiness check and Hermes remedial question trigger.
    """
    if not GRAPH_ENGINES:
        find_and_load_all_graphs()
    engine = GRAPH_ENGINES.get(payload.chapter_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Knowledge Graph Engine for '{payload.chapter_id}' not loaded.")
    
    mastered_set = set(payload.mastered_concept_ids)
    return engine.check_readiness(payload.target_concept_id, mastered_set)

@router.post("/recompile", response_model=Dict[str, Any])
async def trigger_recompile():
    """
    Re-scans all curriculum markdown files, validates graph integrity, and reloads in-memory cache.
    """
    find_and_load_all_graphs()
    return {
        "status": "success",
        "loaded_chapters": list(COMPILED_GRAPHS.keys()),
        "total_chapters": len(COMPILED_GRAPHS)
    }
