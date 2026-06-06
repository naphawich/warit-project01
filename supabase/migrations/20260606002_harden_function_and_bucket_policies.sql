-- Migration: Harden SECURITY DEFINER function + public bucket listing
-- Created: 2026-06-06
-- Source: Supabase security advisor (anon/authenticated SECURITY DEFINER executable,
--         public_bucket_allows_listing)
-- Already applied to the live DB via MCP apply_migration on 2026-06-06.

-- Fix S4: prevent_is_admin_escalation() is a trigger function and must never
-- be callable directly via the REST RPC endpoint. Revoke EXECUTE from the
-- API-facing roles. (Triggers still fire regardless of EXECUTE grants.)
REVOKE EXECUTE ON FUNCTION public.prevent_is_admin_escalation() FROM anon, authenticated, public;

-- Fix S5: avatars and course-thumbnails are PUBLIC buckets. A broad SELECT
-- policy lets anyone LIST every object. Public object URLs are served via the
-- /object/public/ endpoint which does NOT consult these policies, so dropping
-- them keeps image display working while removing the ability to enumerate
-- filenames. INSERT/UPDATE/DELETE policies are untouched.
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read course thumbnails" ON storage.objects;

-- ROLLBACK:
-- GRANT EXECUTE ON FUNCTION public.prevent_is_admin_escalation() TO anon, authenticated;
-- CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
-- CREATE POLICY "Public read course thumbnails" ON storage.objects FOR SELECT TO public USING (bucket_id = 'course-thumbnails');
