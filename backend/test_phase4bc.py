"""Phase 4B/4C tests: HLS manifest from S3 listing + lab simulation presign."""
import sys

import httpx
import psycopg
from main import DB_DSN

BASE = "http://127.0.0.1:8000"
results = []


def check(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{detail}]")


def login(email):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": "testpass"})
    r.raise_for_status()
    return r.json()["access_token"]


with psycopg.connect(DB_DSN) as conn:
    vid_mod, soon_mod, lab_mod = conn.execute(
        "SELECT (SELECT id FROM modules WHERE title = 'Intro to Heat'),"
        "       (SELECT id FROM modules WHERE title = 'Coming Soon: Advanced Heat'),"
        "       (SELECT id FROM modules WHERE title = 'Heat Transfer Virtual Lab')"
    ).fetchone()

tok3 = login("tc3.student@test.dev")  # tier 4
tok1 = login("tc1.student@test.dev")  # tier 1: video only
H3 = {"Authorization": f"Bearer {tok3}"}
H1 = {"Authorization": f"Bearer {tok1}"}

# --- 4B: manifest generated from S3 segment listing ---
r = httpx.get(f"{BASE}/api/student/video/{vid_mod}/manifest", headers=H3)
body = r.text
seg_urls = [l for l in body.splitlines() if l.startswith("http")]
ok = (r.status_code == 200 and body.startswith("#EXTM3U") and "#EXT-X-ENDLIST" in body
      and len(seg_urls) == 3 and all("X-Amz-Signature=" in u for u in seg_urls))
check("4B: manifest has 3 presigned segments", ok,
      f"status={r.status_code} segments={len(seg_urls)}")

# segment URL actually plays (S3 200 + MPEG-TS sync byte 0x47)
r_seg = httpx.get(seg_urls[0]) if seg_urls else None
seg_status = r_seg.status_code if r_seg else "n/a"
seg_sync = repr(r_seg.content[:1]) if r_seg else ""
ok = r_seg is not None and r_seg.status_code == 200 and r_seg.content[:1] == b"\x47"
check("4B: first segment downloads as valid MPEG-TS", ok, f"GET={seg_status} sync={seg_sync}")

# module without payload -> 404 Coming Soon
r = httpx.get(f"{BASE}/api/student/video/{soon_mod}/manifest", headers=H3)
check("4B: video without payload -> 404", r.status_code == 404, f"status={r.status_code}")

# tier-1 student HAS video -> 200 (gate is allow_video, not tier number)
r = httpx.get(f"{BASE}/api/student/video/{vid_mod}/manifest", headers=H1)
check("4B: tier-1 (video allowed) -> 200", r.status_code == 200, f"status={r.status_code}")

# --- 4C: lab simulation presign ---
r = httpx.get(f"{BASE}/api/student/lab/{lab_mod}/simulation", headers=H3)
ok = r.status_code == 200 and "simulation_url" in r.json()
sim_url = r.json().get("simulation_url", "")
check("4C: simulation endpoint returns presigned URL", ok, f"status={r.status_code}")

r_sim = httpx.get(sim_url) if sim_url else None
ok = r_sim is not None and r_sim.status_code == 200 and "EDOVA_SIMULATION_MARKER" in r_sim.text
check("4C: simulation HTML loads from S3", ok, f"GET={r_sim.status_code if r_sim else 'n/a'}")

# tier-1 student has NO lab -> 403
r = httpx.get(f"{BASE}/api/student/lab/{lab_mod}/simulation", headers=H1)
check("4C: tier-1 -> 403", r.status_code == 403, f"status={r.status_code}")

# bogus module -> 404 (IDOR-safe)
import uuid
r = httpx.get(f"{BASE}/api/student/video/{uuid.uuid4()}/manifest", headers=H3)
check("4B: unknown module -> 404", r.status_code == 404, f"status={r.status_code}")

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
