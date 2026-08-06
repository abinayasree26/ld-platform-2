-- ============================================
-- MIGRATION 030: Pre-generated Question Pool
-- A reusable bank of AI-generated questions organized by grade + level +
-- category. Used as the OFFLINE fallback when the AI server is unavailable,
-- and grown over time by auto-saving questions generated while online.
-- ============================================

CREATE TABLE IF NOT EXISTS question_pool (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope          VARCHAR(20) NOT NULL DEFAULT 'practice',  -- 'practice' | 'test'
  category       VARCHAR(50) NOT NULL,                      -- phonics, reading, writing, math, mixed
  grade          SMALLINT,                                  -- 1-12 (NULL = grade-agnostic)
  level          SMALLINT NOT NULL DEFAULT 1,               -- 1-5 difficulty
  ld_type        VARCHAR(30),                               -- dyslexia, dyscalculia, dysgraphia, mixed, not_detected
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL,                            -- ["A","B","C","D"]
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  source         VARCHAR(20) NOT NULL DEFAULT 'ai',         -- ai | manual
  times_served   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- avoid storing exact duplicates for the same slot
  UNIQUE (scope, category, grade, level, question_text)
);

CREATE INDEX IF NOT EXISTS idx_qpool_lookup ON question_pool(scope, category, grade, level);

-- Track which pooled questions a student has already seen, so offline serving
-- can rotate and avoid repeats across attempts.
CREATE TABLE IF NOT EXISTS student_seen_pool (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_pool(id) ON DELETE CASCADE,
  seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_pool_user ON student_seen_pool(user_id);
