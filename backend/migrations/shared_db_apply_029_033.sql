-- =====================================================================
-- SHARED DB PATCH — apply Student-module migrations 029–033 to ld_platform
-- =====================================================================
-- Purpose: add ONLY the new tables/columns/constraints introduced by the
-- student module (migrations 029–033) to the shared Proxmox database, WITHOUT
-- running the full migration set and WITHOUT touching any of Sree's tables.
--
-- Safe to run once (and idempotent — safe to re-run). Review with Sree before
-- applying to the shared production DB.
--
-- Run:
--   docker exec -i ld_postgres_new psql -U ld_user -d ld_platform < shared_db_apply_029_033.sql
-- (or paste the contents into psql connected to ld_platform)
-- =====================================================================

BEGIN;

-- ── 029: ai_generated flag on question tables ───────────────────────
ALTER TABLE test_questions
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE test_questions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_test_questions_ai ON test_questions(ai_generated);

ALTER TABLE screening_questions
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 030: offline question pool + seen-tracking ──────────────────────
CREATE TABLE IF NOT EXISTS question_pool (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope          VARCHAR(20) NOT NULL DEFAULT 'practice',
  category       VARCHAR(50) NOT NULL,
  grade          SMALLINT,
  level          SMALLINT NOT NULL DEFAULT 1,
  ld_type        VARCHAR(30),
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  source         VARCHAR(20) NOT NULL DEFAULT 'ai',
  times_served   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, category, grade, level, question_text)
);
CREATE INDEX IF NOT EXISTS idx_qpool_lookup ON question_pool(scope, category, grade, level);

CREATE TABLE IF NOT EXISTS student_seen_pool (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_pool(id) ON DELETE CASCADE,
  seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_seen_pool_user ON student_seen_pool(user_id);

-- ── 031: result_data on screening_sessions ──────────────────────────
ALTER TABLE screening_sessions
  ADD COLUMN IF NOT EXISTS result_data JSONB;

-- ── 032: de-duplicate screening_questions + unique order_index ──────
DELETE FROM screening_questions a
USING screening_questions b
WHERE a.ctid < b.ctid
  AND a.order_index = b.order_index;
CREATE UNIQUE INDEX IF NOT EXISTS uq_screening_questions_order_index
  ON screening_questions(order_index);

-- ── 033: practice score integrity guard ─────────────────────────────
UPDATE practice_sessions
SET exercises_correct = exercises_total
WHERE exercises_correct > exercises_total;
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS chk_practice_correct_le_total;
ALTER TABLE practice_sessions
  ADD CONSTRAINT chk_practice_correct_le_total
  CHECK (exercises_correct IS NULL OR exercises_total IS NULL OR exercises_correct <= exercises_total);

COMMIT;

-- Done. Verify:
--   SELECT COUNT(*) FROM question_pool;
--   \d screening_sessions   (should show result_data)
