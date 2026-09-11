"""Phase 4A: S3 integration layer.

Presigned-GET strategy (not proxying): S3 serves the bytes, the API serves
short-lived URLs. Bandwidth and range-request handling stay off our server.
Credentials come from the AWS chain (profile edova-dev locally); never hardcoded.
"""
import os

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

S3_BUCKET = os.getenv("EDOVA_S3_BUCKET", "innuxai-edova-coteacher")
S3_REGION = os.getenv("EDOVA_S3_REGION", "ap-south-1")

# Segments are re-requested by the player every few seconds; 15 min covers a
# viewing session without leaving URLs valid for days.
PRESIGN_TTL_VIDEO = 4 * 60 * 60  # full lecture + long classroom pauses (was 15min: segments 403'd mid-playback)
PRESIGN_TTL_LAB = 60 * 60  # lab HTML is loaded once per iframe mount

_client = None


def client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3", region_name=S3_REGION, config=Config(signature_version="s3v4")
        )
    return _client


def presign_get(key: str, expires: int = PRESIGN_TTL_VIDEO) -> str:
    return client().generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=expires,
    )


def object_exists(key: str) -> bool:
    try:
        client().head_object(Bucket=S3_BUCKET, Key=key)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return False
        raise


def list_keys(prefix: str, max_keys: int = 1000) -> list[str]:
    """All object keys under a prefix (directory listing for HLS segments)."""
    keys: list[str] = []
    paginator = client().get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
        keys.extend(obj["Key"] for obj in page.get("Contents", []))
        if len(keys) >= max_keys:
            break
    return keys[:max_keys]


def put_bytes(key: str, data: bytes, content_type: str) -> None:
    """CMS upload path (Phase 2 admin endpoints consume this)."""
    client().put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)


def delete_key(key: str) -> None:
    client().delete_object(Bucket=S3_BUCKET, Key=key)
