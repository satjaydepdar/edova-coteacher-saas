"""Batch video ingestion and curriculum seeding script.
Ingests Grade 10 videos from C:\\Users\\pvsat\\OneDrive\\Documents\\edova-coteacher-backup\\videos,
transcodes to HLS via FFmpeg, uploads segments + thumbnail to AWS S3, and records
database rows in PostgreSQL.
"""
import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
import psycopg
import imageio_ffmpeg
import s3_client

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from main import DB_DSN
HLS_SEGMENT_SECONDS = 6.0
VIDEO_BACKUP_DIR = Path(r"C:\Users\pvsat\OneDrive\Documents\edova-coteacher-backup\videos")

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()


def probe_duration(src_path: Path) -> int:
    """Extract duration in seconds from video using ffmpeg info banner."""
    try:
        proc = subprocess.run(
            [FFMPEG_EXE, "-i", str(src_path)],
            capture_output=True, text=True, errors="replace"
        )
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", proc.stderr)
        if m:
            return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(float(m.group(3)))
    except Exception as e:
        print(f"  [!] Failed to probe duration for {src_path.name}: {e}")
    return 0


def transcode_and_upload(src_path: Path, module_id: str) -> tuple[int, str]:
    """Transcode raw MP4 to 6s HLS segments, generate thumbnail, and upload to S3."""
    workdir = Path(tempfile.mkdtemp(prefix="edova_ingest_"))
    try:
        duration = probe_duration(src_path)
        print(f"  -> Transcoding {src_path.name} (duration ~{duration}s)...")

        # 1. HLS segmentation
        cmd = [
            FFMPEG_EXE, "-y", "-i", str(src_path),
            "-c:v", "libx264", "-c:a", "aac",
            "-preset", "fast", "-f", "hls",
            "-hls_time", str(int(HLS_SEGMENT_SECONDS)),
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", str(workdir / "seg_%03d.ts"),
            str(workdir / "out.m3u8")
        ]
        t0 = time.time()
        proc = subprocess.run(cmd, capture_output=True)
        if proc.returncode != 0:
            err = proc.stderr.decode(errors="replace")[-400:]
            raise RuntimeError(f"FFmpeg transcode failed: {err}")

        segments = sorted(workdir.glob("seg_*.ts"))
        if not segments:
            raise RuntimeError("No HLS segments produced.")
        print(f"  -> Generated {len(segments)} segments in {time.time() - t0:.1f}s")

        # 2. Extract poster thumbnail at 2s
        thumb_path = workdir / "thumbnail.jpg"
        subprocess.run([
            FFMPEG_EXE, "-y", "-ss", "00:00:02", "-i", str(src_path),
            "-vframes", "1", "-q:v", "2", str(thumb_path)
        ], capture_output=True)

        # 3. Upload segments + thumbnail to S3
        prefix = f"uploads/hls/{module_id}/"
        print(f"  -> Uploading segments to S3 (prefix: {prefix})...")
        for seg in segments:
            s3_client.put_bytes(prefix + seg.name, seg.read_bytes(), "video/mp2t")

        if thumb_path.exists() and thumb_path.stat().st_size > 0:
            s3_client.put_bytes(prefix + "thumbnail.jpg", thumb_path.read_bytes(), "image/jpeg")

        return duration, prefix
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


TEST_CLIP_MP4 = Path(r"c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\migration\test-clip-90s.mp4")

