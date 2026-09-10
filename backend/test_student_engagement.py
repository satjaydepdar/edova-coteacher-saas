"""Engagement block on GET /api/teacher/analytics/student/{student_id}: real data from
student_progress/progress_events/student_quiz_attempts, joined only when student_id is a
real users.id belonging to the caller's own tenant as a STUDENT (mastery telemetry's
student_id is often a free-form demo string with no such row -- must degrade to zero,
not error, for those; proven at the bottom as a non-regression check on gap #1)."""

import psycopg
import httpx
from main import DB_DSN, hash_password

from testutil import BASE, check, finish, login

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM progress_events WHERE student_id IN "
                 "(SELECT id FROM users WHERE email LIKE 'studentengagementtest.%@test.dev')")
    conn.execute("DELETE FROM student_quiz_attempts WHERE student_id IN "
                 "(SELECT id FROM users WHERE email LIKE 'studentengagementtest.%@test.dev')")
    conn.execute("DELETE FROM student_progress WHERE student_id IN "
                 "(SELECT id FROM users WHERE email LIKE 'studentengagementtest.%@test.dev')")
    conn.execute("DELETE FROM user_tenant_mappings WHERE user_id IN "
                 "(SELECT id FROM users WHERE email LIKE 'studentengagementtest.%@test.dev')")
    conn.execute("DELETE FROM modules WHERE chapter_id IN (SELECT id FROM chapters WHERE subject_id IN "
                 "(SELECT id FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentEngagementTest Tenant')))")
    conn.execute("DELETE FROM chapters WHERE subject_id IN (SELECT id FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentEngagementTest Tenant'))")
    conn.execute("DELETE FROM subjects WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentEngagementTest Tenant')")
    conn.execute("DELETE FROM sections WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentEngagementTest Tenant')")
    conn.execute("DELETE FROM subscriptions WHERE tenant_id IN "
                 "(SELECT id FROM tenants WHERE name = 'StudentEngagementTest Tenant')")
    conn.execute("DELETE FROM subscription_plans WHERE name = 'StudentEngagementTest Plan'")
    conn.execute("DELETE FROM tenants WHERE name = 'StudentEngagementTest Tenant'")
    conn.execute("DELETE FROM users WHERE email LIKE 'studentengagementtest.%@test.dev'")

    tid = conn.execute(
        "INSERT INTO tenants (name, type, status) VALUES ('StudentEngagementTest Tenant', 'SCHOOL', 'ACTIVE') "
        "RETURNING id"
    ).fetchone()[0]
    pid = conn.execute(
        "INSERT INTO subscription_plans (name, tier_level, allow_video, allow_lab, allow_quiz) "
        "VALUES ('StudentEngagementTest Plan', 4, true, true, true) RETURNING id"
    ).fetchone()[0]
    conn.execute("INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date) "
                 "VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + 365)", (tid, pid))
    teacher_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SE Teacher') RETURNING id",
        ("studentengagementtest.teacher@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'TEACHER')",
                 (teacher_uid, tid))

    student_uid = conn.execute(
        "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, 'SE Student') RETURNING id",
        ("studentengagementtest.student@test.dev", hash_password("testpass")),
    ).fetchone()[0]
    conn.execute("INSERT INTO user_tenant_mappings (user_id, tenant_id, role) VALUES (%s, %s, 'STUDENT')",
                 (student_uid, tid))

    subject_id = conn.execute(
        "INSERT INTO subjects (tenant_id, name, standard_grade, sequence_order) "
        "VALUES (%s, 'SE Subject', '9', 501) RETURNING id", (tid,)
    ).fetchone()[0]
    chapter_id = conn.execute(
        "INSERT INTO chapters (subject_id, name, sequence_order) VALUES (%s, 'SE Chapter', 1) RETURNING id",
        (subject_id,),
    ).fetchone()[0]
    mod_a = conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'SE Video A', 'VIDEO', 1, true) RETURNING id", (chapter_id,)
    ).fetchone()[0]
    mod_b = conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'SE Video B', 'VIDEO', 2, true) RETURNING id", (chapter_id,)
    ).fetchone()[0]
    quiz_mod = conn.execute(
        "INSERT INTO modules (chapter_id, title, module_type, sequence_order, is_published) "
        "VALUES (%s, 'SE Quiz', 'QUIZ', 3, true) RETURNING id", (chapter_id,)
    ).fetchone()[0]

    # 2 modules touched this week: 120s + 90s = 210s total, via progress_events (the windowed log).
    conn.execute(
        "INSERT INTO progress_events (student_id, module_id, delta_seconds, client_event_id, created_at) "
        "VALUES (%s, %s, 120, gen_random_uuid(), now() - interval '1 day')", (student_uid, mod_a)
    )
    conn.execute(
        "INSERT INTO progress_events (student_id, module_id, delta_seconds, client_event_id, created_at) "
        "VALUES (%s, %s, 90, gen_random_uuid(), now() - interval '2 days')", (student_uid, mod_b)
    )
    # An OLD event outside the 7-day window -- must not count toward "this week".
    conn.execute(
        "INSERT INTO progress_events (student_id, module_id, delta_seconds, client_event_id, created_at) "
        "VALUES (%s, %s, 999, gen_random_uuid(), now() - interval '30 days')", (student_uid, mod_a)
    )
    conn.execute(
        "INSERT INTO student_progress (student_id, module_id, status, progress_pct, time_spent, last_accessed) "
        "VALUES (%s, %s, 'in_progress', 50, 210, now() - interval '1 day')", (student_uid, mod_a)
    )
    conn.execute(
        "INSERT INTO student_quiz_attempts (student_id, module_id, chapter_id, score, total_questions, "
        "time_spent, submitted_at, answers) VALUES (%s, %s, %s, 4, 5, 60, now() - interval '1 day', '{}')",
        (student_uid, quiz_mod, chapter_id),
    )

