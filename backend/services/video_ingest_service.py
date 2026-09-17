"""Unified Video Ingestion & Processing Service for Edova Co-Teacher.

Handles transcoding raw MP4 video (from either On-Demand generation or CMS uploads)
into 6-second HLS segments, extracting preview thumbnails, uploading to S3, and
recording state transitions in PostgreSQL (video_payloads).
"""
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

from core import db, q
from services import s3_client

HLS_SEGMENT_SECONDS = 6.0
FFMPEG_DIR = os.getenv("EDOVA_FFMPEG_DIR", "")
_BUNDLED_FFMPEG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools", "ffmpeg", "bin"
)


def _tool(name: str) -> str:
    """Locates ffprobe or ffmpeg from EDOVA_FFMPEG_DIR, PATH, or repo-bundled tools."""
    if FFMPEG_DIR:
        p = os.path.join(FFMPEG_DIR, name)
        if os.path.exists(p) or os.path.exists(p + ".exe"):
            return p
    if shutil.which(name) is not None:
        return name
    bundled = os.path.join(_BUNDLED_FFMPEG_DIR, name)
    if shutil.which(name, path=_BUNDLED_FFMPEG_DIR) is not None:
        return bundled
    if os.path.exists(bundled + ".exe"):
        return bundled + ".exe"
    return name


def probe_video_duration(src_path: Path) -> int:
    """Probes the video file using ffprobe/ffmpeg to extract duration in seconds."""
    try:
        probe = subprocess.run(
            [
                _tool("ffprobe"),
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(src_path),
            ],
            capture_output=True,
            text=True,
        )
        if probe.returncode == 0 and probe.stdout.strip():
            return int(float(probe.stdout.strip()))
    except Exception:
        pass

    # Fallback duration probing using ffmpeg -i
    try:
        probe_ff = subprocess.run(
            [_tool("ffmpeg"), "-i", str(src_path)],
            capture_output=True,
            text=True,
            errors="replace",
        )
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", probe_ff.stderr)
        if m:
            return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(float(m.group(3)))
    except Exception:
        pass
    return 0


def ingest_raw_mp4_to_s3(src_path: Path, video_id: str) -> Tuple[int, str]:
    """
    Transcodes a raw MP4 file into 6s HLS segments + thumbnail,
    uploads to S3 at uploads/hls/{video_id}/, and registers status in video_payloads.
    Returns (duration_seconds, s3_prefix).
    """
    if not src_path.exists() or src_path.stat().st_size == 0:
        raise ValueError(f"Source video {src_path} does not exist or is empty")

    duration = probe_video_duration(src_path)
    prefix = f"uploads/hls/{video_id}/"

    with tempfile.TemporaryDirectory(prefix="edova_ingest_") as tmp_dir:
        tmp = Path(tmp_dir)

        # 1. Update status to PROCESSING in Postgres
        with db() as conn:
            conn.execute(
                "INSERT INTO video_payloads (module_id, transcode_status, transcode_error) "
                "VALUES (%s, 'PROCESSING', NULL) "
                "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'PROCESSING', transcode_error = NULL",
                (video_id,),
            )

        try:
            # 2. FFmpeg HLS transcode
            proc = subprocess.run(
                [
                    _tool("ffmpeg"),
                    "-y",
                    "-i",
                    str(src_path),
                    "-c:v",
                    "libx264",
                    "-c:a",
                    "aac",
                    "-preset",
                    "veryfast",
                    "-f",
                    "hls",
                    "-hls_time",
                    str(int(HLS_SEGMENT_SECONDS)),
                    "-hls_playlist_type",
                    "vod",
                    "-hls_segment_filename",
                    str(tmp / "seg_%03d.ts"),
                    str(tmp / "out.m3u8"),
                ],
                capture_output=True,
            )
            segments = sorted(tmp.glob("seg_*.ts"))
            if proc.returncode != 0 or not segments:
                err_msg = proc.stderr.decode(errors="replace")[-400:]
                raise RuntimeError(f"FFmpeg transcode failed: {err_msg}")

            # 3. Upload HLS segments to S3
            for seg in segments:
                s3_client.put_bytes(prefix + seg.name, seg.read_bytes(), "video/mp2t")

            # 4. Generate & upload 2s thumbnail
            thumb_path = tmp / "thumbnail.jpg"
            subprocess.run(
                [
                    _tool("ffmpeg"),
                    "-y",
                    "-ss",
                    "00:00:02",
                    "-i",
                    str(src_path),
                    "-vframes",
                    "1",
                    "-q:v",
                    "2",
                    str(thumb_path),
                ],
                capture_output=True,
            )
            if thumb_path.exists() and thumb_path.stat().st_size > 0:
                try:
                    s3_client.put_bytes(
                        prefix + "thumbnail.jpg", thumb_path.read_bytes(), "image/jpeg"
                    )
                except Exception:
                    pass

            # 5. Atomically mark READY in video_payloads
            with db() as conn:
                conn.execute(
                    "UPDATE video_payloads SET transcode_status = 'READY', transcode_error = NULL, "
                    "duration_seconds = %s, s3_key_prefix = %s WHERE module_id = %s",
                    (duration, prefix, video_id),
                )
            return duration, prefix

        except Exception as exc:
            # Mark FAILED
            with db() as conn:
                conn.execute(
                    "UPDATE video_payloads SET transcode_status = 'FAILED', transcode_error = %s "
                    "WHERE module_id = %s",
                    (str(exc)[:500], video_id),
                )
            raise


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
