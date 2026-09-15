import { Router } from 'express'
import {
  createInspection,
  listInspections,
  syncInspections,
} from '../controllers/inspection.controller.js'
import { signUpload } from '../controllers/upload.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const inspectionRouter = Router()

inspectionRouter.use(authenticate)

inspectionRouter.get('/', requireRole('technician', 'supervisor', 'admin'), listInspections)
inspectionRouter.post('/sync', requireRole('technician'), syncInspections)
inspectionRouter.post('/', requireRole('technician'), createInspection)

const uploadRouter = Router()

uploadRouter.use(authenticate)

uploadRouter.post('/sign', signUpload)

export { inspectionRouter, uploadRouter }
