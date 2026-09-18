import { Router } from 'express'
import {
  createAsset,
  deleteAsset,
  getAssetById,
  getAssetHistory,
  getAssetStats,
  listAssets,
  transferAsset,
  updateAsset,
} from '../controllers/asset.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticate)

router.get('/', listAssets)
router.get('/stats', requireRole('supervisor', 'admin'), getAssetStats)
router.get('/:id/history', getAssetHistory)
router.get('/:id', getAssetById)
router.post('/', requireRole('supervisor', 'admin'), createAsset)
router.post('/:id/transfer', requireRole('supervisor', 'admin'), transferAsset)
router.patch('/:id', requireRole('supervisor', 'admin'), updateAsset)
router.delete('/:id', requireRole('admin'), deleteAsset)

export default router
