-- =============================================================================
-- 0009 - Field-registered assets: allow cost to be unrecorded
--
-- Items registered on the spot by a technician (inspection flow) should not
-- carry a fake $0.00 cost or a made-up purchase date. Dropping the NOT NULL on
-- purchase_cost lets "cost not known" be stored as NULL and displayed as "—".
-- Additive and safe.
-- =============================================================================

ALTER TABLE assets ALTER COLUMN purchase_cost DROP NOT NULL;