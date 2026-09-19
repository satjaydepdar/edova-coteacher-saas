"""Bulk-import authored questions (text, options/answers, and optional diagram
images) straight into the DB — the same tables POST /admin/questions/bulk and
POST /admin/questions/{id}/media write to, just without going through HTTP/auth.
Use this for a large one-off import; use the HTTP endpoints for anything driven
by an app or script that already holds a bearer token.

Usage:
    python scripts/bulk_import_questions.py manifest.json
    python scripts/bulk_import_questions.py manifest.json --draft --as-user teacher@tc1school.dev

Manifest is a JSON array of:
{
  "chapter_id": "<uuid>",              # required — look up via GET /api/student/practice/chapters
  "topic_id": "<uuid>",                # optional, must belong to chapter_id
  "question_type": "MCQ",              # MCQ, MCQ_COMBINATION, ASSERTION_REASONING, SHORT_ANSWER,
                                        # LONG_ANSWER, FILL_IN_THE_BLANKS, MATCH_THE_FOLLOWING,
                                        # NUMERICAL, CASE_STUDY
  "question_text": "...",
  "marks": 1,
  "difficulty": "EASY",                # EASY, MEDIUM, HARD — optional
  "options": [{"key": "A", "text": "...", "correct": true}, ...],   # MCQ-shaped types only
  "passage": "...",                    # optional
  "explanation": "...",                # optional
  "diagrams": ["figs/q1.png", "figs/q1b.png"]   # optional, local file paths
}

By default every question lands as PUBLISHED (there's no review/publish screen
yet, so that's what makes a bulk import immediately usable in the Assessment
Builder's "Import from Question Bank"). Pass --draft to land them as DRAFT.

Diagrams save to a local folder (services/local_media.py) by default — no S3
credentials needed. Pass --s3 to use the existing S3 pipeline (services/s3_client.py)
instead; that pipeline is untouched, just not the default for this script.
"""
import argparse
import json
import mimetypes
import secrets
import sys
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

import _bootstrap  # noqa: F401
from main import DB_DSN
from core import DIFFICULTIES, sanitize_plain_text, sanitize_rich_text
from services import local_media, s3_client

QUESTION_TYPES = {
    "MCQ", "MCQ_COMBINATION", "ASSERTION_REASONING", "SHORT_ANSWER", "LONG_ANSWER",
    "FILL_IN_THE_BLANKS", "MATCH_THE_FOLLOWING", "NUMERICAL", "CASE_STUDY",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("manifest", help="Path to the JSON manifest file")
    parser.add_argument("--draft", action="store_true", help="Land questions as DRAFT instead of PUBLISHED")
    parser.add_argument("--as-user", help="Email of the user to record as created_by (defaults to the oldest user in the DB)")
    parser.add_argument("--s3", action="store_true", help="Upload diagrams to S3 instead of the local storage/question_media/ folder")
    args = parser.parse_args()

    rows = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        sys.exit("manifest must be a JSON array of question objects")

    status = "DRAFT" if args.draft else "PUBLISHED"
    print(f"Diagram storage: {'S3' if args.s3 else 'local (storage/question_media/)'}")

    with psycopg.connect(DB_DSN, autocommit=True) as conn:
        if args.as_user:
            row = conn.execute("SELECT id FROM users WHERE email = %s", (args.as_user,)).fetchone()
            if row is None:
                sys.exit(f"no user found with email {args.as_user}")
        else:
            row = conn.execute("SELECT id FROM users ORDER BY created_at LIMIT 1").fetchone()
            if row is None:
                sys.exit("no users exist in this DB — pass --as-user or seed one first")
        created_by = row[0]

        created, skipped = 0, []
        for i, item in enumerate(rows):
            qtype = item.get("question_type")
            text = (item.get("question_text") or "").strip()
            difficulty = item.get("difficulty")
            chapter_id = item.get("chapter_id")

            if qtype not in QUESTION_TYPES:
                skipped.append((i, f"invalid question_type: {qtype}")); continue
            if difficulty is not None and difficulty not in DIFFICULTIES:
                skipped.append((i, f"invalid difficulty: {difficulty}")); continue
            if not text:
                skipped.append((i, "empty question_text")); continue
            if not chapter_id:
                skipped.append((i, "missing chapter_id")); continue

            chapter_row = conn.execute("SELECT id FROM chapters WHERE id = %s", (chapter_id,)).fetchone()
            if chapter_row is None:
                skipped.append((i, f"chapter not found: {chapter_id}")); continue

            topic_id = item.get("topic_id")
            if topic_id:
                trow = conn.execute("SELECT chapter_id FROM topics WHERE id = %s", (topic_id,)).fetchone()
                if trow is None or str(trow[0]) != str(chapter_id):
                    skipped.append((i, "topic_id does not belong to chapter_id")); continue

            options = [
                {"key": o["key"], "text": sanitize_rich_text(o.get("text", "")), "correct": bool(o.get("correct"))}
                for o in item.get("options", [])
            ]
            question_text = sanitize_rich_text(text)
            passage = sanitize_rich_text(item.get("passage"))
            explanation = sanitize_rich_text(item.get("explanation"))
            source_papers = [sanitize_plain_text(s) for s in item.get("source_papers", []) if sanitize_plain_text(s)]
            marks = item.get("marks", 1)

            qid = conn.execute(
                "INSERT INTO authored_questions (chapter_id, created_by, topic_id, source_papers, status) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (chapter_id, created_by, topic_id, Jsonb(source_papers), status),
            ).fetchone()[0]
            vid = conn.execute(
                "INSERT INTO authored_question_versions "
                "(question_id, version_no, question_type, question_text, marks, difficulty, options, "
                " passage, explanation, created_by) "
                "VALUES (%s, 1, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (qid, qtype, question_text, marks, difficulty, Jsonb(options), passage, explanation, created_by),
            ).fetchone()[0]
            conn.execute("UPDATE authored_questions SET current_version_id = %s WHERE id = %s", (vid, qid))

            # Diagrams: attach each local image to this version. Local folder by
            # default (services/local_media.py); --s3 switches to the existing,
            # untouched S3 pipeline (services/s3_client.py) instead.
            for seq, img_path in enumerate(item.get("diagrams", [])):
                p = Path(img_path)
                if not p.is_file():
                    skipped.append((i, f"diagram not found: {img_path}"))
                    continue
                data = p.read_bytes()
                content_type = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
                raw_key = f"question-media/{vid}/{secrets.token_hex(16)}{p.suffix}"
                if args.s3:
                    s3_client.put_bytes(raw_key, data, content_type)
                    storage_key = raw_key
                else:
                    storage_key = local_media.save_bytes(raw_key, data)
                conn.execute(
                    "INSERT INTO authored_question_media "
                    "(question_version_id, storage_key, file_name, mime_type, file_size, caption, "
                    " sequence_order, uploaded_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                    (vid, storage_key, p.name, content_type, len(data), item.get("diagram_caption"), seq, created_by),
                )

            created += 1
            print(f"[{i}] created question {qid} ({qtype}, {status})")

        print(f"\n{created} created, {len(skipped)} skipped, status={status}")
        for i, reason in skipped:
            print(f"  skip [{i}]: {reason}")


if __name__ == "__main__":
    main()
