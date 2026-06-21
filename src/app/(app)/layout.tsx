'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'
import { useAuth } from '@/components/shared/AuthProvider'

// בשלב הנוכחי המערכת חסומה לפרופילים אחרים — רק הרשמה, בניית פרופיל
// וצפייה/עריכה של הפרופיל האישי. מסכים אלו מופנים חזרה למסך הבית.
const BLOCKED_PREFIXES = ['/discover', '/matches', '/messages', '/search']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    // אם אין פרופיל כלל, או שהפרופיל לא הושלם → שאלון
    if (!user.profile || !user.profile.profile_complete) {
      router.replace('/setup-profile')
      return
    }
    // חסימת גישה לפרופילים אחרים — הפניה למסך הבית
    if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
      router.replace('/home')
    }
  }, [user, isLoading, router, pathname])

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
