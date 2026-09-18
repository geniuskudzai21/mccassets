-- =============================================================================
-- 0010 - Master data: centres and official departments
--
-- Seeds the reference lists used across registration and inspection:
--   DEPARTMENTS: the 18 official Mutare City Council department names.
--   CENTRES: the physical centres (locations) where assets sit.
-- Both are idempotent (ON CONFLICT ... DO NOTHING) and safe to re-run.
-- =============================================================================

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