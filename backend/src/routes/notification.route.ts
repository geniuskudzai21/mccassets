import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsReadBySource,
} from '../controllers/notification.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', listNotifications)
router.post('/read-all', markAllNotificationsRead)
router.post('/read-by', markNotificationsReadBySource)
router.patch('/:id', markNotificationRead)

export default router