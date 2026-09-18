-- =============================================================================
-- 0012 - Production catch-up (one-shot apply)
--
-- Consolidates every migration added after deployment so a single run in the
-- production Supabase SQL editor brings the DB in line with the latest code:
--   0007 lat/lng on audit_log
--   0008 photos storage bucket
--   0009 purchase_cost no longer required
--   0010 centres + official departments
--   0011 maintenance_requests acknowledged_at
--
-- Every statement is idempotent (IF NOT EXISTS / ON CONFLICT ... DO NOTHING),
-- so it is safe to run more than once.
-- =============================================================================

-- 0007: GPS coordinates on the audit log --------------------------------

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at);

-- 0008: public photos bucket for inspection photos ----------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  TRUE,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 0009: purchase cost optional ------------------------------------------

ALTER TABLE assets ALTER COLUMN purchase_cost DROP NOT NULL;

-- 0010: centres + official departments ----------------------------------

CREATE TABLE IF NOT EXISTS centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO centres (name)
VALUES
  ('Civic Centre'),
  ('Chikanga'),
  ('Hobhouse'),
  ('Moffat'),
  ('Stores'),
  ('Odzani'),
  ('FernValley')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name)
VALUES
  ('ACCOUNTANT EXPENDITURE'),
  ('ASSETS'),
  ('AUDIT'),
  ('CASHIER'),
  ('DEBTORS'),
  ('ENGINEERING'),
  ('FINANCE'),
  ('GIS'),
  ('HEALTH'),
  ('HOUSING'),
  ('HR'),
  ('ICT'),
  ('PAYMENTS'),
  ('PROCUREMENT'),
  ('SALARIES'),
  ('SECURITY'),
  ('SPATIAL PLANNING'),
  ('TRAFFIC')
ON CONFLICT (name) DO NOTHING;

-- 0011: maintenance task acknowledgment ---------------------------------

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;