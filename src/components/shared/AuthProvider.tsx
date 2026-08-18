'use client'

import React, { createContext, useContext } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { AuthUser } from '@/lib/types/app'
import type { DbProfile } from '@/lib/types/database'
import { toPatch } from '@/lib/convex/patch'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, data: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<DbProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { signIn, signOut } = useAuthActions()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.profiles.me, isAuthenticated ? {} : 'skip')
  const updateProfileMutation = useMutation(api.profiles.update)

  const isLoading = authLoading || (isAuthenticated && me === undefined)
  const user = (isAuthenticated && me ? me : null) as AuthUser | null

  const login = async (email: string, password: string) => {
    await signIn('password', { email: email.trim().toLowerCase(), password, flow: 'signIn' })
  }

  const register = async (email: string, password: string, data: Record<string, unknown>) => {
    await signIn('password', {
      email: email.trim().toLowerCase(),
      password,
      flow: 'signUp',
      first_name: String(data.first_name ?? ''),
      last_name: String(data.last_name ?? ''),
    })
    // הפרופיל עצמו נוצר אוטומטית בצד השרת (convex/auth.ts); כאן רק משלימים פרטים
    await updateProfileMutation({
      patch: {
        first_name: String(data.first_name ?? ''),
        last_name: String(data.last_name ?? ''),
        display_name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
        phone_number: String(data.phone_number ?? ''),
      },
    })
  }

  const logout = async () => {
    await signOut()
  }

  const updateProfile = async (data: Partial<DbProfile>) => {
    await updateProfileMutation({ patch: toPatch(data) })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
