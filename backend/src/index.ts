import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import assetRouter from './routes/asset.route.js'
import authRouter from './routes/auth.route.js'
import departmentRouter from './routes/department.route.js'
import healthRouter from './routes/health.route.js'

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
app.use('/api/assets', assetRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`mcas-ict backend listening on http://localhost:${config.port}`)
})
