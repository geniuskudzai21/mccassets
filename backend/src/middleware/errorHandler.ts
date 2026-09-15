import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = 'HttpError'
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Validation error', details: err.issues })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message })
    return
  }

  // eslint-disable-next-line no-console
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
}
