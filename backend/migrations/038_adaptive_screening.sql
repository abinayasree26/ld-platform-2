-- ─────────────────────────────────────────────────────────────────
-- Migration 038 — Adaptive Screening (NEW English+Math skill assessment)
--
-- ADDITIVE ONLY. Does not touch any existing table (LD screening,
-- practice, tests, students, users). Safe to run on the shared DB.
-- Idempotent: uses IF NOT EXISTS everywhere.
-- ─────────────────────────────────────────────────────────────────

-- Match the UUID generator used by the existing LD tables (025/026).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- One row per screening attempt by a learner.
CREATE TABLE IF NOT EXISTS adaptive_screening_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL,
  status         TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress | completed
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  duration_seconds INTEGER,
  -- Full computed result object (overall levels, per-skill scores,
  -- strengths/weaknesses, recommended practice) as produced by the
  -- adaptiveScreeningEngine.buildScreeningResult(). Stored as JSONB.
  result_data    JSONB,
  -- The personalized next Level-Test blueprint (JSONB) from
  -- generateNextLevelTestBlueprint(). Null until computed.
  next_test_plan JSONB
);

CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_user
  ON adaptive_screening_sessions (user_id, started_at DESC);

-- One row per answered question within a session.
CREATE TABLE IF NOT EXISTS adaptive_screening_answers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID NOT NULL REFERENCES adaptive_screening_sessions(id) ON DELETE CASCADE,
  question_id    TEXT NOT NULL,          -- e.g. 'ENG-SPK-001' (from the bank)
  subject        TEXT,                   -- English | Mathematics
  skill          TEXT,
  difficulty     TEXT,
  question_type  TEXT,
  scoring_method TEXT,
  student_answer JSONB,                  -- string | array | object (ordering/matching)
  awarded        NUMERIC DEFAULT 0,      -- points awarded (objective or AI-filled)
  points         NUMERIC DEFAULT 1,
  is_correct     BOOLEAN,
  needs_ai       BOOLEAN DEFAULT FALSE,  -- true = pending STT/Gemma grade
  answered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_answers_session
  ON adaptive_screening_answers (session_id);
