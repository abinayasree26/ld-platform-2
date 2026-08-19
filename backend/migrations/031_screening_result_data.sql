-- ============================================
-- MIGRATION 031: Add result_data to screening_sessions
-- The screening /submit route stores the full classifier result JSON in
-- result_data, but the original table never had this column — causing the
-- INSERT to fail, so completed sessions were never saved and /status kept
-- returning screened:false (bouncing the student back to the assessment).
-- ============================================

ALTER TABLE screening_sessions
  ADD COLUMN IF NOT EXISTS result_data JSONB;
