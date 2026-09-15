import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/db.ts'

export interface AuthContextValue {
  user: User | null
  profile: Profile['Row'] | null
  role: Profile['Row']['role'] | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
