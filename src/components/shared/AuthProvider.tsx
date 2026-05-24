'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthUser } from '@/lib/types/app'
import { createClient } from '@/lib/supabase/client'
import { fetchCurrentUserProfile, upsertProfile } from '@/lib/api/profiles'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, data: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<AuthUser['profile']>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  async function loadUserProfile(sessionData: Session) {
    const profile = await fetchCurrentUserProfile(sessionData.user.id)
    setUser({ id: sessionData.user.id, email: sessionData.user.email ?? '', profile })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s) {
        loadUserProfile(s).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) {
        loadUserProfile(s)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (email: string, password: string, data: Record<string, unknown>) => {
    const { data: authData, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (authData.user) {
      await upsertProfile({
        user_id: authData.user.id,
        first_name: String(data.first_name ?? ''),
        last_name: String(data.last_name ?? ''),
        display_name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
        gender: (data.gender as 'male' | 'female' | 'other') ?? 'other',
        seeking: (data.seeking as 'male' | 'female' | 'both') ?? 'both',
        date_of_birth: String(data.date_of_birth ?? ''),
        city: '',
        state: '',
        country: 'US',
        latitude: null,
        longitude: null,
        bio: '',
        occupation: '',
        education: '',
        religious_level: (data.religious_level as 'hiloni' | 'masorti' | 'dati_light' | 'dati' | 'haredi') ?? 'masorti',
        shomer_shabbat: Boolean(data.shomer_shabbat ?? false),
        kosher_level: (data.kosher_level as 'none' | 'kosher_home' | 'kosher_out' | 'strict') ?? 'none',
        synagogue_attendance: 'monthly',
        community_background: (data.community_background as 'ashkenazi' | 'sephardic' | 'mizrahi' | 'yemenite' | 'mixed' | 'other') ?? 'mixed',
        hebrew_fluency: (data.hebrew_fluency as 'none' | 'basic' | 'conversational' | 'fluent' | 'native') ?? 'none',
        aliyah_plan: 'no',
        children_status: 'no_children',
        wants_children: null,
        height_cm: null,
        is_verified: false,
        is_online: true,
        last_seen: new Date().toISOString(),
        profile_complete: false,
        subscription_tier: 'free',
        boost_active_until: null,
        views_count: 0,
      })
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const updateProfile = async (data: Partial<AuthUser['profile']>) => {
    if (!user) return
    const updated = await upsertProfile({ user_id: user.id, ...data })
    if (updated) {
      setUser(prev => prev ? { ...prev, profile: updated } : null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
