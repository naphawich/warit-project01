-- Migration: GRANT privileges on lesson_progress (repo parity)
-- Created: 2026-06-06
-- Fixes audit D1: the original lesson_progress migration created RLS policies
-- but never granted table privileges. The live DB already had these grants;
-- this records them in version control so `supabase db reset` reproduces a
-- working table. Idempotent — safe to re-run.
-- Already applied to the live DB via MCP apply_migration on 2026-06-06.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

-- ROLLBACK:
-- REVOKE ALL ON public.lesson_progress FROM authenticated, service_role;
