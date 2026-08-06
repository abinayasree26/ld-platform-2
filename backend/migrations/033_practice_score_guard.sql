-- ============================================
-- MIGRATION 033: Practice score integrity guard
-- Prevents exercises_correct from ever exceeding exercises_total, which
-- caused impossible scores like 120% on the dashboard. Old bad rows are
-- capped first, then a CHECK constraint enforces it going forward.
-- ============================================

-- 1) Cap any existing bad rows (defensive — should already be clean)
UPDATE practice_sessions
SET exercises_correct = exercises_total
WHERE exercises_correct > exercises_total;

-- 2) Enforce it at the database level so it can never happen again.
--    Drop first in case a partial version exists, then add.
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS chk_practice_correct_le_total;

ALTER TABLE practice_sessions
  ADD CONSTRAINT chk_practice_correct_le_total
  CHECK (exercises_correct IS NULL OR exercises_total IS NULL OR exercises_correct <= exercises_total);
