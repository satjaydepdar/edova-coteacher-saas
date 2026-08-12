"""Seed Phase 4B/4C: real HLS segments from bucket video + lab simulation HTML."""
import subprocess
import tempfile
from pathlib import Path

import psycopg
import s3_client
from main import DB_DSN, _tool

SRC_VIDEO = "Class-10/Semester-01/Biology/Chapter-01/digestive system.mp4"

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    # Owns a dedicated module ("Seed 4BC Video") — never write segments into
    # curated/demo modules (this seed once overwrote 'Intro to Heat').
    ch = conn.execute(
        "SELECT c.id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
        "WHERE s.name = 'Global Physics' AND c.name = 'Chapter 4: Thermodynamics'").fetchone()[0]
    row = conn.execute("SELECT id FROM modules WHERE title = 'Seed 4BC Video'").fetchone()
    if row is None:
        vid_mod = conn.execute(
            "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
            "VALUES (%s, 'Seed 4BC Video', 'VIDEO', 90, TRUE) RETURNING id", (ch,)).fetchone()[0]
    else:
        vid_mod = row[0]
    lab_mod = conn.execute("SELECT module_id FROM lab_payloads lp "
                           "JOIN modules m ON m.id = lp.module_id WHERE m.title = 'Heat Transfer Virtual Lab'").fetchone()[0]

size = s3_client.client().head_object(Bucket=s3_client.S3_BUCKET, Key=SRC_VIDEO)["ContentLength"]
print(f"source video: {SRC_VIDEO} ({size / 1e6:.1f} MB)")

with tempfile.TemporaryDirectory() as tmp:
    src = Path(tmp) / "src.mp4"
    s3_client.client().download_file(s3_client.S3_BUCKET, SRC_VIDEO, str(src))

    # First 24s -> 6s HLS segments (4 segments expected)
    subprocess.run([
        _tool("ffmpeg"), "-y", "-i", str(src), "-t", "24",
        "-c:v", "libx264", "-c:a", "aac", "-preset", "veryfast",
        "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
        "-hls_segment_filename", str(Path(tmp) / "seg_%03d.ts"),
        str(Path(tmp) / "out.m3u8"),
    ], check=True, capture_output=True)

    prefix = f"uploads/hls/{vid_mod}/"
    segments = sorted(Path(tmp).glob("seg_*.ts"))
    for seg in segments:
        s3_client.put_bytes(prefix + seg.name, seg.read_bytes(), "video/mp2t")
    print(f"uploaded {len(segments)} segments to s3://{s3_client.S3_BUCKET}/{prefix}")

    # Static lab simulation (no code execution — pure HTML/SVG)
    sim_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Heat Transfer Sim</title></head>
<body style="background:#0A0C10;color:#E2DFD8;font-family:sans-serif;text-align:center;padding:40px">
<h2>Heat Transfer Virtual Lab</h2>
<svg width="400" height="120" viewBox="0 0 400 120">
  <rect x="20" y="40" width="160" height="40" fill="#F0435A"><animate attributeName="fill" values="#F0435A;#F5A623;#F0435A" dur="4s" repeatCount="indefinite"/></rect>
  <rect x="220" y="40" width="160" height="40" fill="#3AA5DC"><animate attributeName="fill" values="#3AA5DC;#F5A623;#3AA5DC" dur="4s" repeatCount="indefinite"/></rect>
  <text x="100" y="105" fill="#E2DFD8" text-anchor="middle" font-size="12">Hot reservoir</text>
  <text x="300" y="105" fill="#E2DFD8" text-anchor="middle" font-size="12">Cold reservoir</text>
  <path d="M180 60 L220 60" stroke="#E8A020" stroke-width="4" marker-end="url(#a)"/>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#E8A020"/></marker></defs>
</svg>
<p>EDOVA_SIMULATION_MARKER — conduction demo for module {lab_mod}</p>
</body></html>"""
    sim_key = f"uploads/labs/{lab_mod}/simulation.html"
    s3_client.put_bytes(sim_key, sim_html.encode(), "text/html")
    print(f"uploaded simulation to s3://{s3_client.S3_BUCKET}/{sim_key}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("INSERT INTO video_payloads (module_id, s3_key_prefix) VALUES (%s, %s) "
                 "ON CONFLICT (module_id) DO UPDATE SET s3_key_prefix = EXCLUDED.s3_key_prefix",
                 (vid_mod, prefix))
    conn.execute("UPDATE lab_payloads SET s3_file_key = %s WHERE module_id = %s", (sim_key, lab_mod))
print("seeded: phase4bc fixtures ready")
