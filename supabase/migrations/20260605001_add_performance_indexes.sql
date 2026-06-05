-- Migration: Add performance indexes for frequently queried columns
-- Created: 2026-06-05
-- Review before applying: these are additive (CREATE INDEX IF NOT EXISTS) and safe on live data,
-- but large tables may experience brief lock contention. Run during low-traffic period.

-- user_courses: queried on every page load + video request to check entitlement
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);

-- orders: queried by user_id for my-courses and checkout polling
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- order_items: joined every time a receipt or entitlement grant is processed
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- lessons: queried ordered by chapter_index + lesson_index on every learn page load
CREATE INDEX IF NOT EXISTS idx_lessons_course_chapter_lesson
  ON lessons(course_id, chapter_index, lesson_index);

-- orders.omise_charge_id: prevent duplicate charges and speed up webhook lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_omise_charge_id
  ON orders(omise_charge_id)
  WHERE omise_charge_id IS NOT NULL;

-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_user_courses_user_id;
-- DROP INDEX IF EXISTS idx_orders_user_id;
-- DROP INDEX IF EXISTS idx_order_items_order_id;
-- DROP INDEX IF EXISTS idx_lessons_course_chapter_lesson;
-- DROP INDEX IF EXISTS idx_orders_omise_charge_id;
