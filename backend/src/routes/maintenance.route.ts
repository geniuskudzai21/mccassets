import { Router } from 'express'
import {
  listMaintenanceRequests,
  updateMaintenanceRequest,
} from '../controllers/maintenance.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticate)

router.get('/', requireRole('supervisor', 'admin'), listMaintenanceRequests)
router.patch('/:id', requireRole('supervisor', 'admin'), updateMaintenanceRequest)

export default router
