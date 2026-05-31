'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'
import { useAuth } from '@/components/shared/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    // אם אין פרופיל כלל, או שהפרופיל לא הושלם → שאלון
    if (!user.profile || !user.profile.profile_complete) {
      router.replace('/setup-profile')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <AppNav />
      <div className="md:ms-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </div>
    </div>
  )
}
