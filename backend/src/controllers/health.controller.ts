import type { Request, Response } from 'express'
import { config } from '../config/index.js'

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    service: 'mcas-ict-backend',
    env: config.env,
    timestamp: new Date().toISOString(),
  })
}
