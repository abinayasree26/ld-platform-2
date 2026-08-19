-- ============================================
-- MIGRATION 032: De-duplicate screening_questions + enforce uniqueness
-- The seed used ON CONFLICT (order_index) but order_index had no unique
-- constraint, so demo-seed rows + seeded rows produced duplicates (105 vs 100).
-- This removes duplicates (keeping one row per order_index) and adds a unique
-- index so duplicates can never be inserted again.
-- ============================================

-- 1) Remove duplicate rows, keeping the earliest ctid per order_index
DELETE FROM screening_questions a
USING screening_questions b
WHERE a.ctid < b.ctid
  AND a.order_index = b.order_index;

-- 2) Enforce uniqueness on order_index going forward
CREATE UNIQUE INDEX IF NOT EXISTS uq_screening_questions_order_index
  ON screening_questions(order_index);
