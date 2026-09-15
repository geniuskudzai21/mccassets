import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import type { AssetStatus } from '../types/db.js'

/**
 * Recomputes an asset's current_status after an inspection. The most recent
 * inspection result wins. Also writes an audit_log row and auto-raises a
 * maintenance request when the inspected condition warrants it.
 */
export async function applyInspectionResult(params: {
  assetId: string
  inspectionId: string
  status: AssetStatus
  technicianId: string
}): Promise<void> {
  const { assetId, inspectionId, status, technicianId } = params
  const supabase = getSupabase()

  const { error: updateError } = await supabase
    .from('assets')
    .update({ current_status: status })
    .eq('id', assetId)

  if (updateError) {
    throw new HttpError(500, 'Failed to update asset status')
  }

  const { error: auditError } = await supabase.from('audit_log').insert({
    user_id: technicianId,
    action: 'inspection.create',
    entity_type: 'assets',
    entity_id: assetId,
    metadata: { inspection_id: inspectionId, status },
  })

  if (auditError) {
    throw new HttpError(500, 'Failed to write audit log')
  }

  if (status === 'poor' || status === 'disposal') {
    const { error: maintenanceError } = await supabase.from('maintenance_requests').insert({
      asset_id: assetId,
      raised_by: technicianId,
      status: 'pending',
      description: `Automatic maintenance request raised after a ${status} inspection.`,
    })

    if (maintenanceError) {
      throw new HttpError(500, 'Failed to raise maintenance request')
    }
  }
}
