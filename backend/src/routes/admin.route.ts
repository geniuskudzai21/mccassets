import { Router } from 'express'
import { getAdminOverview } from '../controllers/admin/overview.controller.js'
import {
  createDisposal,
  listDisposals,
  updateDisposal,
} from '../controllers/admin/disposal.controller.js'
import {
  getAuditTrail,
  getDepreciationReport,
  getReplacementDueReport,
  getReportSummary,
} from '../controllers/admin/report.controller.js'
import { inviteUser, listUsers, updateUser, deleteUser } from '../controllers/admin/user.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const adminRouter = Router()

adminRouter.use(authenticate)
adminRouter.use(requireRole('admin'))

adminRouter.get('/users', listUsers)
adminRouter.post('/users', inviteUser)
adminRouter.patch('/users/:id', updateUser)
adminRouter.delete('/users/:id', deleteUser)

adminRouter.get('/disposals', listDisposals)
adminRouter.post('/disposals', createDisposal)
adminRouter.patch('/disposals/:id', updateDisposal)

adminRouter.get('/reports/summary', getReportSummary)
adminRouter.get('/reports/depreciation', getDepreciationReport)
adminRouter.get('/reports/replacement-due', getReplacementDueReport)
adminRouter.get('/reports/audit-trail', getAuditTrail)

adminRouter.get('/overview', getAdminOverview)

export default adminRouter
