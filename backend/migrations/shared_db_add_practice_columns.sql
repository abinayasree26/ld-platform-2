-- =====================================================================
-- SHARED DB PATCH — add Student-module columns to practice_sessions
-- =====================================================================
-- Adds ONLY the columns the student module's practice engine needs.
-- Uses ADD COLUMN IF NOT EXISTS — additive only, touches no existing data
-- and no other team member's tables. Safe to run once (and to re-run).
--
-- Target table: practice_sessions (student module's own table)
-- Run:
--   docker exec -it ld_postgres_new psql -U ld_user -d ld_platform
--   then paste this file's contents.
-- =====================================================================

BEGIN;

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS status           VARCHAR(20) NOT NULL DEFAULT 'completed';
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS exercises_total  SMALLINT DEFAULT 0;
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS exercises_correct SMALLINT DEFAULT 0;
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS level_at_start   SMALLINT DEFAULT 1;
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS level_at_end     SMALLINT DEFAULT 1;
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Score integrity guard (safe: only applies to the new columns)
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS chk_practice_correct_le_total;
ALTER TABLE practice_sessions
  ADD CONSTRAINT chk_practice_correct_le_total
  CHECK (exercises_correct IS NULL OR exercises_total IS NULL OR exercises_correct <= exercises_total);

COMMIT;

-- NOTE on user_id vs student_id:
-- The shared table uses "student_id" (FK to users). The student code was written
-- for "user_id". We adapt the CODE to use student_id (not add a duplicate column),
-- so no schema change is needed for that.

-- Verify:
--   \d practice_sessions
