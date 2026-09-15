-- =============================================================================
-- 0005 - Ensure profiles RLS policies (idempotent)
-- The backend runs with the service-role key (RLS bypassed), so admin/supervisor
-- flows worked even when policies were missing. The client (app) reads its own
-- profile via the user JWT, which requires the SELECT policy below.
--
-- NOTE: the original admin policies did `EXISTS (SELECT 1 FROM profiles ...)`
-- inside a policy ON profiles, which re-triggers the same policies -> infinite
-- recursion. A SECURITY DEFINER helper avoids that by bypassing RLS.
-- Safe to re-run: drops and recreates the same named policies.
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

DROP POLICY IF EXISTS "users view own profile" ON profiles;
CREATE POLICY "users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins view all profiles" ON profiles;
CREATE POLICY "admins view all profiles"
  ON profiles FOR SELECT
  USING (public.current_user_is_admin(auth.uid()));

DROP POLICY IF EXISTS "users update own profile" ON profiles;
CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins update all profiles" ON profiles;
CREATE POLICY "admins update all profiles"
  ON profiles FOR UPDATE
  USING (public.current_user_is_admin(auth.uid()))
  WITH CHECK (public.current_user_is_admin(auth.uid()));