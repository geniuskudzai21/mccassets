import { Router } from 'express'
import {
  acknowledgeMaintenanceRequest,
  listMaintenanceRequests,
  updateMaintenanceRequest,
} from '../controllers/maintenance.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticate)

router.get('/', requireRole('technician', 'supervisor', 'admin'), listMaintenanceRequests)
router.patch('/:id', requireRole('supervisor', 'admin'), updateMaintenanceRequest)
router.post('/:id/acknowledge', requireRole('technician', 'supervisor', 'admin'), acknowledgeMaintenanceRequest)

export default router
