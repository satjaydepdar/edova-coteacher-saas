"""HLS manifest/status lookups for transcoded video (video_payloads). The actual
raw-mp4-to-HLS transcode lives inline in routers/admin_content.py (its own ffmpeg
pipeline, not this module) -- this module only reads back what it produced."""
from typing import Optional, Dict, Any

from core import db, q
from services import s3_client

HLS_SEGMENT_SECONDS = 6.0


def get_video_payload_status(video_id: str) -> Dict[str, Any]:
    """Retrieves payload status and metadata from database."""
    with db() as conn:
        row = q(
            conn,
            "SELECT transcode_status, transcode_error, duration_seconds, s3_key_prefix "
            "FROM video_payloads WHERE module_id = %s",
            (video_id,),
        ).fetchone()

    if row is None:
        return {"video_id": video_id, "status": "NOT_FOUND"}

    return {
        "video_id": video_id,
        "status": row[0],
        "error": row[1],
        "duration_seconds": row[2],
        "s3_key_prefix": row[3],
    }


def build_hls_manifest_for_video(video_id: str) -> Optional[str]:
    """Constructs dynamic HLS playlist with short-lived presigned S3 URLs."""
    info = get_video_payload_status(video_id)
    if info.get("status") != "READY" or not info.get("s3_key_prefix"):
        return None

    prefix = info["s3_key_prefix"]
    segments = sorted(k for k in s3_client.list_keys(prefix) if k.endswith(".ts"))
    if not segments:
        return None

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
    return "\n".join(lines) + "\n"
