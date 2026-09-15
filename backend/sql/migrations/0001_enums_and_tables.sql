-- =============================================================================
-- MCAS-ICT — Migration 0001: Enums, Tables, Indexes
-- Source: 02_database_schema.txt (transcribed verbatim)
-- =============================================================================

-- ENUMS ----------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('technician', 'supervisor', 'admin');
CREATE TYPE asset_status AS ENUM ('good', 'fair', 'poor', 'disposal');
CREATE TYPE asset_type AS ENUM (
  'cpu', 'monitor', 'keyboard', 'mouse', 'laptop', 'printer',
  'router', 'projector', 'server', 'ups', 'other'
);
CREATE TYPE request_status AS ENUM (
  'pending', 'approved', 'in_progress', 'completed', 'rejected'
);
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');

-- DEPARTMENTS ----------------------------------------------------------------

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES -------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  department_id UUID REFERENCES departments(id),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ASSETS ---------------------------------------------------------------------

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT NOT NULL UNIQUE,
  type asset_type NOT NULL,
  parent_asset_id UUID REFERENCES assets(id),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  department_id UUID REFERENCES departments(id),
  assigned_user TEXT,
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC(12,2) NOT NULL,
  useful_life_years INT NOT NULL DEFAULT 5,
  current_status asset_status NOT NULL DEFAULT 'good',
  last_lat NUMERIC(9,6),
  last_lng NUMERIC(9,6),
  building TEXT,
  room TEXT,
  warranty_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_parent_asset_id ON assets (parent_asset_id);

-- INSPECTIONS ----------------------------------------------------------------

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id),
  status asset_status NOT NULL,
  notes TEXT,
  photo_urls TEXT[],
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  client_uuid UUID,
  sync_status sync_status NOT NULL DEFAULT 'synced',
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_inspections_client_uuid
  ON inspections (client_uuid)
  WHERE client_uuid IS NOT NULL;

-- MAINTENANCE REQUESTS -------------------------------------------------------

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  raised_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  status request_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  estimated_cost NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- DISPOSALS ------------------------------------------------------------------

CREATE TABLE disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  disposed_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  disposal_date DATE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES profiles(id)
);

-- AUDIT LOG ------------------------------------------------------------------

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
