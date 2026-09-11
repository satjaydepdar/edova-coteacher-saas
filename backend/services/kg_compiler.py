import os
import re
import logging
from typing import Dict, List, Set, Optional, Tuple, Any
from collections import defaultdict, deque
from schemas.kg_schemas import (
    ConceptNode,
    ChapterKnowledgeGraph,
    GraphValidationResult,
    PrerequisiteCheckResponse,
)

logger = logging.getLogger("edova.kg_compiler")

class MarkdownKGParser:
    """
    High-performance Markdown parser for Curriculum Knowledge Graphs.
    Extracts YAML frontmatter, concept tables, and dependency relations.
    """

    def parse_file(self, file_path: str) -> ChapterKnowledgeGraph:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return self.parse_markdown_text(content)

    def parse_markdown_text(self, markdown_text: str) -> ChapterKnowledgeGraph:
        frontmatter = self._extract_frontmatter(markdown_text)
        nodes = self._extract_concept_table(markdown_text)
        mermaid_edges = self._extract_mermaid_edges(markdown_text)

        subject_id = frontmatter.get("subject_id", "mathematics")
        subject_name = frontmatter.get("subject_name", "Mathematics")
        chapter_id = frontmatter.get("chapter_id", "chapter-01")
        chapter_number = int(frontmatter.get("chapter_number", 1))
        chapter_title = frontmatter.get("chapter_title", "Chapter")
        grade_level = frontmatter.get("grade_level", "Class 10")
        total_concepts = len(nodes)

        # Merge Mermaid edges with table prerequisites
        for src, dst in mermaid_edges:
            if dst in nodes and src in nodes:
                if src not in nodes[dst].prerequisites:
                    nodes[dst].prerequisites.append(src)
                if dst not in nodes[src].unlocks_next:
                    nodes[src].unlocks_next.append(dst)

        # Construct basic adjacency lists
        adjacency_list: Dict[str, List[str]] = {node_id: [] for node_id in nodes}
        reverse_adjacency: Dict[str, List[str]] = {node_id: [] for node_id in nodes}

        for node_id, node in nodes.items():
            for prereq in node.prerequisites:
                if prereq in nodes:
                    if node_id not in adjacency_list[prereq]:
                        adjacency_list[prereq].append(node_id)
                    if prereq not in reverse_adjacency[node_id]:
                        reverse_adjacency[node_id].append(prereq)

        return ChapterKnowledgeGraph(
            subject_id=subject_id,
            subject_name=subject_name,
            chapter_id=chapter_id,
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            grade_level=grade_level,
            total_concepts=total_concepts,
            nodes=nodes,
            adjacency_list=adjacency_list,
            reverse_adjacency=reverse_adjacency,
        )

    def _extract_mermaid_edges(self, text: str) -> List[Tuple[str, str]]:
        edges = []
        # Find mermaid code block
        mermaid_match = re.search(r"```mermaid\s*\n(.*?)```", text, re.DOTALL)
        if not mermaid_match:
            return edges

        m_content = mermaid_match.group(1)
        for line in m_content.split("\n"):
            line = line.strip()
            if "-->" in line:
                parts = line.split("-->")
                if len(parts) == 2:
                    lhs = parts[0].strip()
                    rhs = parts[1].strip()
                    lhs_ids = self._extract_ids_from_mermaid_part(lhs)
                    rhs_ids = self._extract_ids_from_mermaid_part(rhs)
                    for src in lhs_ids:
                        for dst in rhs_ids:
                            edges.append((src, dst))
        return edges

    def _extract_ids_from_mermaid_part(self, part: str) -> List[str]:
        raw_tokens = re.findall(r"([A-Z]{2,5}-?\d{1,3})", part)
        normalized = []
        for tok in raw_tokens:
            if "-" not in tok and len(tok) >= 4:
                prefix = re.match(r"[A-Z]+", tok).group(0)
                num = tok[len(prefix):]
                tok = f"{prefix}-{num}"
            normalized.append(tok)
        return normalized

    def _extract_frontmatter(self, text: str) -> Dict[str, Any]:
        frontmatter = {}
        fm_match = re.search(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
        if fm_match:
            lines = fm_match.group(1).split("\n")
            for line in lines:
                if ":" in line:
                    key, val = line.split(":", 1)
                    val = val.strip().strip('"').strip("'")
                    if "#" in val:
                        val = val.split("#", 1)[0].strip()
                    frontmatter[key.strip()] = val
        return frontmatter

    def _extract_concept_table(self, text: str) -> Dict[str, ConceptNode]:
        nodes: Dict[str, ConceptNode] = {}
        lines = text.split("\n")

        table_lines = []
        is_table = False

        for line in lines:
            trimmed = line.strip()
            if trimmed.startswith("|") and ("Concept ID" in trimmed or "Concept Name" in trimmed):
                is_table = True
                continue
            if is_table:
                if trimmed.startswith("|:---") or trimmed.startswith("|---"):
                    continue
                if trimmed.startswith("|"):
                    table_lines.append(trimmed)
                elif trimmed == "":
                    continue
                elif not trimmed.startswith("|"):
                    if table_lines:
                        break

        for row in table_lines:
            cols = [c.strip() for c in row.strip("|").split("|")]
            if len(cols) < 5:
                continue

            raw_id = cols[0]
            clean_id = self._clean_markdown(raw_id)
            id_match = re.search(r"[A-Z]{2,5}-\d{1,3}", clean_id)
            node_id = id_match.group(0) if id_match else clean_id

            if not node_id:
                continue

            name = self._clean_markdown(cols[1]) if len(cols) > 1 else ""
            learning_goal = self._clean_markdown(cols[2]) if len(cols) > 2 else ""
            raw_prereqs = cols[3] if len(cols) > 3 else ""
            raw_unlocks = cols[4] if len(cols) > 4 else ""
            common_pitfall = self._clean_markdown(cols[5]) if len(cols) > 5 else None
            hermes_prompt = self._clean_markdown(cols[6]) if len(cols) > 6 else None
            key_formula = cols[7].strip() if len(cols) > 7 else None

            prereq_ids = self._extract_referenced_ids(raw_prereqs)
            unlock_ids = self._extract_referenced_ids(raw_unlocks)

            node = ConceptNode(
                id=node_id,
                name=name,
                topic=f"Chapter Concept: {name}",
                learning_goal=learning_goal,
                prerequisites=prereq_ids,
                unlocks_next=unlock_ids,
                common_pitfall=common_pitfall,
                hermes_guiding_question=hermes_prompt,
                key_formula=key_formula,
            )
            nodes[node_id] = node

        return nodes

    def _clean_markdown(self, s: str) -> str:
        s = s.strip()
        s = re.sub(r"^\*\*|\*\*$", "", s)
        s = re.sub(r"^\*|\*$", "", s)
        s = re.sub(r"^“|”$|^\"|\"$", "", s)
        return s.strip()

    def _extract_referenced_ids(self, text: str) -> List[str]:
        if not text or text.lower() in ("none", "null", "-"):
            return []
        ids = re.findall(r"[A-Z]{2,5}-\d{1,3}", text)
        if ids:
            return ids
        parts = [p.strip() for p in re.split(r"[,;&]", text) if p.strip()]
        return parts


class KnowledgeGraphValidator:
    """
    Validates graph integrity: detects cycles, dangling references, and computes topological order.
    """

    def validate(self, graph: ChapterKnowledgeGraph) -> GraphValidationResult:
        errors: List[str] = []
        warnings: List[str] = []

        all_node_ids = set(graph.nodes.keys())
        total_edges = 0

        # 1. Dangling references check
        for node_id, node in graph.nodes.items():
            for prereq in node.prerequisites:
                if re.match(r"^[A-Z]{2,5}-\d{1,3}$", prereq):
                    if prereq not in all_node_ids:
                        errors.append(f"Dangling prerequisite reference in node '{node_id}': '{prereq}' does not exist.")
                    else:
                        total_edges += 1

        # 2. Cycle Detection via Kahn's Algorithm (Topological Sort)
        in_degree: Dict[str, int] = {node_id: 0 for node_id in all_node_ids}
        adj_list: Dict[str, List[str]] = {node_id: [] for node_id in all_node_ids}

        for node_id, node in graph.nodes.items():
            for prereq in node.prerequisites:
                if prereq in all_node_ids:
                    adj_list[prereq].append(node_id)
                    in_degree[node_id] += 1

        queue = deque(sorted([node_id for node_id, deg in in_degree.items() if deg == 0]))
        topological_order: List[str] = []

        while queue:
            curr = queue.popleft()
            topological_order.append(curr)
            ready_neighbors = []
            for neighbor in sorted(adj_list.get(curr, [])):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    ready_neighbors.append(neighbor)
            for r in ready_neighbors:
                queue.append(r)

        if len(topological_order) != len(all_node_ids):
            unresolved = [n for n, deg in in_degree.items() if deg > 0]
            errors.append(f"Cycle detected in Knowledge Graph! Unresolved cyclic nodes: {unresolved}")

        is_valid = len(errors) == 0

        return GraphValidationResult(
            is_valid=is_valid,
            total_nodes=len(all_node_ids),
            total_edges=total_edges,
            errors=errors,
            warnings=warnings,
            topological_order=topological_order if is_valid else [],
        )


class KnowledgeGraphEngine:
    """
    High-speed in-memory traversal and query engine for Hermes & adaptive learning paths.
    """

    def __init__(self, graph: ChapterKnowledgeGraph):
        self.graph = graph
        self.validator = KnowledgeGraphValidator()
        self.validation_result = self.validator.validate(graph)
        self.graph.validation = self.validation_result

    def check_readiness(self, target_concept_id: str, mastered_concepts: Set[str]) -> PrerequisiteCheckResponse:
        node = self.graph.nodes.get(target_concept_id)
        if not node:
            return PrerequisiteCheckResponse(
                concept_id=target_concept_id,
                is_ready=False,
                missing_prerequisites=[],
                remedial_question="Concept not found in active Knowledge Graph.",
            )

        missing = [p for p in node.prerequisites if p in self.graph.nodes and p not in mastered_concepts]

        if not missing:
            return PrerequisiteCheckResponse(
                concept_id=target_concept_id,
                is_ready=True,
                missing_prerequisites=[],
                next_recommended_concept=target_concept_id,
            )

        primary_missing_id = missing[0]
        primary_missing_node = self.graph.nodes.get(primary_missing_id)
        remedial_question = primary_missing_node.hermes_guiding_question if primary_missing_node else node.hermes_guiding_question

        return PrerequisiteCheckResponse(
            concept_id=target_concept_id,
            is_ready=False,
            missing_prerequisites=missing,
            remedial_question=remedial_question,
            next_recommended_concept=primary_missing_id,
        )

    def get_linear_learning_path(self) -> List[ConceptNode]:
        if not self.validation_result.is_valid:
            return list(self.graph.nodes.values())
        return [self.graph.nodes[cid] for cid in self.validation_result.topological_order if cid in self.graph.nodes]
