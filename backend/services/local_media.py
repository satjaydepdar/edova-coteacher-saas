"""Local-disk media storage — a separate pipeline from services.s3_client.

Saves question diagram images under backend/storage/question_media/ instead
of S3, for bulk-importing from a local folder without needing AWS credentials.
Keys are stored with a "local:" prefix in authored_question_media.storage_key
so a future reader can tell at a glance which pipeline wrote a given row,
without needing a schema change or touching the S3 pipeline at all.
"""
import os

MEDIA_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "question_media"
)
KEY_PREFIX = "local:"


def save_bytes(key: str, data: bytes) -> str:
    """Writes data under MEDIA_ROOT/key and returns the storage_key to persist
    (KEY_PREFIX + key) — pass that straight into authored_question_media.storage_key."""
    path = os.path.join(MEDIA_ROOT, key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return KEY_PREFIX + key


def is_local_key(storage_key: str) -> bool:
    return storage_key.startswith(KEY_PREFIX)


def local_path(storage_key: str) -> str:
    """Resolves a "local:..." storage_key back to its file path on disk."""
    return os.path.join(MEDIA_ROOT, storage_key[len(KEY_PREFIX):])