T = {"Authorization": f"Bearer {login('studentengagementtest.teacher@test.dev')}"}

r = httpx.get(f"{BASE}/api/teacher/analytics/student/{student_uid}", headers=T)
check("student profile responds for a real student_id", r.status_code == 200, f"status={r.status_code} body={r.text}")
data = r.json() if r.status_code == 200 else {}
engagement = data.get("engagement", {})

check("time_spent_seconds_week sums only events within 7 days (210, not 1209)",
      engagement.get("time_spent_seconds_week") == 210, f"got={engagement.get('time_spent_seconds_week')}")
check("modules_touched_week counts distinct modules within 7 days (2, not counting the stale one twice)",
      engagement.get("modules_touched_week") == 2, f"got={engagement.get('modules_touched_week')}")
check("quiz_attempts_week counts the recent quiz attempt", engagement.get("quiz_attempts_week") == 1,
      f"got={engagement.get('quiz_attempts_week')}")
check("last_active is present (not null)", engagement.get("last_active") is not None,
      f"got={engagement.get('last_active')}")

# Regression: gap #1's demo-string student_id path must still degrade to zero engagement, not error.
r2 = httpx.get(f"{BASE}/api/teacher/analytics/student/some-demo-string-id", headers=T)
check("non-UUID student_id still responds 200 with zero engagement (no regression)",
      r2.status_code == 200 and r2.json().get("engagement", {}).get("time_spent_seconds_week") == 0,
      f"status={r2.status_code} body={r2.text}")

with psycopg.connect(DB_DSN, autocommit=True) as conn:
    conn.execute("DELETE FROM progress_events WHERE student_id = %s", (student_uid,))
    conn.execute("DELETE FROM student_quiz_attempts WHERE student_id = %s", (student_uid,))
    conn.execute("DELETE FROM student_progress WHERE student_id = %s", (student_uid,))

finish()
