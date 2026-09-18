import type { Request, Response } from 'express'
import { getSupabase } from '../../config/supabase.js'
import { HttpError } from '../../middleware/errorHandler.js'
import { assessFunctional } from '../../services/assetFunctional.js'
import { depreciateAsset } from '../../services/depreciation.js'
import type { Asset, AssetStatus } from '../../types/db.js'

const OPEN_MAINTENANCE = ['pending', 'approved', 'in_progress']
const DAYS_MS = 24 * 60 * 60 * 1000

const STATUS_DEFAULTS: Record<AssetStatus, number> = {
  good: 0,
  fair: 0,
  poor: 0,
  disposal: 0,
}

export async function getAdminOverview(_req: Request, res: Response) {
  const supabase = getSupabase()
  const now = new Date()
  const cutoffs = {
    week: new Date(now.getTime() - 7 * DAYS_MS).toISOString(),
    month: new Date(now.getTime() - 30 * DAYS_MS).toISOString(),
    quarter: new Date(now.getTime() - 90 * DAYS_MS).toISOString(),
  }

  const [assetsRes, centresRes, departmentsRes, maintenanceRes, inspectionsRes, usersRes] =
    await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('centres').select('name'),
      supabase.from('departments').select('id, name'),
      supabase.from('maintenance_requests').select('status, asset_id, assigned_to, resolved_at'),
      supabase
        .from('inspections')
        .select('id, inspected_at')
        .gte('inspected_at', cutoffs.month),
      supabase.from('profiles').select('role'),
    ])

  if (
    assetsRes.error ||
    centresRes.error ||
    departmentsRes.error ||
    maintenanceRes.error ||
    inspectionsRes.error ||
    usersRes.error
  ) {
    throw new HttpError(500, 'Failed to compute admin overview')
  }

  const assets = (assetsRes.data ?? []) as Asset['Row'][]
  const centreNames = new Set((centresRes.data ?? []).map((centre) => centre.name))
  const departmentsById = new Map(
    (departmentsRes.data ?? []).map((department) => [department.id, department.name]),
  )
  const maintenanceRows = maintenanceRes.data ?? []
  const inspections = inspectionsRes.data ?? []
  const users = usersRes.data ?? []

  const byStatus = { ...STATUS_DEFAULTS }
  const byType = new Map<string, number>()
  const byDepartment = new Map<string, number>()
  const openFaultsByAsset = new Map<string, number>()
  let functional = 0
  let faulty = 0
  let located = 0
  let totalValue = 0
  let replacementDue = 0
  let warrantyExpiring = 0

  for (const request of maintenanceRows) {
    if (OPEN_MAINTENANCE.includes(request.status) && request.asset_id) {
      openFaultsByAsset.set(request.asset_id, (openFaultsByAsset.get(request.asset_id) ?? 0) + 1)
    }
  }

  for (const asset of assets) {
    byStatus[asset.current_status] = (byStatus[asset.current_status] ?? 0) + 1
    byType.set(asset.type, (byType.get(asset.type) ?? 0) + 1)
    if (asset.department_id) {
      const name = departmentsById.get(asset.department_id) ?? 'Unassigned'
      byDepartment.set(name, (byDepartment.get(name) ?? 0) + 1)
    }

    const depreciation = depreciateAsset(asset, now)
    totalValue += depreciation.currentValue
    if (depreciation.replacementDue || (depreciation.daysToEnd <= 365 && depreciation.daysToEnd >= 0)) {
      replacementDue += 1
    }

    if (asset.warranty_expiry) {
      const days = Math.round(
        (new Date(asset.warranty_expiry).getTime() - now.getTime()) / DAYS_MS,
      )
      if (days >= 0 && days <= 90) {
        warrantyExpiring += 1
      }
    }

    if (asset.last_lat != null && asset.last_lng != null) {
      located += 1
    }

    if (assessFunctional({
      currentStatus: asset.current_status,
      openFaults: openFaultsByAsset.get(asset.id) ?? 0,
      replacementDue: depreciation.replacementDue,
    }).functional) {
      functional += 1
    } else {
      faulty += 1
    }
  }

  const byTypeRows = [...byType.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const byDepartmentRows = [...byDepartment.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const centreBuildings = [...new Set(assets.map((asset) => asset.building).filter((building) => building && centreNames.has(building)))]

  const openMaintenance = maintenanceRows.filter((request) => OPEN_MAINTENANCE.includes(request.status))
  const pending = maintenanceRows.filter((request) => request.status === 'pending').length
  const inProgress = maintenanceRows.filter((request) => request.status === 'in_progress').length
  const completed30d = maintenanceRows.filter(
    (request) => request.resolved_at != null && request.resolved_at >= cutoffs.month,
  ).length
  const assignedTechnicians = new Set(openMaintenance.map((request) => request.assigned_to).filter(Boolean)).size

  const last30d = inspections.length
  const last7d = inspections.filter((inspection) => inspection.inspected_at >= cutoffs.week).length

  const allTimeInspections = await supabase.from('inspections').select('id', { count: 'exact', head: true })
  if (allTimeInspections.error) {
    throw new HttpError(500, 'Failed to count inspections')
  }

  const technicians = users.filter((user) => user.role === 'technician').length
  const supervisors = users.filter((user) => user.role === 'supervisor').length
  const admins = users.filter((user) => user.role === 'admin').length

  res.json({
    data: {
      as_of: now.toISOString(),
      assets: {
        total: assets.length,
        total_value: Math.round(totalValue * 100) / 100,
        by_status: byStatus,
        by_type: byTypeRows,
        by_department: byDepartmentRows,
        by_centre: centreBuildings.map((name) => ({
          name,
          count: assets.filter((asset) => asset.building === name).length,
        })),
        functional,
        faulty,
        located,
        unlocated: assets.length - located,
      },
      maintenance: {
        open: openMaintenance.length,
        pending,
        in_progress: inProgress,
        completed_30d: completed30d,
        assigned_technicians: assignedTechnicians,
      },
      inspections: {
        total: allTimeInspections.count ?? last30d,
        last_7d: last7d,
        last_30d: last30d,
      },
      alerts: {
        replacement_due: replacementDue,
        warranty_expiring_90d: warrantyExpiring,
        unlocated_assets: assets.length - located,
      },
      people: {
        total: users.length,
        technicians,
        supervisors,
        admins,
      },
    },
  })
}