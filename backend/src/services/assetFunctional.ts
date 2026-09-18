import type { AssetStatus } from '../types/db.js'

/**
 * Composite operational assessment for an asset: "Functional" vs "Faulty".
 *
 * Unlike `current_status` (which mirrors the most recent inspection result),
 * this combines the brief's three signals:
 *   - condition     -> inspected status (poor / for disposal)
 *   - fault history -> unresolved maintenance requests still outstanding
 *   - age           -> past end of life (fully depreciated)
 *
 * Computed on read so the register always reflects current state.
 */
export interface FunctionalAssessment {
  functional: boolean
  flags: string[]
}

export function assessFunctional(params: {
  currentStatus: AssetStatus
  openFaults: number
  replacementDue: boolean
}): FunctionalAssessment {
  const flags: string[] = []

  if (params.currentStatus === 'disposal') {
    flags.push('Asset is marked for disposal')
  } else if (params.currentStatus === 'poor') {
    flags.push('Latest inspection was poor')
  }

  if (params.openFaults >= 2) {
    flags.push(`${params.openFaults} unresolved faults on file`)
  }

  if (params.replacementDue) {
    flags.push('Asset is past its end of life')
  }

  return {
    functional: flags.length === 0,
    flags,
  }
}