-- =============================================================================
-- 0006 - Inspection cycles, transfers, and in-app notifications
--
-- Covers requirements from the MCAS-ICT brief:
--   * "automate scheduling by setting inspection cycles for all ICT assets"
--   * "technicians log new purchases, transfers of equipment between
--     departments, and disposals"
--   * "technicians receive notifications when a new fault is reported"
--   * "a list of assets due for replacement with estimated costs"
--
-- Additive and safe to run against a populated database.
-- =============================================================================

-- 1. New asset columns --------------------------------------------------------
--    inspection_interval_months drives the inspection-cycle schedule.
--    replacement_estimate records the expected cost of a like-for-like
--    replacement, used to cost the replacement-due report.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS inspection_interval_months INT NOT NULL DEFAULT 12;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS replacement_estimate NUMERIC(12,2);

-- 2. Transfers ---------------------------------------------------------------
--    Keeps a permanent trail of equipment moves between departments so asset
--    history is not overwritten when department_id changes.

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  from_department_id UUID REFERENCES departments(id),
  to_department_id UUID REFERENCES departments(id),
  transferred_by UUID REFERENCES profiles(id),
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_transfers_asset_id
  ON transfers (asset_id, transferred_at DESC);

-- 3. Notifications -----------------------------------------------------------
--    In-app notices delivered to a user's dashboard/bell (polled, no email).

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  asset_id UUID REFERENCES assets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, read_at, created_at DESC);

-- 4. RLS ----------------------------------------------------------------------
--    Backend uses service-role (bypassed); policies exist so the frontend
--    could read its own rows directly if ever switched off the API.

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users view own notifications" ON notifications;
CREATE POLICY "users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own notifications" ON notifications;
CREATE POLICY "users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);