VIDEO_CATALOG = [
    # --- Mathematics (Grade 10) ---
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Real Numbers",
        "chapter_seq": 1,
        "topic": "Fundamental Theorem of Arithmetic",
        "topic_seq": 1,
        "module_title": "Real Numbers — Fundamental Theorem & Prime Factorization",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math Chapter 1 Real numbers.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Polynomials",
        "chapter_seq": 2,
        "topic": "Geometric Zeroes",
        "topic_seq": 1,
        "module_title": "Polynomials — Geometric Meaning of Zeroes & Coefficients",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 2 Polynomials.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Pair of Linear Equations",
        "chapter_seq": 3,
        "topic": "Graphical and Algebraic Solutions",
        "topic_seq": 1,
        "module_title": "Pair of Linear Equations in Two Variables — Graphical & Substitution Methods",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 3 linear equations.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Quadratic Equations",
        "chapter_seq": 4,
        "topic": "Standard Form & Nature of Roots",
        "topic_seq": 1,
        "module_title": "Quadratic Equations — Formulation, Factorization & Discriminant",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 4 quadratic equations.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Arithmetic Progressions",
        "chapter_seq": 5,
        "topic": "nth Term & Sum of Terms",
        "topic_seq": 1,
        "module_title": "Arithmetic Progressions — General Form & nth Term Formula",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 5 Arithmetic progression.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Triangles",
        "chapter_seq": 6,
        "topic": "Similarity Criteria",
        "topic_seq": 1,
        "module_title": "Triangles — Basic Proportionality Theorem & Similarity Criteria",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 6 Triangles.mp4",
    },
    {
        "subject": "Mathematics",
        "grade": "10",
        "subject_seq": 1,
        "chapter": "Coordinate Geometry",
        "chapter_seq": 7,
        "topic": "Distance & Section Formula",
        "topic_seq": 1,
        "module_title": "Coordinate Geometry — Distance & Section Formulae",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "math" / "math chapter 7 co ordinate geometry.mp4",
    },

    # --- Science (Grade 10) ---
    {
        "subject": "Science",
        "grade": "10",
        "subject_seq": 2,
        "chapter": "Life Processes",
        "chapter_seq": 1,
        "topic": "Nutrition",
        "topic_seq": 1,
        "module_title": "Life Processes — Nutrition in Plants and Animals",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "biology" / "bio - life process - nutrition.mp4",
    },
    {
        "subject": "Science",
        "grade": "10",
        "subject_seq": 2,
        "chapter": "Life Processes",
        "chapter_seq": 1,
        "topic": "Transportation",
        "topic_seq": 2,
        "module_title": "Life Processes — Transportation & Human Circulatory System",
        "module_type": "VIDEO",
        "module_seq": 2,
        "file": VIDEO_BACKUP_DIR / "biology" / "Bio- life process - transportation.mp4",
    },
    {
        "subject": "Science",
        "grade": "10",
        "subject_seq": 2,
        "chapter": "Life Processes",
        "chapter_seq": 1,
        "topic": "Excretion",
        "topic_seq": 3,
        "module_title": "Life Processes — Excretion & Nephron Structure",
        "module_type": "VIDEO",
        "module_seq": 3,
        "file": VIDEO_BACKUP_DIR / "biology" / "Bio - life process - excretion.mp4",
    },
    {
        "subject": "Science",
        "grade": "10",
        "subject_seq": 2,
        "chapter": "Acids, Bases and Salts",
        "chapter_seq": 2,
        "topic": "Acid Base Reactions",
        "topic_seq": 1,
        "module_title": "Acids, Bases and Salts — Chemical Properties & pH Scale",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "chemistry" / "Chemistry - Acids, Bases and salts.mp4",
    },
    {
        "subject": "Science",
        "grade": "10",
        "subject_seq": 2,
        "chapter": "Light – Reflection and Refraction",
        "chapter_seq": 3,
        "topic": "Spherical Mirrors",
        "topic_seq": 1,
        "module_title": "Concave Mirror Exploration — Focal Length & Image Formation",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": TEST_CLIP_MP4,
    },

    # --- Social Science (Grade 10) ---
    {
        "subject": "Social Science",
        "grade": "10",
        "subject_seq": 3,
        "chapter": "Resources and Development",
        "chapter_seq": 1,
        "topic": "Resource Planning",
        "topic_seq": 1,
        "module_title": "Resources and Development — Types, Land Use & Soil Conservation",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "Geography" / "Geography - resources and development.mp4",
    },
    {
        "subject": "Social Science",
        "grade": "10",
        "subject_seq": 3,
        "chapter": "Development",
        "chapter_seq": 2,
        "topic": "Economic Indicators",
        "topic_seq": 1,
        "module_title": "Development — Income, National Development & Human Development Index",
        "module_type": "VIDEO",
        "module_seq": 1,
        "file": VIDEO_BACKUP_DIR / "economics" / "Economics - Development.mp4",
    },
]


