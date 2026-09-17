import psycopg
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from core import DB_DSN

create_tables_sql = '''
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    event_type VARCHAR(50) NOT NULL DEFAULT 'class',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id, start_at);

CREATE TABLE IF NOT EXISTS section_syllabus_pacing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, section_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_pacing_section ON section_syllabus_pacing(section_id);
'''

with psycopg.connect(DB_DSN) as conn:
    conn.execute(create_tables_sql)
    
    # Check if events exist
    count = conn.execute("SELECT count(*) FROM calendar_events").fetchone()[0]
    if count == 0:
        tenants = conn.execute("SELECT id FROM tenants").fetchall()
        for (t_id,) in tenants:
            user_row = conn.execute("SELECT user_id FROM user_tenant_mappings WHERE tenant_id = %s LIMIT 1", (t_id,)).fetchone()
            u_id = user_row[0] if user_row else None
            conn.execute('''
                INSERT INTO calendar_events (tenant_id, user_id, title, description, event_type, start_at, end_at, all_day)
                VALUES
                    (%s, %s, 'Class 10A - Quadratic Equations', 'Standard period covering factoring & discriminant', 'class', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', FALSE),
                    (%s, %s, 'Mid-Term Math Exam', 'CBSE Term-1 Assessment on Units I & II', 'exam', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 3 hours', FALSE),
                    (%s, %s, 'Homework 3 Due: Trigonometric Identities', 'Submit problem set 1-15', 'homework', NOW() + INTERVAL '4 days', NULL, TRUE),
                    (%s, %s, 'Staff Pedagogy Meeting', 'Monthly co-teaching sync and NEP-2020 review', 'meeting', NOW() + INTERVAL '5 days 2 hours', NOW() + INTERVAL '5 days 3 hours', FALSE),
                    (%s, %s, 'National Holiday - Gandhi Jayanti', 'School closed', 'holiday', NOW() + INTERVAL '10 days', NULL, TRUE)
            ''', (t_id, u_id, t_id, u_id, t_id, u_id, t_id, u_id, t_id, u_id))
    conn.commit()
    print("Milestone 1 database migration completed successfully!")
