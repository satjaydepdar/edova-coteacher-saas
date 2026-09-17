"""Router: extracted from main.py (pure code motion, no behavior change)."""
from collections import defaultdict
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException, Query

from core import (
    DB_DSN,
    current_user_id,
    db,
    q,
    single_tenant_or_raise,
)

router = APIRouter()


# =====================================================================
# Socratic AI Co-Teacher, Knowledge Graph & Teacher Analytics Endpoints
# =====================================================================
try:
    from services.socratic_service import (
        SocraticChatRequest,
        SocraticChatResponse,
        MathSolveRequest,
        MathSolveResponse,
        gemini_socratic_service,
        math_solver_service,
    )
    from services.kg_service import router as kg_router, COMPILED_GRAPHS, find_and_load_all_graphs
    from schemas.teacher_schemas import (
        ClassroomHeatmapResponse,
        RecordMasteryRequest,
    )
    from services.teacher_analytics import teacher_analytics_service

    # Mount Knowledge Graph router (/api/kg/*)
    router.include_router(kg_router)

    # Socratic dialogue & solver endpoints
    @router.post("/api/socratic/chat", response_model=SocraticChatResponse, tags=["Socratic AI Co-Teacher"])
    async def socratic_dialogue(req: SocraticChatRequest):
        """Socratic Co-Teacher Chat endpoint powered by Gemini LLM & heuristic Socratic engine."""
        res = await gemini_socratic_service.get_socratic_response(
            message=req.message,
            simulation_id=req.simulation_id,
            current_step=req.current_step,
            current_slider_val=req.current_slider_val,
            chat_history=req.chat_history,
            chapter_id=req.chapter_id,
            concept_id=req.concept_id,
            mastered_concept_ids=req.mastered_concept_ids,
        )
        return res

    @router.post("/api/socratic/solve", response_model=MathSolveResponse, tags=["Socratic AI Co-Teacher"])
    async def solve_quadratic_math(req: MathSolveRequest):
        """Runtime symbolic quadratic equation solver generating pedagogical derivations."""
        res = math_solver_service.solve_quadratic(
            a=req.a,
            b=req.b,
            c=req.c,
            target_area=req.target_area,
        )
        return res

    @router.post("/api/telemetry/event", tags=["Socratic AI Telemetry"])
    async def record_telemetry_event(body: dict):
        """Telemetry recording endpoint for student interactions."""
        return {"status": "recorded", "timestamp": body.get("timestamp")}

    # Teacher & Classroom Real-Time Analytics
    @router.get("/api/teacher/classroom/{classroom_id}/heatmap/{chapter_id}", response_model=ClassroomHeatmapResponse, tags=["Teacher & Classroom Analytics"])
    async def get_classroom_chapter_heatmap(classroom_id: str, chapter_id: str):
        """Returns real-time concept mastery heatmaps, bottleneck alerts, and student intervention queue."""
        result = teacher_analytics_service.get_classroom_heatmap(classroom_id, chapter_id)
        try:
            UUID(classroom_id)
        except ValueError:
            pass
        else:
            with db() as conn:
                row = q(conn, "SELECT name FROM sections WHERE id = %s", (classroom_id,)).fetchone()
                if row is not None:
                    result.classroom_name = row[0]
                    roster_row = q(conn, "SELECT count(*) FROM user_tenant_mappings "
                                         "WHERE section_id = %s AND role = 'STUDENT'", (classroom_id,)).fetchone()
                    result.section_roster_size = roster_row[0]
        return result

    @router.post("/api/teacher/telemetry/record-mastery", tags=["Teacher & Classroom Analytics"])
    async def record_student_mastery_event(req: RecordMasteryRequest):
        """High-throughput ingestion endpoint for student concept mastery and struggling events."""
        teacher_analytics_service.record_student_event(req)
        # Durable copy for DuckDB/OLAP rollups (migration 022). Best-effort: never let a
        # persistence hiccup break the in-memory recording path this endpoint already guarantees.
        try:
            with db() as conn:
                q(conn, "INSERT INTO mastery_events "
                       "(classroom_id, student_id, student_name, chapter_id, concept_id, event_type, error_detail) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                  (req.classroom_id, req.student_id, req.student_name, req.chapter_id, req.concept_id,
                   req.event_type, req.error_detail))
        except Exception:
            import logging as _mastery_events_logging
            _mastery_events_logging.getLogger("edova.teacher_analytics").exception("mastery_events persistence failed")
        return {"status": "recorded", "student_id": req.student_id, "concept_id": req.concept_id}

    from contextlib import contextmanager

    @contextmanager
    def _duckdb_pg_conn():
        """DuckDB connection attached to Postgres (read-only) via the postgres
        extension, for the teacher-analytics rollup queries below. Always closed on
        exit -- callers must not stash `con` past their `with` block."""
        import duckdb
        con = duckdb.connect()
        try:
            con.execute("INSTALL postgres")
            con.execute("LOAD postgres")
            con.execute(f"ATTACH '{DB_DSN}' AS pg (TYPE POSTGRES, READ_ONLY)")
            yield con
        finally:
            con.close()

    def _compute_dashboard_rollup(section_rows):
        """Shared core for both the tenant-wide overview (Level 1) and the single-section
        rollup (Level 2's subject/chapter filter): mastery/bottleneck/intervention counts
        pooled across whichever sections are passed in, built from the durable
        mastery_events table (migration 022) via DuckDB, not the in-memory engine (that
        engine only ever answers for one classroom_id at a time -- see the heatmap
        endpoint above). section_rows is [(id, name, grade, roster_size), ...], already
        scoped to the caller's tenant by the route handler. Kept as one function, called
        by two thin routes, so this math is never duplicated or allowed to drift."""
        section_meta = {str(r[0]): {"name": r[1], "grade": r[2], "roster_size": r[3]} for r in section_rows}

        empty = {"overall_mastery_pct": 0.0, "active_students": 0, "concepts_flagged": 0,
                 "students_needing_intervention": 0, "sections": [], "chapters": []}
        if not section_meta:
            return empty

        with _duckdb_pg_conn() as con:
            placeholders = ", ".join("?" for _ in section_meta)
            latest_rows = con.execute(
                f"""
                WITH ranked AS (
                    SELECT classroom_id, chapter_id, concept_id, student_id, event_type,
                           row_number() OVER (
                               PARTITION BY classroom_id, chapter_id, concept_id, student_id
                               ORDER BY created_at DESC
                           ) AS rn
                    FROM pg.mastery_events
                    WHERE classroom_id IN ({placeholders})
                )
                SELECT classroom_id, chapter_id, concept_id, student_id, event_type
                FROM ranked WHERE rn = 1
                """,
                list(section_meta.keys()),
            ).fetchall()

        if not COMPILED_GRAPHS:
            find_and_load_all_graphs()

        # Mirror teacher_analytics_service's own mastered/struggling-set semantics, just
        # pooled across many classroom_ids (sections) at once instead of one at a time.
        per_section_concepts = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(set))))  # section -> chapter -> concept -> {"mastered"/"struggling": {student_ids}}
        pooled_concepts = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))  # chapter -> concept -> {...}
        all_active_students = set()
        struggling_students = set()

        for classroom_id, chapter_id, concept_id, student_id, event_type in latest_rows:
            all_active_students.add(student_id)
            key = "mastered" if event_type == "mastery" else "struggling" if event_type == "struggle" else None
            if key is None:
                continue
            per_section_concepts[classroom_id][chapter_id][concept_id][key].add(student_id)
            pooled_concepts[chapter_id][concept_id][key].add(student_id)
            if key == "struggling":
                struggling_students.add(student_id)

        def concept_stats(sets_by_key):
            mastered = len(sets_by_key.get("mastered", set()))
            struggling = len(sets_by_key.get("struggling", set()))
            engaged = max(1, mastered + struggling)
            mastery_pct = mastered / engaged * 100
            struggling_pct = struggling / engaged * 100
            is_mastered = mastery_pct >= 70.0
            is_hotspot = struggling_pct >= 30.0 and struggling > 0
            return is_mastered, is_hotspot, struggling_pct, struggling

        def chapter_total_concepts(chapter_id):
            graph = COMPILED_GRAPHS.get(chapter_id)
            return len(graph.nodes) if graph else 1

        # Pooled, across whichever sections were passed in: concepts flagged + overall
        # mastery across every touched chapter.
        concepts_flagged = 0
        total_mastered_points = 0
        total_curriculum_concepts = 0
        for chapter_id, concepts in pooled_concepts.items():
            total_curriculum_concepts += chapter_total_concepts(chapter_id)
            for concept_id, sets_by_key in concepts.items():
                is_mastered, is_hotspot, _, _ = concept_stats(sets_by_key)
                if is_mastered:
                    total_mastered_points += 1
                if is_hotspot:
                    concepts_flagged += 1
        overall_mastery_pct = round(total_mastered_points / max(1, total_curriculum_concepts) * 100, 1)

        # Per-chapter pooled rollup (the "Chapters" table), tagged with subject_name --
        # real data from the compiled knowledge graph, needed for Level 2's Subject filter.
        chapters = []
        for chapter_id, concepts in pooled_concepts.items():
            mastered_points = sum(1 for c in concepts.values() if concept_stats(c)[0])
            total_concepts = chapter_total_concepts(chapter_id)
            graph = COMPILED_GRAPHS.get(chapter_id)
            chapters.append({
                "chapter_id": chapter_id,
                "chapter_title": graph.chapter_title if graph else chapter_id,
                "subject_name": graph.subject_name if graph else "Unknown",
                "mastery_pct": round(mastered_points / max(1, total_concepts) * 100, 1),
            })

        # Per-section rollup (the "Sections" cards / Level 2's own KPI strip).
        sections = []
        for section_id, meta in section_meta.items():
            section_chapters = per_section_concepts.get(section_id, {})
            mastered_points = 0
            curriculum_total = 0
            active_in_section = set()
            for chapter_id, concepts in section_chapters.items():
                curriculum_total += chapter_total_concepts(chapter_id)
                for concept_id, sets_by_key in concepts.items():
                    if concept_stats(sets_by_key)[0]:
                        mastered_points += 1
                    active_in_section |= sets_by_key.get("mastered", set()) | sets_by_key.get("struggling", set())
            sections.append({
                "id": section_id,
                "name": meta["name"],
                "grade": meta["grade"],
                "mastery_pct": round(mastered_points / max(1, curriculum_total) * 100, 1) if curriculum_total else 0.0,
                "active_students": len(active_in_section),
                "roster_size": meta["roster_size"],
            })

        return {
            "overall_mastery_pct": overall_mastery_pct,
            "active_students": len(all_active_students),
            "concepts_flagged": concepts_flagged,
            "students_needing_intervention": len(struggling_students),
            "sections": sections,
            "chapters": chapters,
        }

    @router.get("/api/teacher/analytics/overview", tags=["Teacher & Classroom Analytics"])
    async def get_teacher_analytics_overview(authorization: str = Header(...)):
        """Level-1 dashboard rollup: every section, every touched chapter, for the
        caller's tenant. Thin route -- all the math lives in _compute_dashboard_rollup."""
        uid = current_user_id(authorization)
        tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

        with db() as conn:
            section_rows = q(conn,
                "SELECT s.id, s.name, s.grade, "
                "       (SELECT count(*) FROM user_tenant_mappings utm "
                "        WHERE utm.section_id = s.id AND utm.role = 'STUDENT') AS roster_size "
                "FROM sections s WHERE s.tenant_id = %s", (tenant_id,)).fetchall()
        return _compute_dashboard_rollup(section_rows)

    @router.get("/api/teacher/analytics/section/{section_id}", tags=["Teacher & Classroom Analytics"])
    async def get_teacher_analytics_section(section_id: str, authorization: str = Header(...)):
        """Level-2 rollup for the Subject filter: which subjects/chapters does this ONE
        section actually have activity in. Same shared math as the overview endpoint,
        scoped to a single section -- a small, fast query for frequent drill-down
        navigation, independent of the tenant-wide rollup's cost as a school grows."""
        uid = current_user_id(authorization)
        tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

        with db() as conn:
            section_rows = q(conn,
                "SELECT s.id, s.name, s.grade, "
                "       (SELECT count(*) FROM user_tenant_mappings utm "
                "        WHERE utm.section_id = s.id AND utm.role = 'STUDENT') AS roster_size "
                "FROM sections s WHERE s.id = %s AND s.tenant_id = %s", (section_id, tenant_id)).fetchall()
        if not section_rows:
            raise HTTPException(404, "section not found")
        rollup = _compute_dashboard_rollup(section_rows)
        return {"section": rollup["sections"][0] if rollup["sections"] else None, "chapters": rollup["chapters"]}

    @router.get("/api/teacher/analytics/student/{student_id}", tags=["Teacher & Classroom Analytics"])
    async def get_teacher_analytics_student_profile(student_id: str, authorization: str = Header(...)):
        """Level-3 per-student rollup across every chapter this student has touched, scoped
        to the caller's own tenant (via its sections) so one teacher can't pull another
        school's student by guessing an id. Honest about the data model: mastery_events only
        records a binary mastered/struggling/attempted status per concept (from event_type),
        never a graded percentage -- so per-topic status is categorical here, not a fabricated
        percentage; only the aggregate mastery_pct (mastered concepts / curriculum size) is a
        real percentage, same rollup style as the Level-1 overview endpoint above."""
        uid = current_user_id(authorization)
        tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

        # Engagement is independent of sections/mastery_events entirely -- computed first so
        # a tenant with zero sections still gets real engagement data in the early return below.
        # Only wired for a real users.id belonging to this tenant as a STUDENT; mastery
        # telemetry's student_id is often a free-form demo string with no such row, so this
        # degrades to zeros rather than erroring (see gap #1's non-UUID test above).
        engagement = {"time_spent_seconds_week": 0, "modules_touched_week": 0,
                      "quiz_attempts_week": 0, "last_active": None}
        try:
            student_uuid = str(UUID(student_id))
        except ValueError:
            student_uuid = None
        if student_uuid is not None:
            with db() as conn:
                is_tenant_student = q(
                    conn, "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s AND role = 'STUDENT'",
                    (student_uuid, tenant_id)
                ).fetchone() is not None
                if is_tenant_student:
                    row = q(conn,
                        "SELECT coalesce(sum(delta_seconds), 0), count(DISTINCT module_id) "
                        "FROM progress_events WHERE student_id = %s AND created_at >= now() - interval '7 days'",
                        (student_uuid,)).fetchone()
                    engagement["time_spent_seconds_week"] = row[0]
                    engagement["modules_touched_week"] = row[1]
                    quiz_row = q(conn,
                        "SELECT count(*) FROM student_quiz_attempts "
                        "WHERE student_id = %s AND submitted_at >= now() - interval '7 days'",
                        (student_uuid,)).fetchone()
                    engagement["quiz_attempts_week"] = quiz_row[0]
                    last_active_row = q(conn,
                        "SELECT greatest("
                        "  (SELECT max(last_accessed) FROM student_progress WHERE student_id = %s),"
                        "  (SELECT max(submitted_at) FROM student_quiz_attempts WHERE student_id = %s)"
                        ")", (student_uuid, student_uuid)).fetchone()
                    engagement["last_active"] = last_active_row[0].isoformat() if last_active_row[0] else None

        with db() as conn:
            section_rows = q(conn, "SELECT id FROM sections WHERE tenant_id = %s", (tenant_id,)).fetchall()
        section_ids = [str(r[0]) for r in section_rows]

        empty = {"student_id": student_id, "mastery_pct": 0.0, "concepts_stuck": 0,
                 "topics": [], "subjects": [], "engagement": engagement, "misconception_pattern": None,
                 "suggested_next_steps": [], "strengths": [], "struggling": []}
        if not section_ids:
            return empty

        with _duckdb_pg_conn() as con:
            placeholders = ", ".join("?" for _ in section_ids)
            rows = con.execute(
                f"""
                WITH scoped AS (
                    SELECT * FROM pg.mastery_events
                    WHERE student_id = ? AND classroom_id IN ({placeholders})
                ),
                ranked AS (
                    SELECT chapter_id, concept_id, event_type, error_detail,
                           row_number() OVER (
                               PARTITION BY chapter_id, concept_id ORDER BY created_at DESC
                           ) AS rn,
                           count(*) OVER (PARTITION BY chapter_id, concept_id) AS attempts_count
                    FROM scoped
                )
                SELECT chapter_id, concept_id, event_type, error_detail, attempts_count
                FROM ranked WHERE rn = 1
                """,
                [student_id, *section_ids],
            ).fetchall()

        if not COMPILED_GRAPHS:
            find_and_load_all_graphs()

        topics = []
        touched_chapters = set()
        for chapter_id, concept_id, event_type, error_detail, attempts_count in rows:
            touched_chapters.add(chapter_id)
            status = "mastered" if event_type == "mastery" else "struggling" if event_type == "struggle" else "attempted"
            graph = COMPILED_GRAPHS.get(chapter_id)
            node = graph.nodes.get(concept_id) if graph else None
            topics.append({
                "chapter_id": chapter_id,
                "chapter_title": graph.chapter_title if graph else chapter_id,
                "concept_id": concept_id,
                "concept_name": node.name if node else concept_id,
                "status": status,
                "attempts_count": attempts_count,
                "last_error_detail": error_detail if status == "struggling" else None,
            })

        mastered_points = sum(1 for t in topics if t["status"] == "mastered")
        curriculum_total = sum(
            len(COMPILED_GRAPHS[c].nodes) if c in COMPILED_GRAPHS else 1 for c in touched_chapters
        )
        mastery_pct = round(mastered_points / max(1, curriculum_total) * 100, 1) if touched_chapters else 0.0
        concepts_stuck = sum(1 for t in topics if t["status"] == "struggling")

        # Subject -> Chapter breakdown, additive alongside the blended mastery_pct above
        # (that field stays as-is for existing callers/tests). Chapters whose graph
        # never loaded fall back to an "Unknown" subject bucket rather than erroring.
        per_chapter_mastered = defaultdict(int)
        for t in topics:
            if t["status"] == "mastered":
                per_chapter_mastered[t["chapter_id"]] += 1

        subjects_map = defaultdict(lambda: {"mastered": 0, "curriculum": 0, "chapters": {}})
        for chapter_id in touched_chapters:
            graph = COMPILED_GRAPHS.get(chapter_id)
            subject_name = graph.subject_name if graph else "Unknown"
            chapter_curriculum = len(graph.nodes) if graph else 1
            chapter_mastered = per_chapter_mastered.get(chapter_id, 0)
            agg = subjects_map[subject_name]
            agg["mastered"] += chapter_mastered
            agg["curriculum"] += chapter_curriculum
            agg["chapters"][chapter_id] = {
                "chapter_id": chapter_id,
                "chapter_title": graph.chapter_title if graph else chapter_id,
                "mastery_pct": round(chapter_mastered / max(1, chapter_curriculum) * 100, 1),
            }
        subjects = [
            {"subject_name": name, "mastery_pct": round(agg["mastered"] / max(1, agg["curriculum"]) * 100, 1),
             "chapters": list(agg["chapters"].values())}
            for name, agg in subjects_map.items()
        ]

        struggling_topics = [t for t in topics if t["status"] == "struggling"]
        misconception_pattern = gemini_socratic_service.classify_misconception_pattern([
            {"concept_name": t["concept_name"], "error_detail": t["last_error_detail"]}
            for t in struggling_topics if t["last_error_detail"]
        ])

        # Ranked, deterministic -- no LLM call. Most attempts with no mastery yet is the
        # most urgent; each action reuses the concept's real curriculum-authored guiding
        # question (same hermes_guiding_question field Level-2's bottleneck alerts use),
        # falling back to a generic prompt only when a concept has none authored.
        ranked_struggling = sorted(struggling_topics, key=lambda t: t["attempts_count"], reverse=True)
        suggested_next_steps = []
        for t in ranked_struggling[:2]:
            graph = COMPILED_GRAPHS.get(t["chapter_id"])
            node = graph.nodes.get(t["concept_id"]) if graph else None
            guidance = (node.hermes_guiding_question if node else None) or \
                f"Review {t['concept_name']} with {student_id} 1:1."
            suggested_next_steps.append({
                "concept_id": t["concept_id"],
                "concept_name": t["concept_name"],
                "chapter_title": t["chapter_title"],
                "attempts_count": t["attempts_count"],
                "action": guidance,
            })

        # Query video explainer scaffolding telemetry
        video_scaffolding = {
            "total_explainers_requested": 0,
            "explainers_watched": 0,
            "recent_videos": [],
            "relies_on_video_hints": False,
        }
        try:
            with db() as conn:
                v_rows = q(
                    conn,
                    "SELECT event_type, event_payload, timestamp FROM trig_telemetry_events "
                    "WHERE student_id = %s AND event_type IN ('video_explainer_generated', 'video_explainer_watched') "
                    "ORDER BY timestamp DESC LIMIT 10",
                    (student_id,),
                ).fetchall()
                gen_count = sum(1 for r in v_rows if r[0] == "video_explainer_generated")
                watch_count = sum(1 for r in v_rows if r[0] == "video_explainer_watched")
                recent_v = [
                    {
                        "event_type": r[0],
                        "video_id": (r[1] or {}).get("video_id") if isinstance(r[1], dict) else None,
                        "file_name": (r[1] or {}).get("file_name") if isinstance(r[1], dict) else None,
                        "s3_folder": (r[1] or {}).get("s3_folder", "Ondemand videos") if isinstance(r[1], dict) else "Ondemand videos",
                        "timestamp": r[2].isoformat() if hasattr(r[2], "isoformat") else str(r[2]),
                    }
                    for r in v_rows[:5]
                ]
                video_scaffolding["total_explainers_requested"] = gen_count
                video_scaffolding["explainers_watched"] = watch_count
                video_scaffolding["recent_videos"] = recent_v
                video_scaffolding["relies_on_video_hints"] = gen_count >= 2
        except Exception:
            pass

        return {
            "student_id": student_id,
            "mastery_pct": mastery_pct,
            "concepts_stuck": concepts_stuck,
            "topics": topics,
            "subjects": subjects,
            "engagement": engagement,
            "video_scaffolding": video_scaffolding,
            "misconception_pattern": misconception_pattern,
            "suggested_next_steps": suggested_next_steps,
            "strengths": [t for t in topics if t["status"] == "mastered"],
            "struggling": struggling_topics,
        }

    @router.get("/api/teacher/dashboard/summary", tags=["Teacher & Classroom Analytics"])
    async def get_teacher_classroom_summary():
        """Real-time aggregated classroom learning telemetry summary for teacher monitoring."""
        heatmap = teacher_analytics_service.get_classroom_heatmap(
            "class-10a",
            "chapter-05-arithmetic-progressions"
        )
        return {
            "active_students_count": heatmap.total_active_students,
            "active_chapter": heatmap.chapter_title,
            "overall_chapter_mastery": f"{heatmap.overall_chapter_mastery}%",
            "bottleneck_count": len(heatmap.bottleneck_alerts),
            "bottleneck_alerts": [b.model_dump() for b in heatmap.bottleneck_alerts],
            "top_interventions": [i.model_dump() for i in heatmap.intervention_queue[:5]]
        }

except Exception:
    import logging
    logging.exception(
        "Could not initialize Socratic/Knowledge-Graph/Teacher-Analytics endpoints -- "
        "all routes in that block are unavailable until this is fixed")
