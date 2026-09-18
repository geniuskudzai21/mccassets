-- =============================================================================
-- 0011 - Maintenance request acknowledgment
--
-- Persists when the assigned technician acknowledged the task so the UI can
-- show it as "Acknowledged" after a reload (previously client-side only).
-- Idempotent and safe to re-run.
-- =============================================================================

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;