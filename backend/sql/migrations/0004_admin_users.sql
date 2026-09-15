-- =============================================================================
-- 0004 - Admin user management
-- Adds email + activation flag to profiles so the admin UI can invite, list
-- and deactivate users without crossing into the auth schema via PostgREST.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN email TEXT,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);