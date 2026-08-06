-- ============================================
-- MIGRATION 029: Mark AI-generated questions
-- Adds an ai_generated flag to test_questions and screening_questions so
-- AI-created (ephemeral, per-attempt) questions can be identified, excluded
-- from the shared seeded pool, and cleaned up later.
-- ============================================

ALTER TABLE test_questions
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE test_questions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_test_questions_ai ON test_questions(ai_generated);

-- Optional: same flag on screening_questions for future use
ALTER TABLE screening_questions
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;
