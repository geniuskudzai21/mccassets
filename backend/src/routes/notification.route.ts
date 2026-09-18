import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', listNotifications)
router.post('/read-all', markAllNotificationsRead)
router.patch('/:id', markNotificationRead)

export default router