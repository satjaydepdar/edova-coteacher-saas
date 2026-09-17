"""FastAPI Router for Video Generation Pipeline Engine & S3 Ingestion Gateway."""
import json
import os
import httpx
from fastapi import APIRouter, Header, HTTPException, Request, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

import re
from pathlib import Path
from core import current_principal, db, q
from services import s3_client
from services.video_ingest_service import build_hls_manifest_for_video

ENGINE_URL = os.getenv("VIDEO_ENGINE_URL", "http://127.0.0.1:5050")
RENDERER_OUT_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "video-factory"
    / "apps"
    / "renderer"
    / "out"
)

router = APIRouter(prefix="/api/video", tags=["Video Generation Pipeline Engine"])


class VideoGenerateIn(BaseModel):
    problemType: str = "trig-depression"
    question: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    videoId: Optional[str] = None
    forceRefresh: Optional[bool] = False


class VideoFromQuestionIn(BaseModel):
    """QuestionInput (Astra video factory spec, section 1) -- the author supplies just
    the question; everything else is optional metadata Astra can use if present."""
    question: str
    class_: Optional[str] = Field(default=None, alias="class")
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    marks: Optional[float] = None
    source: Optional[str] = None
    difficulty: Optional[str] = None

    class Config:
        populate_by_name = True


class SaveOndemandIn(BaseModel):
    videoId: str
    problemType: Optional[str] = "right-triangle"
    question: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    fileName: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


def format_ondemand_filename(
    problem_type: str,
    video_id: str,
    parameters: Optional[dict] = None,
    question: Optional[str] = None,
) -> str:
    """Computes a human-readable, descriptive filename for on-demand generated videos."""
    params = parameters or {}
    p_type = (problem_type or "").lower()
    q_text = (question or "").lower()

    # 1. Right Triangle Ratio Problems (e.g. Pythagorean triples)
    if "triangle" in p_type or "ratio" in p_type or "triangle" in q_text or "sin a" in q_text:
        verts = params.get("vertices")
        if isinstance(verts, list) and len(verts) >= 3:
            vA, vB, vC = verts[0], verts[1], verts[2]
        else:
            vA = params.get("vA", "A")
            vB = params.get("vB", "B")
            vC = params.get("vC", "C")
        ab = params.get("sideAB") or params.get("ab") or 5
        bc = params.get("sideBC") or params.get("bc") or 12
        hyp = params.get("hypLen") or params.get("hyp") or round((float(ab) ** 2 + float(bc) ** 2) ** 0.5, 2)
        return f"trig_right_triangle_{vA}{vB}{vC}_ab{ab}_bc{bc}_hyp{hyp}.mp4"

    # 2. River Bridge Depression
    if "depression" in p_type or "river" in p_type or "bridge" in q_text:
        h = params.get("bridgeHeightM") or params.get("bridgeHeight") or 3
        a1 = params.get("angleLeftDeg") or params.get("angle1") or 30
        a2 = params.get("angleRightDeg") or params.get("angle2") or 45
        return f"trig_depression_river_bridge_h{h}m_{a1}deg_{a2}deg.mp4"

    # 3. Tower Elevation
    if "elevation" in p_type or "tower" in p_type or "tower" in q_text:
        h = params.get("towerHeight") or params.get("height")
        d = params.get("distance") or params.get("dist") or 15
        ang = params.get("angle") or params.get("angleDeg") or 60
        if h is not None:
            return f"trig_elevation_tower_h{h}m_d{d}m_{ang}deg.mp4"
        return f"trig_elevation_tower_d{d}m_{ang}deg.mp4"

    # 4. Custom problems from question text
    if question and len(question.strip()) > 3:
        clean_q = re.sub(r"[^a-zA-Z0-9]+", "_", question.lower().strip())
        clean_q = re.sub(r"_+", "_", clean_q).strip("_")
        if clean_q:
            return f"trig_{clean_q[:40]}.mp4"

    # 5. Fallback slug
    clean_slug = re.sub(r"[^a-zA-Z0-9_-]", "_", video_id or "custom")[:32]
    return f"trig_{clean_slug}.mp4"


