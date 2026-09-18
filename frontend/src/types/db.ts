// =============================================================================
// MCAS-ICT — Database types
// Generated from 02_database_schema.txt
// Compatible with @supabase/supabase-js v2+
// =============================================================================

export type UserRole = 'technician' | 'supervisor' | 'admin'
export type AssetStatus = 'good' | 'fair' | 'poor' | 'disposal'
export type AssetType =
  | 'cpu'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'laptop'
  | 'printer'
  | 'router'
  | 'projector'
  | 'server'
  | 'ups'
  | 'other'
export type RequestStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
export type SyncStatus = 'synced' | 'pending' | 'conflict'

// ---- Row / Insert / Update types per table ----------------------------------

export interface Department {
  Row: {
    id: string
    name: string
    location: string | null
    created_at: string
  }
  Insert: {
    id?: string
    name: string
    location?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    name?: string
    location?: string | null
    created_at?: string
  }
  Relationships: []
}

export interface Centre {
  Row: {
    id: string
    name: string
    created_at: string
  }
  Insert: {
    id?: string
    name: string
    created_at?: string
  }
  Update: {
    id?: string
    name?: string
    created_at?: string
  }
  Relationships: []
}

export interface Profile {
  Row: {
    id: string
    full_name: string
    email: string | null
    role: UserRole
    department_id: string | null
    phone: string | null
    is_active: boolean
    created_at: string
  }
  Insert: {
    id: string
    full_name: string
    email?: string | null
    role?: UserRole
    department_id?: string | null
    phone?: string | null
    is_active?: boolean
    created_at?: string
  }
  Update: {
    full_name?: string
    email?: string | null
    role?: UserRole
    department_id?: string | null
    phone?: string | null
    is_active?: boolean
    created_at?: string
  }
  Relationships: []
}

