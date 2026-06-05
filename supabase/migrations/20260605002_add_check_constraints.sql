-- Migration: Add data-integrity CHECK constraints
-- Created: 2026-06-05
-- WARNING: Adding constraints validates ALL existing rows. If any row violates a constraint
-- the ALTER TABLE will fail. Run validation queries (commented below) BEFORE applying.

-- Validate orders.status values before applying:
-- SELECT status, count(*) FROM orders GROUP BY status;
-- Expected values: pending, paid, failed, expired only.
DO $$
BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('pending', 'paid', 'failed', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validate orders.total_amount >= 0:
-- SELECT count(*) FROM orders WHERE total_amount < 0;
DO $$
BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT chk_orders_total_amount
    CHECK (total_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validate courses.level values (Thai strings from COURSE_LEVELS in courses-db.ts):
-- SELECT level, count(*) FROM courses GROUP BY level;
DO $$
BEGIN
  ALTER TABLE courses
    ADD CONSTRAINT chk_courses_level
    CHECK (level IN ('ระดับเริ่มต้น', 'ระดับกลาง', 'ระดับสูง', 'ทุกระดับ'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validate lessons.duration_seconds (nullable — null means not yet set):
-- SELECT count(*) FROM lessons WHERE duration_seconds IS NOT NULL AND duration_seconds < 0;
DO $$
BEGIN
  ALTER TABLE lessons
    ADD CONSTRAINT chk_lessons_duration_seconds
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ROLLBACK:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_total_amount;
-- ALTER TABLE courses DROP CONSTRAINT IF EXISTS chk_courses_level;
-- ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_lessons_duration_seconds;
