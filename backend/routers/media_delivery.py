"""Router: extracted from main.py (pure code motion, no behavior change)."""
import os
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from fastapi import Response
from services import lab_sandbox
from services import s3_client

from core import (
    current_principal,
    db,
    guarded_module,
    q,
)

router = APIRouter()


# Phase 4B/4C: S3-backed payload delivery
# ============================================================


HLS_SEGMENT_SECONDS = 6.0  # matches the ffmpeg -hls_time used by the CMS upload pipeline


# --- 4B: HLS media manifest generated from the S3 segment listing ---
@router.get("/api/student/video/{module_id}/manifest")
def video_manifest(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_video"]:
        raise HTTPException(403, "video access not included in your plan")
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, tenant_id)
        if mod_type != "VIDEO":
            raise HTTPException(422, "module is not a video")
        payload = q(conn, "SELECT s3_key_prefix, transcode_status FROM video_payloads WHERE module_id = %s",
                    (module_id,)).fetchone()
    if payload is None or not payload[0]:
        if payload is not None and payload[1] == "PROCESSING":
            raise HTTPException(404, "video is still processing — try again shortly")
        raise HTTPException(404, "video content not published yet")  # "Coming Soon"

    segments = sorted(k for k in s3_client.list_keys(payload[0]) if k.endswith(".ts"))
    if not segments:
        raise HTTPException(404, "no video segments found in storage")

    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{int(HLS_SEGMENT_SECONDS) + 1}",
        "#EXT-X-MEDIA-SEQUENCE:0",
        "#EXT-X-PLAYLIST-TYPE:VOD",
    ]
    for key in segments:
        lines.append(f"#EXTINF:{HLS_SEGMENT_SECONDS:.3f},")
        lines.append(s3_client.presign_get(key, s3_client.PRESIGN_TTL_VIDEO))
    lines.append("#EXT-X-ENDLIST")
    return Response("\n".join(lines) + "\n", media_type="application/vnd.apple.mpegurl")


# --- 4C: static lab simulation served via presigned URL (no code execution) ---
@router.get("/api/student/lab/{module_id}/simulation")
def lab_simulation(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, tenant_id)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")
        payload = q(conn, "SELECT s3_file_key, environment_type FROM lab_payloads WHERE module_id = %s",
                    (module_id,)).fetchone()
    if payload is None or not payload[0]:
        raise HTTPException(404, "lab simulation not published yet")  # "Coming Soon"
    if not s3_client.object_exists(payload[0]):
        raise HTTPException(404, "lab simulation file missing from storage")
    return {
        "module_id": module_id,
        "environment_type": payload[1],
        "simulation_url": s3_client.presign_get(payload[0], s3_client.PRESIGN_TTL_LAB),
        "expires_in": s3_client.PRESIGN_TTL_LAB,
    }


# --- 4D: Lab Sandbox Engine (prototype: index.html POST /api/v1/engine/lab/execute) ---
# Hard env gate: code execution is OFF unless EDOVA_LAB_EXEC_ENABLED=true. Rationale
# and isolation limits are documented in lab_sandbox.py. Execution result is always
# HTTP 200 with exit_code in the body; 422 is reserved for request/runtime problems.

LAB_EXEC_ENABLED = os.getenv("EDOVA_LAB_EXEC_ENABLED", "").lower() in ("1", "true", "yes")
LAB_EXEC_MAX_TIMEOUT = 30      # prototype UI range 1-30s
LAB_EXEC_MAX_MEMORY_MB = 1024  # prototype UI range 16-1024MB


class LabExecuteIn(BaseModel):
    code: str
    language: str
    timeout_seconds: int = 5
    memory_limit_mb: int = 256
    stdin: str | None = None


@router.post("/api/v1/engine/lab/execute")
def lab_execute(body: LabExecuteIn, authorization: str = Header(...)):
    if not LAB_EXEC_ENABLED:
        raise HTTPException(503, "lab code execution is disabled on this server")
    p = current_principal(authorization)
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    if not body.code.strip():
        raise HTTPException(422, "code must not be empty")
    if len(body.code.encode("utf-8")) > lab_sandbox.MAX_CODE_BYTES:
        raise HTTPException(422, f"code exceeds {lab_sandbox.MAX_CODE_BYTES} bytes")
    if body.stdin is not None and len(body.stdin.encode("utf-8")) > lab_sandbox.MAX_STDIN_BYTES:
        raise HTTPException(422, f"stdin exceeds {lab_sandbox.MAX_STDIN_BYTES} bytes")
    if not (1 <= body.timeout_seconds <= LAB_EXEC_MAX_TIMEOUT):
        raise HTTPException(422, f"timeout_seconds must be 1-{LAB_EXEC_MAX_TIMEOUT}")
    if not (16 <= body.memory_limit_mb <= LAB_EXEC_MAX_MEMORY_MB):
        raise HTTPException(422, f"memory_limit_mb must be 16-{LAB_EXEC_MAX_MEMORY_MB}")
    if body.language not in lab_sandbox.available_languages():
        raise HTTPException(422, f"unsupported language: {body.language!r}")
    try:
        return lab_sandbox.execute(body.code, body.language, body.timeout_seconds,
                                   body.memory_limit_mb, body.stdin)
    except lab_sandbox.SandboxError as e:
        raise HTTPException(422, str(e))

