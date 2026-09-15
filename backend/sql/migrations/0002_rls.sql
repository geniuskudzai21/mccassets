-- =============================================================================
-- MCAS-ICT — Migration 0002: Row-Level Security Policies
-- Source: 02_database_schema.txt RLS section (intent-based policies)
--
-- NOTE on departments: the spec says "enable RLS on every table" but defines
-- no policies for departments. Without policies the table is fully locked.
-- Policies below match the API spec (03_backend_api_spec.txt):
--   GET /api/departments  [any authenticated]
--   POST /api/departments [admin]
-- =============================================================================

-- DEPARTMENTS ----------------------------------------------------------------
-- Spec gap: no RLS policies defined. Implementing per API spec.

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users view departments"
  ON departments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "admins insert departments"
  ON departments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "admins update departments"
  ON departments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "admins delete departments"
  ON departments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

-- PROFILES -------------------------------------------------------------------
-- Spec: users can read own row; admins read all.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admins view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

-- ASSETS ---------------------------------------------------------------------
-- Spec: technicians/supervisors/admins can SELECT all;
--       only supervisor/admin can INSERT/UPDATE/DELETE.

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users view assets"
  ON assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "supervisors and admins insert assets"
  ON assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins update assets"
  ON assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins delete assets"
  ON assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

-- INSPECTIONS ----------------------------------------------------------------
-- Spec: technician can INSERT own; SELECT own + supervisor/admin SELECT all.

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technicians insert own inspections"
  ON inspections FOR INSERT
  WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "technicians view own inspections"
  ON inspections FOR SELECT
  USING (auth.uid() = technician_id);

CREATE POLICY "supervisors and admins view all inspections"
  ON inspections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins update inspections"
  ON inspections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins delete inspections"
  ON inspections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

-- MAINTENANCE REQUESTS -------------------------------------------------------
-- Spec: supervisor/admin full access; technician SELECT assigned only.

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisors and admins view all maintenance requests"
  ON maintenance_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "technicians view assigned maintenance requests"
  ON maintenance_requests FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "supervisors and admins insert maintenance requests"
  ON maintenance_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins update maintenance requests"
  ON maintenance_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "supervisors and admins delete maintenance requests"
  ON maintenance_requests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

-- DISPOSALS ------------------------------------------------------------------
-- Spec: admin only for INSERT; supervisor/admin SELECT.

ALTER TABLE disposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisors and admins view disposals"
  ON disposals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('supervisor', 'admin')
  ));

CREATE POLICY "admins insert disposals"
  ON disposals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "admins update disposals"
  ON disposals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "admins delete disposals"
  ON disposals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

-- AUDIT LOG ------------------------------------------------------------------
-- Spec: admin SELECT only; system-inserted via backend service role.
-- Service role bypasses RLS, so no INSERT policy needed.

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins view audit log"
  ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));