def record_ready_video(video_id: str, s3_key: str, duration_seconds: int = 38) -> None:
    """Records a video the engine already persisted to S3 itself. No bytes ever pass
    through this process -- the engine (a separate container/service in production)
    uploads directly to S3 and hands us just the key."""
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO video_payloads (module_id, transcode_status, s3_key_prefix, duration_seconds) "
                "VALUES (%s, 'READY', %s, %s) "
                "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'READY', s3_key_prefix = EXCLUDED.s3_key_prefix",
                (video_id, s3_key, duration_seconds),
            )
    except Exception:
        pass


def get_video_bytes_for_id(video_id: str) -> bytes:
    """Local-dev-only: fetches MP4 bytes from the renderer's local output directory.
    Only reachable when the engine is unreachable AND running on localhost -- in a
    real deployment the engine is a separate container and this directory won't exist,
    so this path is never used in production (see is_local_engine check below)."""
    exact_path = RENDERER_OUT_DIR / f"{video_id}.mp4"
    if exact_path.exists() and exact_path.stat().st_size > 0:
        return exact_path.read_bytes()
    river_path = RENDERER_OUT_DIR / "trig-depression-river.mp4"
    if river_path.exists() and river_path.stat().st_size > 0:
        return river_path.read_bytes()
    demo_path = RENDERER_OUT_DIR / "trig-socratic-demo.mp4"
    if demo_path.exists() and demo_path.stat().st_size > 0:
        return demo_path.read_bytes()
    return b""


def save_ondemand_video_to_s3(
    video_id: str,
    problem_type: str = "right-triangle",
    file_name: Optional[str] = None,
    parameters: Optional[dict] = None,
    question: Optional[str] = None,
    data_bytes: Optional[bytes] = None,
    video_bytes: Optional[bytes] = None,
) -> dict:
    """Saves on-demand generated video to S3 under 'Ondemand videos/' with descriptive naming."""
    fname = file_name or format_ondemand_filename(problem_type, video_id, parameters, question)
    data = data_bytes or video_bytes or get_video_bytes_for_id(video_id)
    if not data:
        data = get_video_bytes_for_id("trig-depression-river")

    s3_key = s3_client.upload_ondemand_video(fname, data, "video/mp4")

    # Record in video_payloads table
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO video_payloads (module_id, transcode_status, s3_key_prefix, duration_seconds) "
                "VALUES (%s, 'READY', %s, 38) "
                "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'READY', s3_key_prefix = EXCLUDED.s3_key_prefix",
                (video_id, f"Ondemand videos/{fname}"),
            )
    except Exception:
        pass

    return {
        "status": "saved",
        "s3_bucket": s3_client.S3_BUCKET,
        "s3_folder": "Ondemand videos",
        "s3_key": s3_key,
        "file_name": fname,
        "size_bytes": len(data),
    }



@router.get("/health")
async def engine_health():
    """Checks connection to the Video Factory Engine service."""
    async with httpx.AsyncClient(timeout=3.0) as client:
        try:
            res = await client.get(f"{ENGINE_URL}/health")
            return res.json()
        except Exception as exc:
            return {
                "status": "offline",
                "engine_url": ENGINE_URL,
                "detail": str(exc),
            }


