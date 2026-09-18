import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import assetRouter from './routes/asset.route.js'
import adminRouter from './routes/admin.route.js'
import authRouter from './routes/auth.route.js'
import centreRouter from './routes/centre.route.js'
import departmentRouter from './routes/department.route.js'
import healthRouter from './routes/health.route.js'
import { inspectionRouter, uploadRouter } from './routes/inspection.route.js'
import maintenanceRouter from './routes/maintenance.route.js'
import notificationRouter from './routes/notification.route.js'
import scheduleRouter from './routes/schedule.route.js'
import userRouter from './routes/user.route.js'
import { runScheduleChecks } from './services/scheduling.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: config.corsOrigin.split(',').map((origin) => origin.trim()),
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

app.get('/api', (_req, res) => {
  res.json({ service: 'mcas-ict-backend', docs: '/api/health' })
})

app.use('/api', healthRouter)
app.use('/api', authRouter)
app.use('/api/departments', departmentRouter)
app.use('/api/centres', centreRouter)
app.use('/api/assets', assetRouter)
app.use('/api/inspections', inspectionRouter)
app.use('/api/uploads', uploadRouter)
app.use('/api/maintenance-requests', maintenanceRouter)
app.use('/api/users', userRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/schedules', scheduleRouter)
app.use('/api/admin', adminRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const SCHEDULE_CHECK_INTERVAL_MS = 10 * 60 * 1000 // every 10 minutes
let schedulerStarted = false

function startScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  void runScheduleChecks()
  setInterval(() => {
    void runScheduleChecks()
  }, SCHEDULE_CHECK_INTERVAL_MS)
  // eslint-disable-next-line no-console
  console.log(
    `[scheduler] inspection-cycle + warranty checks running every ${
      SCHEDULE_CHECK_INTERVAL_MS / 60000
    } minutes`,
  )
}

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`mcas-ict backend listening on http://localhost:${config.port}`)
  startScheduler()
})
