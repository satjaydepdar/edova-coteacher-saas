"""Phase 4A tests: real bucket round-trips — list, put, exists, presign+GET, delete."""
import sys

import httpx
import s3_client

results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


BIO_PREFIX = "Class-10/Semester-01/Biology/Chapter-01/"
PROBE = "uploads/_phase4a_probe.txt"

# TC1: directory listing finds the real Biology content
keys = s3_client.list_keys(BIO_PREFIX)
videos = [k for k in keys if k.endswith(".mp4")]
ok = any(k.endswith("chapter 1 - life process.pdf") for k in keys) and len(videos) >= 2
check("list_keys: Biology chapter listing", ok, f"{len(keys)} keys, {len(videos)} mp4")

# TC2: exists() true/false paths
ok = s3_client.object_exists(videos[0]) and not s3_client.object_exists("uploads/definitely-not-here.xyz")
check("object_exists: true and false paths", ok, "")

# TC3: full write -> presign -> HTTP GET -> delete round-trip
payload = b"phase4a round-trip probe"
s3_client.put_bytes(PROBE, payload, "text/plain")
url = s3_client.presign_get(PROBE, expires=120)
r = httpx.get(url)
ok = r.status_code == 200 and r.content == payload
check("put + presign + GET round-trip", ok, f"GET={r.status_code} bytes={len(r.content)}")

# TC4: presigned URL for a nonexistent key is rejected by S3
r2 = httpx.get(s3_client.presign_get("uploads/never-uploaded.bin", expires=60))
check("presign on missing key -> S3 404", r2.status_code == 404, f"GET={r2.status_code}")

s3_client.delete_key(PROBE)
check("cleanup: probe deleted", not s3_client.object_exists(PROBE), "")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
