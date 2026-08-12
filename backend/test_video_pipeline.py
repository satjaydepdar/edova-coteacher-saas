"""Video pipeline test runner (migration 013 + async transcode):
device-principal progress (heartbeat/resume/90% completion), async upload
202 -> poll -> READY/FAILED, manifest during processing. Requires API on :8000."""
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

import httpx
import psycopg
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email, password="testpass"):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


PLAT = {"Authorization": f"Bearer {login('admin@edova.dev')}"}

# --- Idempotent fixture: school + sub + key + published VIDEO module (via API where possible) ---
with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'VP School')")
    conn.execute("DELETE FROM activation_keys WHERE tenant_id IN (SELECT id FROM tenants WHERE name = 'VP School')")
    conn.execute("DELETE FROM tenants WHERE name = 'VP School'")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'VP Plan'")
    conn.execute("DELETE FROM subjects WHERE name = 'VP Science'")
    plan_id = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('VP Plan', 4, true, true, true) RETURNING id").fetchone()[0]

tenant = httpx.post(f"{BASE}/admin/tenants", json={"name": "VP School"}, headers=PLAT).json()["id"]
httpx.post(f"{BASE}/admin/tenants/{tenant}/subscriptions", headers=PLAT,
           json={"plan_id": str(plan_id), "start_date": "2026-01-01", "end_date": "2027-01-01",
                 "seat_count": 2}).raise_for_status()
key = httpx.post(f"{BASE}/admin/tenants/{tenant}/activation-keys",
                 json={"max_devices": 2}, headers=PLAT).json()["key_code"]

subject = httpx.post(f"{BASE}/admin/subjects", headers=PLAT,
                     json={"name": "VP Science", "standard_grade": "10", "sequence_order": 95}).json()["id"]
chapter = httpx.post(f"{BASE}/admin/subjects/{subject}/chapters", headers=PLAT,
                     json={"name": "VP Chapter", "sequence_order": 1}).json()["id"]
module = httpx.post(f"{BASE}/admin/chapters/{chapter}/modules", headers=PLAT,
                    json={"title": "VP Video", "module_type": "VIDEO", "sequence_order": 1}).json()["id"]
httpx.patch(f"{BASE}/admin/modules/{module}", json={"is_published": True}, headers=PLAT).raise_for_status()

# --- Device activation (classroom principal) ---
r = httpx.post(f"{BASE}/api/activation/activate", json={"key_code": key, "device_id": "vp-dev-1"})
check("device activates", r.status_code == 200, f"status={r.status_code}")
DEV = {"Authorization": f"Bearer {r.json()['access_token']}"}

# --- Device-principal progress: heartbeat, idempotency, 90% completion, resume read ---
r = httpx.get(f"{BASE}/api/student/progress/{module}", headers=DEV)
check("progress starts empty", r.status_code == 200 and r.json()["status"] == "not_started",
      f"body={r.json()}")

ev1 = str(uuid.uuid4())
r = httpx.post(f"{BASE}/api/student/progress", headers=DEV,
               json={"module_id": module, "progress_pct": 45, "time_spent_delta": 20,
                     "client_event_id": ev1})
check("heartbeat accepted (device)", r.status_code == 200 and r.json()["status"] == "in_progress"
      and r.json()["progress_pct"] == 45 and r.json()["time_counted"] is True, f"body={r.json()}")

r = httpx.post(f"{BASE}/api/student/progress", headers=DEV,
               json={"module_id": module, "progress_pct": 45, "time_spent_delta": 20,
                     "client_event_id": ev1})
check("duplicate event id not double-counted", r.status_code == 200 and r.json()["time_counted"] is False,
      f"body={r.json()}")

r = httpx.post(f"{BASE}/api/student/progress", headers=DEV,
               json={"module_id": module, "progress_pct": 92, "time_spent_delta": 30,
                     "client_event_id": str(uuid.uuid4())})
check(">=90% marks completed", r.status_code == 200 and r.json()["completed"] is True
      and r.json()["time_spent"] == 50, f"body={r.json()}")

r = httpx.get(f"{BASE}/api/student/progress/{module}", headers=DEV)
check("resume read returns saved pct", r.status_code == 200 and r.json()["progress_pct"] == 92
      and r.json()["status"] == "completed", f"body={r.json()}")

with psycopg.connect(DB_DSN) as conn:
    row = conn.execute("SELECT student_id, activation_key_id FROM student_progress WHERE module_id = %s",
                       (module,)).fetchone()
check("row keyed by activation key", row is not None and row[0] is None and row[1] is not None,
      f"row={row}")

r = httpx.post(f"{BASE}/api/student/progress", headers=DEV,
               json={"module_id": module, "progress_pct": 50, "time_spent_delta": 10,
                     "client_event_id": "not-a-uuid"})
check("non-uuid event id -> 422", r.status_code == 422, f"status={r.status_code}")

# --- Async transcode: 202 -> poll -> READY ---
clip = Path(tempfile.gettempdir()) / "vp_test.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=duration=3:size=320x240:rate=15",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
                "-c:v", "libx264", "-c:a", "aac", "-shortest", str(clip)],
               capture_output=True, check=True)

r = httpx.post(f"{BASE}/admin/modules/{module}/video-upload",
               files={"file": ("vp_test.mp4", clip.read_bytes(), "video/mp4")}, headers=PLAT)
check("upload returns 202 PROCESSING", r.status_code == 202 and r.json()["status"] == "PROCESSING",
      f"status={r.status_code} body={r.json()}")

deadline = time.time() + 90
status = None
while time.time() < deadline:
    status = httpx.get(f"{BASE}/admin/modules/{module}/video-status", headers=PLAT).json()
    if status["status"] != "PROCESSING":
        break
    time.sleep(2)
check("transcode reaches READY", status and status["status"] == "READY"
      and status["duration_seconds"] >= 2 and status["s3_key_prefix"], f"status={status}")

r = httpx.get(f"{BASE}/api/student/video/{module}/manifest", headers=DEV)
check("manifest serves presigned segments", r.status_code == 200
      and "#EXTM3U" in r.text and "X-Amz-Signature" in r.text,
      f"status={r.status_code} lines={len(r.text.splitlines())}")

# --- FAILED path: garbage bytes ---
r = httpx.post(f"{BASE}/admin/modules/{module}/video-upload",
               files={"file": ("junk.mp4", b"not a video at all", "video/mp4")}, headers=PLAT)
deadline = time.time() + 60
status = None
while time.time() < deadline:
    status = httpx.get(f"{BASE}/admin/modules/{module}/video-status", headers=PLAT).json()
    if status["status"] != "PROCESSING":
        break
    time.sleep(2)
check("garbage upload lands FAILED with error", status and status["status"] == "FAILED"
      and status["error"], f"status={status}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed" + (f" — FAILED: {failed}" if failed else ""))
raise SystemExit(1 if failed else 0)
