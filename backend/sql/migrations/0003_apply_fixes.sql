-- =============================================================================
-- MCAS-ICT — Migration 0003: Fixes raised during schema review
--
-- Context: 0001/0002 were already applied to Supabase, so these fixes are
-- additive and safe to run against a populated database.
--
-- Fixes applied (from review of 02_database_schema.txt):
--   1. disposals.disposal_date default now() -> CURRENT_DATE
--      (now() returns timestamptz; CURRENT_DATE is the correct date default)
--   2. Add BEFORE UPDATE trigger to maintain assets.updated_at automatically
--   3. Add missing indexes for planned query patterns:
--        - maintenance_requests(asset_id)
--        - audit_log(user_id)
--        - audit_log(entity_type, entity_id)
--
-- Already resolved in 0002 (no action needed here):
--   - departments RLS policies (were missing; added in 0002)
--   - assets SELECT 'OR true' placeholder (implemented as any-auth read in 0002)
-- =============================================================================

-- 1. Fix disposals.disposal_date default ------------------------------------

ALTER TABLE disposals
  ALTER COLUMN disposal_date SET DEFAULT CURRENT_DATE;

-- 2. assets.updated_at trigger ----------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_set_updated_at ON assets;

CREATE TRIGGER trg_assets_set_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Missing indexes --------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_asset_id
  ON maintenance_requests (asset_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
  ON audit_log (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id);