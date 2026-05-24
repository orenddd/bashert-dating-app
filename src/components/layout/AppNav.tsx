'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, MessageCircle, Search, Compass, User } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function StarOfDavid({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round">
      <path d="M12 3l9 15.6H3z"/><path d="M12 21L3 5.4h18z"/>
    </svg>
  )
}

export function AppNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navItems = [
    { href: '/discover', icon: Compass, label: t.nav.discover },
    { href: '/matches', icon: Heart, label: t.nav.matches },
    { href: '/messages', icon: MessageCircle, label: t.nav.messages },
    { href: '/search', icon: Search, label: t.nav.search },
    { href: '/profile/me', icon: User, label: t.nav.profile },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#EBE4D2] border-e border-[rgba(23,20,17,0.08)] h-full fixed top-0 start-0 z-40">
        <div className="p-6 pb-5 border-b border-[rgba(23,20,17,0.08)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-[#B8472A] flex items-center justify-center text-[#B8472A]">
              <StarOfDavid size={14} color="#B8472A" />
            </div>
            <span className="font-serif text-2xl font-black text-[#171411] leading-none tracking-tight">
              Bashert
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
                    ? 'bg-[#171411] text-[#F2EDDF]'
                    : 'text-[rgba(23,20,17,0.65)] hover:bg-[rgba(23,20,17,0.06)] hover:text-[#171411]'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[rgba(23,20,17,0.08)]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[rgba(23,20,17,0.5)] hover:bg-[rgba(23,20,17,0.06)] hover:text-[#171411] transition-all text-sm"
          >
            {t.nav.settings}
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#EBE4D2]/95 backdrop-blur-md border-t border-[rgba(23,20,17,0.08)] z-40">
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
                  isActive ? 'text-[#171411]' : 'text-[rgba(23,20,17,0.40)]'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
