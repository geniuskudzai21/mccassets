-- =============================================================================
-- 0007 - GPS coordinates on the audit trail
--
-- Covers the brief requirement that every audited action records "who, when,
-- where (GPS)". Audit actions performed in the field (inspections) now persist
-- the coordinates alongside the audit row. Desk-bound actions keep NULL.
-- Additive and safe to run against a populated database.
-- =============================================================================

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);