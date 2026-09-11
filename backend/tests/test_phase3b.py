"""Phase 3B test runner: locked flags, IDOR 404, empty-chapter omission, Coming Soon, N+1."""

import httpx
import psycopg
from main import DB_DSN

from testutil import BASE, check, finish, login


def tree(token, subject_id):
    return httpx.get(f"{BASE}/api/student/content/subjects/{subject_id}/tree",
                     headers={"Authorization": f"Bearer {token}"})


def ensure_fixtures():
    """Idempotent seed for the shared 'Global Physics' curriculum this suite asserts on.

    No seed script ever created the subject/chapter/modules (they came from a wiped demo
    seed), so the suite recreates them itself. Existence-check by natural key before every
    INSERT; ON CONFLICT is only a backstop (modules/chapters have UNIQUE seq constraints,
    subjects do NOT for tenant_id NULL). Aligned with the other suites' seeds — running any
    of them first makes this a no-op. Shared curriculum is intentionally NOT cleaned up:
    test_phase7/teacher/4bc reference the same rows."""
    with psycopg.connect(DB_DSN, autocommit=True) as conn:
        physics = conn.execute(
            "SELECT id FROM subjects WHERE name = 'Global Physics' AND tenant_id IS NULL"
        ).fetchone()
        if physics is None:
            physics = conn.execute(
                "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                "VALUES (NULL, 'Global Physics', '10th Grade', 9) RETURNING id").fetchone()
        physics_id = physics[0]

        def ensure_chapter(name, seq):
            # By name, not seq: a sibling suite may have created the chapter at a
            # different sequence_order — reuse it instead of duplicating. Prefer the
            # canonical seq when duplicates from pre-alignment runs still exist.
            row = conn.execute(
                "SELECT id FROM chapters WHERE subject_id = %s AND name = %s "
                "ORDER BY (sequence_order = %s) DESC, created_at LIMIT 1",
                (physics_id, name, seq)).fetchone()
            if row is None:
                row = conn.execute(
                    "INSERT INTO chapters (subject_id, name, sequence_order) VALUES (%s, %s, %s) "
                    "ON CONFLICT (subject_id, sequence_order) DO NOTHING RETURNING id",
                    (physics_id, name, seq)).fetchone() or conn.execute(
                    "SELECT id FROM chapters WHERE subject_id = %s AND sequence_order = %s",
                    (physics_id, seq)).fetchone()
            return row[0]

        def ensure_module(chapter_id, title, mtype, seq, published=True):
            row = conn.execute("SELECT id FROM modules WHERE chapter_id = %s AND title = %s",
                               (chapter_id, title)).fetchone()
            if row is None:
                row = conn.execute(
                    "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
                    "VALUES (%s, %s, %s, %s, %s) "
                    "ON CONFLICT (chapter_id, sequence_order) DO NOTHING RETURNING id",
                    (chapter_id, title, mtype, seq, published)).fetchone() or conn.execute(
                    "SELECT id FROM modules WHERE chapter_id = %s AND title = %s",
                    (chapter_id, title)).fetchone()
            return row[0]

        ch4 = ensure_chapter("Chapter 4: Thermodynamics", 4)
        ensure_module(ch4, "Intro to Heat", "VIDEO", 1)
        lab_mod = ensure_module(ch4, "Heat Transfer Virtual Lab", "LAB", 2)
        ensure_module(ch4, "PYQ: Thermodynamics 2023", "QUIZ", 5)
        # Published VIDEO with NO video_payload -> thumbnail_url NULL ("Coming Soon")
        ensure_module(ch4, "Coming Soon: Advanced Heat", "VIDEO", 6)
        # Lab payload so entitled tiers can actually open the lab
        conn.execute(
            "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, "
            "validation_rules) VALUES (%s, 'VIRTUAL_LAB', '# Heat Transfer Virtual Lab', '{}'::jsonb) "
            "ON CONFLICT (module_id) DO NOTHING", (lab_mod,))

        # Chapter whose only module is a draft -> must be stripped from the student tree
        draft_ch = ensure_chapter("Draft-Only Chapter", 100)
        ensure_module(draft_ch, "Unpublished Draft Video", "VIDEO", 1, published=False)

        # Shelbyville: another school's tenant + private subject (cross-tenant IDOR target)
        shelby = conn.execute("SELECT id FROM tenants WHERE name = 'Shelbyville School'").fetchone()
        if shelby is None:
            shelby = conn.execute(
                "INSERT INTO tenants (name, type, status) VALUES ('Shelbyville School', 'SCHOOL', 'ACTIVE') "
                "ON CONFLICT DO NOTHING RETURNING id").fetchone() or conn.execute(
                "SELECT id FROM tenants WHERE name = 'Shelbyville School'").fetchone()
        if conn.execute("SELECT 1 FROM subjects WHERE name = 'Shelbyville Secret Science' "
                        "AND tenant_id = %s", (shelby[0],)).fetchone() is None:
            conn.execute(
                "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
                "VALUES (%s, 'Shelbyville Secret Science', '10th Grade', 1) ON CONFLICT DO NOTHING",
                (shelby[0],))


ensure_fixtures()

with psycopg.connect(DB_DSN) as conn:
    physics_id, shelby_subject_id = conn.execute(
        "SELECT (SELECT id FROM subjects WHERE name = 'Global Physics'),"
        "       (SELECT id FROM subjects WHERE name = 'Shelbyville Secret Science')"
    ).fetchone()

tok_tc1 = login("tc1.student@test.dev")  # tier 1: video only
tok_tc3 = login("tc3.student@test.dev")  # tier 4: everything

r = tree(tok_tc1, physics_id)
body = r.json()
# Tree nests modules under chapters[].topics[] (migration 012); flatten for assertions.
mods = {m["title"]: m for c in body["chapters"] for t in c["topics"] for m in t["modules"]}

# TC1: locked/unlocked dict logic (tier 1)
ok = (r.status_code == 200
      and mods["Intro to Heat"]["locked"] is False
      and mods["Heat Transfer Virtual Lab"]["locked"] is True
      and mods["PYQ: Thermodynamics 2023"]["locked"] is True)
check("TC1 locked flags (tier 1)", ok, f"video={mods['Intro to Heat']['locked']} "
      f"lab={mods['Heat Transfer Virtual Lab']['locked']} quiz={mods['PYQ: Thermodynamics 2023']['locked']}")

# TC2: cross-tenant IDOR -> 404 (not 403)
r2 = tree(tok_tc1, shelby_subject_id)
check("TC2 cross-tenant subject -> 404", r2.status_code == 404, f"status={r2.status_code}")

# TC3: chapter with only draft modules is omitted entirely
ok = "Draft-Only Chapter" not in {c["chapter_name"] for c in body["chapters"]}
check("TC3 draft-only chapter omitted", ok, f"chapters={[c['chapter_name'] for c in body['chapters']]}")

# TC4: published video module without payload -> thumbnail_url null (Coming Soon)
ok = mods["Coming Soon: Advanced Heat"]["thumbnail_url"] is None
check("TC4 coming-soon thumbnail null", ok, f"thumb={mods['Coming Soon: Advanced Heat']['thumbnail_url']!r}")

# TC5: N+1 guard — bounded query count, independent of content size (currently 2:
# 1 entitlement + 1 tree; allowance for one extra lookup without masking an N+1)
qc = r.headers.get("X-Query-Count")
check("TC5 bounded query count", qc is not None and int(qc) <= 3,
      f"X-Query-Count={qc} (entitlement + tree, <= 3)")

# Control: tier-4 student sees everything unlocked
r3 = tree(tok_tc3, physics_id)
locks = {m["title"]: m["locked"] for c in r3.json()["chapters"] for t in c["topics"] for m in t["modules"]}
check("CTRL tier 4 all unlocked", all(v is False for v in locks.values()), f"locks={locks}")

finish()