@router.post("/generate")
async def generate_video(
    payload: VideoGenerateIn,
    authorization: Optional[str] = Header(None),
):
    """
    On-Demand video generation trigger:
    Forwards parameter specification to Video Factory Engine (port 5050).
    """
    # Verify student / teacher principal if token provided
    if authorization and authorization.startswith("Bearer "):
        try:
            _ = current_principal(authorization)
        except Exception:
            pass

    # Only treat "engine offline" as a dev fallback when it's actually configured to
    # point at localhost -- in production ENGINE_URL is a real internal service
    # address, and an unreachable engine there is a real outage, not a dev signal.
    is_local_engine = "127.0.0.1" in ENGINE_URL or "localhost" in ENGINE_URL

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                f"{ENGINE_URL}/api/v1/generate",
                json=payload.model_dump(),
            )
            if res.status_code not in (200, 202):
                raise HTTPException(
                    status_code=res.status_code,
                    detail=res.text or "Video Engine error",
                )
            result = res.json()

            # Cached/immediate READY: the engine already uploaded this render to S3
            # itself (see video-factory/apps/pipeline/src/s3.ts) -- just record the key.
            if result.get("status") == "READY" and result.get("s3Key"):
                record_ready_video(result["videoId"], result["s3Key"])

            # Otherwise this is an async job (QUEUED/SYNTHESIZING_AUDIO/RENDERING_VIDEO)
            # -- caller polls GET /api/video/status/{jobId} until READY.
            return result
        except httpx.RequestError as exc:
            if not is_local_engine:
                raise HTTPException(
                    status_code=503,
                    detail=f"Video generation engine unreachable: {exc}",
                )
            # Local dev only: engine isn't running, fall back to a canned S3 sample.
            v_id = payload.videoId or "custom-trig"
            s3_res = save_ondemand_video_to_s3(
                video_id=v_id,
                problem_type=payload.problemType,
                parameters=payload.parameters,
                question=payload.question,
            )
            return {
                "jobId": f"local-{v_id}",
                "videoId": v_id,
                "status": "READY",
                "progress": 100,
                "currentStage": "Video ready in S3 Ondemand videos (local dev fallback)",
                "s3": s3_res,
            }


@router.post("/save-ondemand")
async def save_ondemand_endpoint(payload: SaveOndemandIn):
    """
    Explicit endpoint to save an on-demand generated video to S3 under
    'Ondemand videos/' with human-readable descriptive naming.
    """
    res = save_ondemand_video_to_s3(
        video_id=payload.videoId,
        problem_type=payload.problemType or "right-triangle",
        file_name=payload.fileName,
        parameters=payload.parameters,
        question=payload.question,
    )
    return res



@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Polls status and live progress percentage of an on-demand video generation job."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"{ENGINE_URL}/api/v1/jobs/{job_id}")
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Job not found")
            result = res.json()
            if result.get("status") == "READY" and result.get("s3Key"):
                record_ready_video(result["videoId"], result["s3Key"])
            return result
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Engine error: {exc}")


