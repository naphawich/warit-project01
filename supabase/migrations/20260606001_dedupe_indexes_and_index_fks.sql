-- Migration: Remove duplicate/redundant indexes + index foreign keys
-- Created: 2026-06-06
-- Source: Supabase performance advisor (duplicate_index WARN, unindexed_foreign_keys INFO)
-- Already applied to the live DB via MCP apply_migration on 2026-06-06.

-- Fix P1: remove duplicate / redundant indexes flagged by the performance advisor.
-- Keep exactly one index per identical pair; the UNIQUE CONSTRAINT
-- orders_omise_charge_id_key is intentionally retained.

-- order_items: identical pair on (order_id) -> keep idx_order_items_order_id
DROP INDEX IF EXISTS public.order_items_order_id_idx;

-- orders: identical pair on (user_id) -> keep idx_orders_user_id
DROP INDEX IF EXISTS public.orders_user_id_idx;

-- user_courses: identical pair on (user_id) -> keep idx_user_courses_user_id
DROP INDEX IF EXISTS public.user_courses_user_id_idx;

-- orders.omise_charge_id: three overlapping indexes existed. The UNIQUE
-- constraint (orders_omise_charge_id_key) already enforces uniqueness and
-- serves equality lookups, so the plain and partial-unique copies are pure
-- write/storage overhead.
DROP INDEX IF EXISTS public.orders_omise_charge_id_idx;
DROP INDEX IF EXISTS public.idx_orders_omise_charge_id;

-- Fix P2: add covering indexes for foreign keys that had none.
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
  ON public.lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_order_id
  ON public.user_courses (order_id);

-- ROLLBACK:
-- CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);
-- CREATE INDEX orders_user_id_idx ON public.orders (user_id);
-- CREATE INDEX user_courses_user_id_idx ON public.user_courses (user_id);
-- CREATE INDEX orders_omise_charge_id_idx ON public.orders (omise_charge_id);
-- CREATE UNIQUE INDEX idx_orders_omise_charge_id ON public.orders (omise_charge_id) WHERE omise_charge_id IS NOT NULL;
-- DROP INDEX IF EXISTS public.idx_lesson_progress_lesson_id;
-- DROP INDEX IF EXISTS public.idx_user_courses_order_id;