def run_ingestion():
    print(f"=== Starting Video Ingestion ({len(VIDEO_CATALOG)} videos) ===")
    with psycopg.connect(DB_DSN, autocommit=True) as conn:
        with conn.cursor() as cur:
            # 0. Pre-clean empty chapters in core subjects and temporarily offset sequence orders
            cur.execute("""
                DELETE FROM chapters 
                WHERE subject_id IN (SELECT id FROM subjects WHERE name IN ('Mathematics', 'Science', 'Social Science', 'English'))
                AND id NOT IN (SELECT DISTINCT chapter_id FROM modules WHERE chapter_id IS NOT NULL)
            """)
            cur.execute("""
                UPDATE chapters 
                SET sequence_order = sequence_order + 5000 
                WHERE subject_id IN (SELECT id FROM subjects WHERE name IN ('Mathematics', 'Science', 'Social Science', 'English'))
            """)

            for item in VIDEO_CATALOG:
                file_path = item["file"]
                if not file_path.exists():
                    print(f"[!] Skipped: file does not exist: {file_path}")
                    continue

                print(f"\n[{item['subject']}] -> Chapter: {item['chapter']} -> Module: {item['module_title']}")

                # 1. Ensure Subject exists and has correct sequence_order
                cur.execute(
                    "SELECT id FROM subjects WHERE name = %s AND standard_grade = %s",
                    (item["subject"], item["grade"])
                )
                row = cur.fetchone()
                if row:
                    subject_id = row[0]
                    if item.get("subject_seq"):
                        cur.execute("UPDATE subjects SET sequence_order = %s WHERE id = %s", (item["subject_seq"], subject_id))
                else:
                    cur.execute(
                        "INSERT INTO subjects (name, standard_grade, sequence_order) "
                        "VALUES (%s, %s, %s) RETURNING id",
                        (item["subject"], item["grade"], item.get("subject_seq", 1))
                    )
                    subject_id = cur.fetchone()[0]

                # 2. Ensure Chapter exists (match by name or create)
                cur.execute(
                    "SELECT id FROM chapters WHERE subject_id = %s AND name = %s",
                    (subject_id, item["chapter"])
                )
                row = cur.fetchone()
                if row:
                    chapter_id = row[0]
                    cur.execute("UPDATE chapters SET sequence_order = %s WHERE id = %s", (item["chapter_seq"], chapter_id))
                else:
                    cur.execute(
                        "INSERT INTO chapters (subject_id, name, sequence_order) "
                        "VALUES (%s, %s, %s) "
                        "ON CONFLICT (subject_id, sequence_order) DO UPDATE SET name = EXCLUDED.name "
                        "RETURNING id",
                        (subject_id, item["chapter"], item["chapter_seq"])
                    )
                    chapter_id = cur.fetchone()[0]

                # 3. Ensure Topic exists
                topic_id = None
                if item.get("topic"):
                    cur.execute(
                        "SELECT id FROM topics WHERE chapter_id = %s AND name = %s",
                        (chapter_id, item["topic"])
                    )
                    row = cur.fetchone()
                    if row:
                        topic_id = row[0]
                    else:
                        cur.execute(
                            "INSERT INTO topics (chapter_id, name, sequence_order) "
                            "VALUES (%s, %s, %s) "
                            "ON CONFLICT (chapter_id, sequence_order) DO UPDATE SET name = EXCLUDED.name "
                            "RETURNING id",
                            (chapter_id, item["topic"], item["topic_seq"])
                        )
                        topic_id = cur.fetchone()[0]

                # 4. Ensure Module exists
                cur.execute(
                    "SELECT id FROM modules WHERE chapter_id = %s AND title = %s",
                    (chapter_id, item["module_title"])
                )
                row = cur.fetchone()
                if row:
                    module_id = row[0]
                    cur.execute(
                        "UPDATE modules SET topic_id = %s, sequence_order = %s, is_published = true WHERE id = %s",
                        (topic_id, item["module_seq"], module_id)
                    )
                else:
                    cur.execute(
                        "INSERT INTO modules (chapter_id, topic_id, title, module_type, sequence_order, is_published) "
                        "VALUES (%s, %s, %s, %s, %s, true) "
                        "ON CONFLICT (chapter_id, sequence_order) DO UPDATE SET "
                        "title = EXCLUDED.title, module_type = EXCLUDED.module_type, is_published = true "
                        "RETURNING id",
                        (chapter_id, topic_id, item["module_title"], item["module_type"], item["module_seq"])
                    )
                    module_id = cur.fetchone()[0]

                # 5. Check if video_payloads is already READY
                cur.execute(
                    "SELECT transcode_status, duration_seconds, s3_key_prefix FROM video_payloads WHERE module_id = %s",
                    (module_id,)
                )
                vp = cur.fetchone()
                if vp and vp[0] == "READY" and vp[2]:
                    print(f"  [OK] Already READY in S3: {vp[2]} (duration: {vp[1]}s)", flush=True)
                    continue

                # 6. Transcode & Upload
                try:
                    duration, prefix = transcode_and_upload(file_path, str(module_id))
                    cur.execute(
                        "INSERT INTO video_payloads (module_id, transcode_status, duration_seconds, s3_key_prefix) "
                        "VALUES (%s, 'READY', %s, %s) "
                        "ON CONFLICT (module_id) DO UPDATE SET "
                        "transcode_status = 'READY', duration_seconds = EXCLUDED.duration_seconds, "
                        "s3_key_prefix = EXCLUDED.s3_key_prefix, transcode_error = NULL",
                        (module_id, duration, prefix)
                    )
                    cur.execute("UPDATE modules SET is_published = true WHERE id = %s", (module_id,))
                    print(f"  [OK] Successfully ingested & published module: {module_id}", flush=True)
                except Exception as ex:
                    print(f"  [FAILED] Could not ingest {file_path.name}: {ex}", flush=True)
                    cur.execute(
                        "INSERT INTO video_payloads (module_id, transcode_status, transcode_error) "
                        "VALUES (%s, 'FAILED', %s) "
                        "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'FAILED', transcode_error = EXCLUDED.transcode_error",
                        (module_id, str(ex)[:400])
                    )

            # Clean up empty dummy chapters (0 modules) in core subjects
            cur.execute("""
                DELETE FROM chapters 
                WHERE subject_id IN (SELECT id FROM subjects WHERE name IN ('Mathematics', 'Science', 'Social Science', 'English'))
                AND id NOT IN (SELECT DISTINCT chapter_id FROM modules WHERE chapter_id IS NOT NULL)
            """)

    print("\n=== Video Ingestion and Curriculum Seeding Complete! ===")