export interface Asset {
  Row: {
    id: string
    asset_tag: string
    type: AssetType
    parent_asset_id: string | null
    brand: string | null
    model: string | null
    serial_number: string | null
    department_id: string | null
    assigned_user: string | null
    purchase_date: string
    purchase_cost: number
    useful_life_years: number
    current_status: AssetStatus
    last_lat: number | null
    last_lng: number | null
    building: string | null
    room: string | null
    warranty_expiry: string | null
    inspection_interval_months: number
    replacement_estimate: number | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    asset_tag: string
    type: AssetType
    parent_asset_id?: string | null
    brand?: string | null
    model?: string | null
    serial_number?: string | null
    department_id?: string | null
    assigned_user?: string | null
    purchase_date: string
    purchase_cost: number
    useful_life_years?: number
    current_status?: AssetStatus
    last_lat?: number | null
    last_lng?: number | null
    building?: string | null
    room?: string | null
    warranty_expiry?: string | null
    inspection_interval_months?: number
    replacement_estimate?: number | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    asset_tag?: string
    type?: AssetType
    parent_asset_id?: string | null
    brand?: string | null
    model?: string | null
    serial_number?: string | null
    department_id?: string | null
    assigned_user?: string | null
    purchase_date?: string
    purchase_cost?: number
    useful_life_years?: number
    current_status?: AssetStatus
    last_lat?: number | null
    last_lng?: number | null
    building?: string | null
    room?: string | null
    warranty_expiry?: string | null
    inspection_interval_months?: number
    replacement_estimate?: number | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

export interface Transfer {
  Row: {
    id: string
    asset_id: string
    from_department_id: string | null
    to_department_id: string | null
    transferred_by: string | null
    transferred_at: string
    notes: string | null
  }
  Insert: {
    id?: string
    asset_id: string
    from_department_id?: string | null
    to_department_id?: string | null
    transferred_by?: string | null
    transferred_at?: string
    notes?: string | null
  }
  Update: {
    id?: string
    asset_id?: string
    from_department_id?: string | null
    to_department_id?: string | null
    transferred_by?: string | null
    transferred_at?: string
    notes?: string | null
  }
  Relationships: []
}

export interface Notification {
  Row: {
    id: string
    user_id: string
    type: string
    title: string
    body: string
    asset_id: string | null
    created_at: string
    read_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    type: string
    title: string
    body?: string
    asset_id?: string | null
    created_at?: string
    read_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    type?: string
    title?: string
    body?: string
    asset_id?: string | null
    created_at?: string
    read_at?: string | null
  }
  Relationships: []
}

export interface Inspection {
  Row: {
    id: string
    asset_id: string
    technician_id: string
    status: AssetStatus
    notes: string | null
    photo_urls: string[] | null
    lat: number | null
    lng: number | null
    client_uuid: string | null
    sync_status: SyncStatus
    inspected_at: string
    created_at: string
  }
  Insert: {
    id?: string
    asset_id: string
    technician_id: string
    status: AssetStatus
    notes?: string | null
    photo_urls?: string[] | null
    lat?: number | null
    lng?: number | null
    client_uuid?: string | null
    sync_status?: SyncStatus
    inspected_at?: string
    created_at?: string
  }
  Update: {
    id?: string
    asset_id?: string
    technician_id?: string
    status?: AssetStatus
    notes?: string | null
    photo_urls?: string[] | null
    lat?: number | null
    lng?: number | null
    client_uuid?: string | null
    sync_status?: SyncStatus
    inspected_at?: string
    created_at?: string
  }
  Relationships: []
}

export interface MaintenanceRequest {
  Row: {
    id: string
    asset_id: string
    raised_by: string | null
    assigned_to: string | null
    status: RequestStatus
    description: string
    estimated_cost: number | null
    created_at: string
    resolved_at: string | null
    acknowledged_at: string | null
  }
  Insert: {
    id?: string
    asset_id: string
    raised_by?: string | null
    assigned_to?: string | null
    status?: RequestStatus
    description: string
    estimated_cost?: number | null
    created_at?: string
    resolved_at?: string | null
    acknowledged_at?: string | null
  }
  Update: {
    id?: string
    asset_id?: string
    raised_by?: string | null
    assigned_to?: string | null
    status?: RequestStatus
    description?: string
    estimated_cost?: number | null
    created_at?: string
    resolved_at?: string | null
    acknowledged_at?: string | null
  }
  Relationships: []
}

export interface Disposal {
  Row: {
    id: string
    asset_id: string
    disposed_by: string | null
    reason: string
    disposal_date: string
    approved_by: string | null
  }
  Insert: {
    id?: string
    asset_id: string
    disposed_by?: string | null
    reason: string
    disposal_date?: string
    approved_by?: string | null
  }
  Update: {
    id?: string
    asset_id?: string
    disposed_by?: string | null
    reason?: string
    disposal_date?: string
    approved_by?: string | null
  }
  Relationships: []
}

export interface AuditLog {
  Row: {
    id: string
    user_id: string | null
    action: string
    entity_type: string
    entity_id: string
    metadata: Record<string, unknown> | null
    lat: number | null
    lng: number | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id?: string | null
    action: string
    entity_type: string
    entity_id: string
    metadata?: Record<string, unknown> | null
    lat?: number | null
    lng?: number | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string | null
    action?: string
    entity_type?: string
    entity_id?: string
    metadata?: Record<string, unknown> | null
    lat?: number | null
    lng?: number | null
    created_at?: string
  }
  Relationships: []
}

// ---- Supabase Database type (supabase-js compatible) -----------------------

export interface Database {
  public: {
    Tables: {
      departments: Department
      centres: Centre
      profiles: Profile
      assets: Asset
      inspections: Inspection
      maintenance_requests: MaintenanceRequest
      transfers: Transfer
      disposals: Disposal
      notifications: Notification
      audit_log: AuditLog
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      asset_status: AssetStatus
      asset_type: AssetType
      request_status: RequestStatus
      sync_status: SyncStatus
    }
  }
}
