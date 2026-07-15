'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, MessageSquare, MessageCircle, Compass, Shield } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'
import { FeedbackModal } from '@/components/shared/FeedbackModal'
import { cn } from '@/lib/utils'

export function AppNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const isAdmin = (user?.profile as unknown as Record<string, unknown>)?.is_admin === true

  const navItems = [
    { href: '/home', icon: Home, label: 'בית' },
    { href: '/discover', icon: Compass, label: 'גילוי' },
    { href: '/messages', icon: MessageCircle, label: 'הודעות' },
    { href: '/profile/me', icon: User, label: t.nav.profile },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#F5F5F5] border-e border-[#E5E5E5] h-full fixed top-0 start-0 z-40">
        <div className="p-6 pb-5 border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center">
            <span className="font-serif text-xl font-black text-[#0A0A0A] leading-none tracking-tight">
              מצאתי אותך
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm',
                  isActive
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#737373] hover:bg-[#EBEBEB] hover:text-[#0A0A0A]'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#E5E5E5] space-y-0.5">
          {/* Admin panel link */}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-[#0A0A0A] text-white'
                  : 'text-[#737373] hover:bg-[#EBEBEB] hover:text-[#0A0A0A]'
              )}
            >
              <Shield className="w-[18px] h-[18px]" />
              לוח ניהול
            </Link>
          )}

          {/* Feedback button */}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A3A3A3] hover:bg-[#EBEBEB] hover:text-[#0A0A0A] transition-all text-sm"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            שלח משוב
          </button>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A3A3A3] hover:bg-[#EBEBEB] hover:text-[#0A0A0A] transition-all text-sm"
          >
            {t.nav.settings}
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E5E5E5] z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  isActive ? 'text-[#0A0A0A]' : 'text-[#C0C0C0]'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          {/* Feedback button — mobile */}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[#C0C0C0]"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">משוב</span>
          </button>
        </div>
      </nav>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
