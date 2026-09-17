"""Audit trail + human-review queue for the Astra video generation pipeline (spec doc
section 14). Every question submitted is recorded here with its full ProblemAnalysis/
Solution/verification/pedagogy output, regardless of outcome -- so a FAILED or
NEEDS_HUMAN_REVIEW result is inspectable, not silently dropped."""
import sys

sys.path.insert(0, r'c:\Users\pvsat\projects\pro_edova_coteacher_v0\edova-coteacher-saas\backend')
from core import db

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS video_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    question_metadata JSONB NOT NULL DEFAULT '{}',
    problem_analysis JSONB,
    solution_steps JSONB,
    verification_result JSONB,
    teaching_sequence JSONB,
    video_spec JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        -- PENDING, AUTO_APPROVED, NEEDS_HUMAN_REVIEW, FAILED
    review_status VARCHAR(20),  -- NULL until an admin acts: APPROVED, REJECTED
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    video_id VARCHAR(200),
    error TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_status ON video_generation_jobs(status);
"""


def main():
    print("Creating video_generation_jobs table...")
    with db() as conn:
        conn.execute(MIGRATION_SQL)
        conn.commit()
    print("Migration executed successfully.")


if __name__ == "__main__":
    main()