def _seed_complementary_labs_and_quizzes(cur):
    """Ensure key virtual labs and quizzes exist alongside videos for rich multi-asset browsing."""
    print("\n--- Seeding Complementary Virtual Labs & Practice Quizzes ---")
    
    # 1. Mathematics -> Quadratic Equations -> Algebra Tiles Lab
    cur.execute("SELECT id FROM subjects WHERE name = 'Mathematics' AND standard_grade = '10'")
    row = cur.fetchone()
    if row:
        math_id = row[0]
        cur.execute("SELECT id FROM chapters WHERE subject_id = %s AND name = 'Quadratic Equations'", (math_id,))
        ch_row = cur.fetchone()
        if ch_row:
            ch_id = ch_row[0]
            cur.execute("SELECT id FROM modules WHERE chapter_id = %s AND title = 'Algebra Tiles — AC Method Factorization'", (ch_id,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
                    "VALUES (%s, 'Algebra Tiles — AC Method Factorization', 'LAB', 2, true) RETURNING id",
                    (ch_id,)
                )
                lab_mod_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, validation_rules) "
                    "VALUES (%s, 'VIRTUAL_LAB', 'Drag and arrange algebra tiles to factor quadratic trinomials.', '{}') "
                    "ON CONFLICT (module_id) DO NOTHING",
                    (lab_mod_id,)
                )
                print("  [+] Added Lab: Algebra Tiles Quadratic Factorization")

        # 2. Mathematics -> Arithmetic Progressions -> Practice Quiz
        cur.execute("SELECT id FROM chapters WHERE subject_id = %s AND name = 'Arithmetic Progressions'", (math_id,))
        ap_ch_row = cur.fetchone()
        if ap_ch_row:
            ap_ch_id = ap_ch_row[0]
            cur.execute("SELECT id FROM modules WHERE chapter_id = %s AND title = 'Arithmetic Progressions — Socratic Mastery Quiz'", (ap_ch_id,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
                    "VALUES (%s, 'Arithmetic Progressions — Socratic Mastery Quiz', 'QUIZ', 2, true) RETURNING id",
                    (ap_ch_id,)
                )
                quiz_mod_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO quiz_configurations (module_id, time_limit_minutes, passing_percentage, selection_rules, max_attempts) "
                    "VALUES (%s, 15, 70, '{\"total_questions\": 5}', 3) "
                    "ON CONFLICT (module_id) DO NOTHING",
                    (quiz_mod_id,)
                )
                print("  [+] Added Quiz: Arithmetic Progressions Mastery Quiz")

    # 3. Science -> Acids, Bases and Salts -> Titration Lab
    cur.execute("SELECT id FROM subjects WHERE name = 'Science' AND standard_grade = '10'")
    s_row = cur.fetchone()
    if s_row:
        sci_id = s_row[0]
        cur.execute("SELECT id FROM chapters WHERE subject_id = %s AND name = 'Acids, Bases and Salts'", (sci_id,))
        acid_ch_row = cur.fetchone()
        if acid_ch_row:
            acid_ch_id = acid_ch_row[0]
            cur.execute("SELECT id FROM modules WHERE chapter_id = %s AND title = 'Acid-Base Titration & Neutralization Lab'", (acid_ch_id,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
                    "VALUES (%s, 'Acid-Base Titration & Neutralization Lab', 'LAB', 2, true) RETURNING id",
                    (acid_ch_id,)
                )
                lab_mod_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, validation_rules) "
                    "VALUES (%s, 'VIRTUAL_LAB', 'Perform standard acid-base titration using phenolphthalein indicator.', '{}') "
                    "ON CONFLICT (module_id) DO NOTHING",
                    (lab_mod_id,)
                )
                print("  [+] Added Lab: Acid-Base Titration Lab")


if __name__ == "__main__":
    run_ingestion()
