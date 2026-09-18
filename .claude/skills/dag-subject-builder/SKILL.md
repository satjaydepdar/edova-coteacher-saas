---
name: dag-subject-builder
description: Use when building a new subject/chapter's concept DAG, backend practice module, edova-reasoner solvers, and practice UI for edova-coteacher-saas (e.g. "build the DAG for Quadratic Equations", "add a reasoner for Polynomials", "make Real Numbers work like Trigonometry"). Captures the file structure, build order, and specific bugs hit while building Coordinate Geometry as the second subject after Trigonometry.
---

# Building a new subject's DAG + reasoner + practice UI

This captures what actually worked (and broke) building Coordinate Geometry as
the second subject after Trigonometry. It is a process and pitfalls checklist,
not a math generator: the solver/step logic for a new subject is real design
work every time, this just stops you from re-deriving the architecture and
re-hitting the same bugs.

**Scope check first**: this skill is for a subject that needs genuine
step-by-step interactive solving (a live reasoner session). If the ask is
"just show the concept DAG and question bank, solving can come later," skip
straight to Phase 2 and Phase 4's stub option — Phase 3 (reasoner solvers) is
the expensive part and is separable.

## Phase 1 — Content gathering (no code)

Do not write any code until you have, from the user:

1. A concept list with an id scheme (`<subject>-c1`, `<subject>-c2`, ...) and a
   prerequisite graph between them. Ask for it as prose + a JSON adjacency
   list — cross-check the two against each other for inconsistencies (the
   Coordinate Geometry spec had two: prose vs. JSON disagreed on two nodes'
   prerequisites; resolved by keeping only edges both sources agreed on).
