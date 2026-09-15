import { Router } from 'express'
import { listUsers } from '../controllers/user.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticate)

router.get('/', requireRole('supervisor', 'admin'), listUsers)

export default router
