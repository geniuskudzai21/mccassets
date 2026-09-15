import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../types/db.js'
import { HttpError } from './errorHandler.js'

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required'))
      return
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'Forbidden: insufficient role'))
      return
    }

    next()
  }
}