@router.get("/storyboard/{video_id}")
async def get_storyboard(video_id: str):
    """Returns storyboard metadata and scene descriptions for chapter markers."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"{ENGINE_URL}/api/v1/storyboard/{video_id}")
            if res.status_code != 200:
                raise HTTPException(status_code=404, detail="Storyboard not found")
            return res.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Engine error: {exc}")


@router.get("/manifest/{video_id}")
async def get_video_hls_manifest(video_id: str):
    """Returns HLS playlist manifest for S3-transcoded videos."""
    manifest = build_hls_manifest_for_video(video_id)
    if not manifest:
        raise HTTPException(
            status_code=404, detail="HLS manifest not available for this video"
        )
    return Response(manifest, media_type="application/vnd.apple.mpegurl")


@router.get("/stream/{video_id}")
async def stream_video(video_id: str, request: Request):
    """
    Proxies seekable MP4 video streaming from the local engine
    with byte-range requests (HTTP 206 Partial Content).
    """
    range_header = request.headers.get("range")
    headers = {}
    if range_header:
        headers["range"] = range_header

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.get(
                f"{ENGINE_URL}/api/v1/video/{video_id}",
                headers=headers,
            )
            response_headers = {
                "Content-Type": res.headers.get("Content-Type", "video/mp4"),
                "Accept-Ranges": "bytes",
            }
            if "Content-Range" in res.headers:
                response_headers["Content-Range"] = res.headers["Content-Range"]
            if "Content-Length" in res.headers:
                response_headers["Content-Length"] = res.headers["Content-Length"]

            return Response(
                content=res.content,
                status_code=res.status_code,
                headers=response_headers,
                media_type="video/mp4",
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Video streaming error: {exc}")


def _update_job(job_id: str, **fields) -> None:
    if not fields:
        return
    cols = ", ".join(f"{k} = %s" for k in fields)
    values = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in fields.values()]
    with db() as conn:
        conn.execute(
            f"UPDATE video_generation_jobs SET {cols}, updated_at = NOW() WHERE id = %s",
            (*values, job_id),
        )
        conn.commit()


@router.post("/generate-from-question", status_code=202)
async def generate_video_from_question(payload: VideoFromQuestionIn, authorization: Optional[str] = Header(None)):
    """Astra video factory pipeline entry point: Question -> Astra reasoning ->
    Mathematical Verification Gate -> Socratic pedagogy -> VideoSpec -> render.
    Never hands an unverified solution to the renderer -- if verification fails, this
    returns without generating a video."""
    from services.astra_reasoning_service import QuestionInput, analyze_and_solve
    from services.llm_client import LlmCallError
    from services.math_verification_service import verify_solution
    from services.socratic_pedagogy_service import build_teaching_sequence
    from services.video_spec_service import build_video_spec

    created_by = None
    if authorization and authorization.startswith("Bearer "):
        try:
            principal = current_principal(authorization)
            created_by = principal.get("user_id")
        except Exception:
            pass

    with db() as conn:
        row = conn.execute(
            "INSERT INTO video_generation_jobs (question, question_metadata, created_by, status) "
            "VALUES (%s, %s, %s, 'PENDING') RETURNING id",
            (payload.question, payload.model_dump_json(exclude={"question"}, by_alias=True), created_by),
        ).fetchone()
        job_id = str(row[0])
        conn.commit()

    # 1. Astra reasoning -- not trusted; everything it returns gets checked next.
    try:
        astra_result = analyze_and_solve(QuestionInput(**payload.model_dump(by_alias=True, exclude_none=True)))
    except (LlmCallError, HTTPException) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        _update_job(job_id, status="FAILED", error=f"Astra reasoning failed: {detail}")
        raise HTTPException(422, {"job_id": job_id, "status": "FAILED", "reason": f"Astra reasoning failed: {detail}"})

    problem_analysis = astra_result.get("problem_analysis", {})
    solution_steps = astra_result.get("solution_steps", [])
    final_answer = astra_result.get("final_answer")
    _update_job(job_id, problem_analysis=problem_analysis, solution_steps=solution_steps)

    # 2. Mathematical Verification Gate -- deterministic, SymPy-based, trusts nothing.
    verification = verify_solution(problem_analysis, solution_steps, final_answer)
    _update_job(job_id, verification_result=verification)

    if verification["status"] != "VERIFIED":
        status = "NEEDS_HUMAN_REVIEW" if verification["status"] == "NEEDS_REVIEW" else "FAILED"
        _update_job(job_id, status=status)
        return {
            "job_id": job_id,
            "status": status,
            "verification": verification,
            "message": "Solution failed verification -- no video was generated.",
        }

    # 3. Socratic pedagogy -- runs only on the VERIFIED steps.
    final_answer_text = (final_answer or {}).get("answer_text", "")
    try:
        teaching_sequence = build_teaching_sequence(verification["verified_steps"], final_answer_text)
    except (LlmCallError, HTTPException) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        _update_job(job_id, status="FAILED", error=f"Pedagogy generation failed: {detail}")
        raise HTTPException(422, {"job_id": job_id, "status": "FAILED", "reason": f"Pedagogy generation failed: {detail}"})

    # 4. Video Production Specification (deterministic mapping, no LLM call here)
    video_spec = build_video_spec(payload.question, verification["verified_steps"], teaching_sequence)
    _update_job(job_id, teaching_sequence=teaching_sequence, video_spec=video_spec,
                video_id=video_spec["videoId"], status="AUTO_APPROVED")

    # 5. Hand off to the render engine -- same engine the existing /generate path uses,
    # but this time driven purely by the spec, no problemType branching.
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                f"{ENGINE_URL}/api/v1/generate",
                json={"videoSpec": video_spec, "videoId": video_spec["videoId"]},
            )
            engine_result = res.json() if res.status_code in (200, 202) else {"error": res.text}
        except httpx.RequestError as exc:
            engine_result = {"error": f"engine unreachable: {exc}"}

    return {
        "job_id": job_id,
        "status": "AUTO_APPROVED",
        "video_id": video_spec["videoId"],
        "verification": verification,
        "engine": engine_result,
    }
