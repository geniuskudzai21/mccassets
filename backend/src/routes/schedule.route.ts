import { Router } from 'express'
import { getDueSchedules } from '../controllers/schedule.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/due', getDueSchedules)

export default router