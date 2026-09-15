import { Router } from 'express'
import { getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.get('/me', authenticate, getMe)

export default router
