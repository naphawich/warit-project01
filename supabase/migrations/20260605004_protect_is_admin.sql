-- Migration: Prevent users from escalating their own is_admin flag via UPDATE
-- Created: 2026-06-05
-- IMPORTANT: Review existing profiles UPDATE policies before applying.
-- A permissive policy + a restrictive policy = the permissive one wins in Postgres RLS.
-- This uses a BEFORE UPDATE trigger instead, which is enforced regardless of policies.

-- Trigger function: reject any update that attempts to change is_admin
CREATE OR REPLACE FUNCTION prevent_is_admin_escalation()
RETURNS trigger AS $$
BEGIN
  -- Service role bypasses RLS entirely, so we only restrict regular users.
  -- auth.role() returns 'authenticated' for normal JWT sessions.
  IF current_setting('role', true) = 'authenticated' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Changing is_admin is not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to profiles table
DROP TRIGGER IF EXISTS trg_prevent_is_admin_escalation ON profiles;
CREATE TRIGGER trg_prevent_is_admin_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_escalation();

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trg_prevent_is_admin_escalation ON profiles;
-- DROP FUNCTION IF EXISTS prevent_is_admin_escalation();
