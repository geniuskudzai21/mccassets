import { Router } from 'express'
import { createDepartment, listDepartments } from '../controllers/department.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticate)

router.get('/', listDepartments)
router.post('/', requireRole('admin'), createDepartment)

export default router