2. A short description + one real formula/identity per concept.
3. One real worked problem per concept, sourced from NCERT/board papers, with
   the actual numeric answer — not synthetic examples. Independently
   re-verify every number (see Phase 3's solver tests) before trusting it;
   this session caught a genuinely wrong "collinear" example set and an
   accidentally-square "rhombus" example this way.
4. Confirmation of the final concept count and dependency structure before
   any seed data or schema work — content review is cheap to redo, code
   built on the wrong structure is not.

Topological order matters for the concept dropdown/DAG display — plan the
final id numbering (`c1`..`cN`) to already match dependency order so no
renumbering is needed later.

## Phase 2 — Backend practice module (edova-coteacher-saas)

Mirror `backend/trigonometry/` (template) and `backend/coordinate_geometry/`
(second real example, so diff the two if trig's own pattern is unclear).
Create `backend/<subject>/`:

| File | Contents |
|---|---|
| `__init__.py`, `routers/__init__.py` | empty |
| `models.py` | `Concept`, `StudentState` (mastery_score, scaffold_assistance_level, consecutive_correct, questions_solved, active_session_id, active_step_index, current_question_id, cognitive_profile), `InteractionLog`, `TelemetryEvent`, `<Subject>Question` (problem_text, hints, worked_solution, expected_answer, **problem_spec** JSON — needed from day one if a reasoner session is planned, adding it later means a schema migration) |
| `database.py` | copy trig's verbatim, swap the import of `models` |
| `schemas.py` | `ResetRequest`, `CognitiveMetrics`, `TelemetryEventCreate`, `TelemetryEventResponse` — copy trig's exactly, don't trim `CognitiveMetrics` even if planning to stub solving first (it's cheap and `student.py` needs it) |
| `routers/concepts.py` | topo-sorted concept list — **use a numeric-aware sort key**, see Pitfall 1 |
| `routers/student.py` | `/state/{concept_id}`: picks a curated question, proxies to the reasoner if `problem_spec` exists |
| `routers/session_proxy.py` | `/session/init`, `/session/step`, `/session/{id}` — proxies to `edova-reasoner`, calls the **shared** `services.problem_spec_classifier.classify_problem` when no `problem_spec` is given (Custom Problem). When persisting `mastery_events`, look up the concept's real chapter — don't hardcode it (trig's own version has this bug; don't repeat it). |
| `routers/teacher.py`, `routers/analytics.py`, `routers/telemetry.py` | same shape as trig's |
| `seed_<subject>_dag.py` | concepts + prerequisites + one `<Subject>Question` per concept, `problem_spec` populated with the real structured spec (see Phase 3) |

Wire into `backend/main.py`: import each router, `app.include_router(...)`,
and call the module's `init_db()` alongside trig's.

Add the chapter to `backend/routers/content.py`'s `PRACTICE_READY_CHAPTERS`
dict (`"Chapter Name": "module_key"`) so the Practice page filter picks it
up — don't touch `DEFAULT_PRACTICE_CHAPTER` unless the new subject should
become the page's default landing view.

**Dev DB note**: adding columns to a model after tables already exist needs a
drop+recreate (`Base.metadata.drop_all(engine); Base.metadata.create_all(engine)`)
or a real migration — `create_all()` never alters existing tables. In dev with
no real student progress, drop+reseed is fine; check first if that's still true.

## Phase 3 — edova-reasoner solvers (separate repo)

This is genuine design work per subject — plan for it, don't assume it's a
mechanical step. In `edova-reasoner/backend/app/services/solvers/`:

1. Write `<subject>_solver.py`: one `@staticmethod` per concept family,
   deterministic (SymPy), returning a dict of computed values + a verdict
   string where applicable. Mirror `trig_solver.py`'s and
   `coordinate_geometry_solver.py`'s shape.
2. Write `tests/test_<subject>_solver.py` **against the real answers from
   Phase 1**, not invented numbers — this is the check that catches wrong
   math before it reaches a student. Run with
   `PYTHONPATH=. python tests/test_<subject>_solver.py` if the environment's
   `pytest` is broken (see Pitfall 5), or
   `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -q` to run the real
   suite and confirm zero regressions to the existing ~150 trig tests.
3. In `pedagogical_chunker.py`: add one `_chunk_<subject>_<concept>` method
   per concept family (2-4 Socratic steps: state the formula, substitute,
   compute — mirror the existing methods' `step_index/prompt/expected_math/
   expected_latex/hints/quick_options` shape exactly), a `problem_type`
   dispatch branch per type in `chunk_problem`, and a point-formatting helper
   if the spec carries `[x, y]` coordinate pairs (see Pitfall 2).
4. Write `tests/test_<subject>_chunker.py` calling `chunk_problem()`
   end-to-end for every problem_type with real specs, asserting the final
   step's `expected_math` matches the real answer.
5. Update `backend/services/problem_spec_classifier.py` (in
   edova-coteacher-saas, shared across all subjects) — add the new
   `problem_type` schemas to `SYSTEM_PROMPT` so Custom Problem free text can
   be classified into them too.

`FlexibleEvaluator`'s generic fallback (`verify_algebraic_equivalence`)
handles non-numeric verdict strings like "Collinear" or "Right triangle" fine
as `expected_math` — no special-casing needed there.

## Phase 4 — Frontend (now the cheap part)

Both `ConceptDagModal` (`frontend/src/components/dag/`) and
`CoteacherWorkspace` (`frontend/src/components/trig/CoteacherWorkspace.tsx`)
are subject-agnostic already — driven by props, not per-subject copies. Do
**not** build a new workspace/DAG component; that's exactly the duplication
that caused Trigonometry and Coordinate Geometry to visually diverge before
this was fixed. Instead:

1. `frontend/src/lib/<subject>/<subject>ApiClient.ts`: implement the
   `SubjectApi` interface exported from `trigApiClient.ts`
   (`concepts/state/reset/profile/initSession/submitStep/getSession`),
   pointed at `/api/<subject>/*`. Reuse `TrigConceptSummary`/`TrigStudentState`/
   `GenericSessionInitResponse`/etc. types directly — the response shapes are
   identical across subjects (same reasoning engine).
2. `frontend/src/components/<subject>/<Subject>Practice.tsx`: load
   `<subject>Api.concepts()`, pick the first unlocked one, render
   `<CoteacherWorkspace api={...} telemetryEndpoint="/api/<subject>/telemetry/event"
   dagSubjectLabel="..." subjectFallbackName="..." formulaReferenceTitle="..."
   formulaReferenceItems={[...]} customModalTitle="..." presetProblems={[...]}
   syncBadgeLabel="..." />`. This is the entire frontend build for a new subject.
3. `frontend/src/pages/Practice.tsx`: import the new practice component, add
   its `practice_module` value to the dispatch (`selectedChapter?.practice_module === '<subject>' ? <SubjectPractice /> : ...`).

**If skipping Phase 3 for now** (DAG/questions only, no live solving): still
use the same `CoteacherWorkspace` component, don't build a lighter-weight one
for the stub case. `student.py`'s `/state` response needs to match the full
`TrigStudentState` shape either way (`session_id`, `current_step`, etc.) or
CoteacherWorkspace breaks — so the honest stub lives server-side:
`student.py` returns a fixed 1-step "coming soon" `current_step` without
calling the reasoner at all, correctly shaped for the same frontend
component. When Phase 3 is ready later, only `student.py`/`session_proxy.py`
change — the frontend and everything else built in this phase stays as-is.

## Phase 5 — Verification checklist

- [ ] Solver unit tests pass against real textbook answers (Phase 3.2)
- [ ] Chunker end-to-end tests pass for every problem_type (Phase 3.4)
- [ ] Full reasoner suite still green, no regressions (`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -q`)
- [ ] Frontend typechecks clean (`npx tsc --noEmit -p .`)
- [ ] Restart **both** the main backend and edova-reasoner processes before testing live (Pitfall 5) — check `netstat`/`/health` first, don't assume `--reload` caught your edit
- [ ] Live browser check: concept dropdown shows correct dependency order, DAG map shows correct edges/locks, Next Problem produces a real multi-step session (not the "enter final answer, expected 0" fallback — Pitfall 4), submitting real answers advances/completes the session
- [ ] Regression-check the *other* subject's Next Problem / Custom Problem / DAG modal still work (same shared components now render both)
- [ ] Practice page still defaults to the intended chapter (adding a new `practice_available` chapter can silently steal the default if its `sequence_order` is lower — see `DEFAULT_PRACTICE_CHAPTER` in `content.py`)

## Pitfalls hit while building Coordinate Geometry

1. **Lexicographic concept sort**: plain string sort puts `"c10"` before
   `"c2"`. Fix: sort by `(prefix, int(trailing_digits))`, not the raw string.
   Applies to any id scheme with 10+ items.
2. **Raw list/tuple interpolated into an f-string renders as Python repr**:
   `f"A{p1}"` where `p1 = ["1","-1"]` prints `A['1', '-1']`, not `A(1, -1)`.
   Format points into display strings (`f"({p[0]}, {p[1]})"`) before
   interpolating into any prompt/hint text.
3. **SymPy `Symbol(..., positive=False)` means "assumed non-positive,"
   not "no assumption"** — it silently filters out valid positive solutions
   from `sp.solve()`. Leave symbols unconstrained unless the domain
   genuinely restricts sign.
4. **The chunker's fallback for an unrecognized `problem_type` hardcodes the
   expected answer to `"0"`** — it produces a session that *looks* like it
   works (prompt appears, session created) while every correctness check is
   fake. Never ship a new subject's "Next Problem" against this fallback;
   verify the actual dispatch branch is hit (check the response's
   `total_steps` and `current_step.prompt` aren't the generic
   "enter the final evaluated result" text).
5. **Stale process gotcha**: `edova-reasoner` is typically started without
   `--reload` (see `dev.ps1`) — editing `pedagogical_chunker.py` or a solver
   file does nothing until it's manually restarted. Separately, killing a
   uvicorn `--reload` worker process directly can bring down its parent
   supervisor too on Windows, requiring a full manual restart rather than an
   automatic respawn. Check `curl .../health` (reasoner) and `/docs`
   (backend) actually reflect the new code before trusting a "it works" test.
6. **A local environment's global `pytest` can be broken by an unrelated
   plugin** (hit a `pytest-asyncio`/`pytest` version mismatch here) —
   `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -q` works around it
   without needing to fix the environment.
7. **DAG "unlocks" (reverse of prerequisites) must be computed, never
   hand-typed separately** — a hand-typed second copy silently drifts from
   the real prerequisite data (found Trigonometry's own pre-existing DAG
   modal had wrong hardcoded unlock data this way, before both subjects were
   unified onto one data-driven component).
8. **"Same layout across subjects" means generalizing the existing shared
   component with props, not building a parallel one** — every hardcoded
   subject-specific string in `CoteacherWorkspace.tsx` (formula reference
   card, Custom Problem presets, sync badge label, fallback concept name) is
   a prop with the old value as its default, so Trigonometry's behavior
   never changes while Coordinate Geometry supplies its own.
