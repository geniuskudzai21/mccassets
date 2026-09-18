import { Router } from 'express'
import { listCentres } from '../controllers/centre.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', listCentres)

export default router