import type { UserRole } from './db.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: UserRole
        department_id: string | null
      }
    }
  }
}

export {}
