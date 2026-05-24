'use client'

import Link from 'next/link'
import { Settings, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LangToggle } from './LangToggle'
import { useAuth } from '@/components/shared/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  title?: string
}

export function AppHeader({ title }: Props) {
  const { user } = useAuth()
  const initials = user?.profile
    ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`
    : 'U'

  return (
    <header className="sticky top-0 z-30 bg-[#F2EDDF]/95 backdrop-blur-sm border-b border-[rgba(23,20,17,0.08)] flex items-center justify-between px-4 md:px-6 h-14">
      {title && (
        <h1 className="font-serif text-xl font-bold text-[#171411] tracking-tight">{title}</h1>
      )}
      <div className="flex items-center gap-1.5 ms-auto">
        <LangToggle />
        <Button variant="ghost" size="icon" asChild className="text-[rgba(23,20,17,0.55)] hover:text-[#171411] hover:bg-[rgba(23,20,17,0.06)]">
          <Link href="/settings">
            <Bell className="w-5 h-5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="text-[rgba(23,20,17,0.55)] hover:text-[#171411] hover:bg-[rgba(23,20,17,0.06)]">
          <Link href="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
        <Link href="/profile/me">
          <Avatar className="w-8 h-8">
            <AvatarImage src={`https://picsum.photos/seed/current-user-1/80/80`} />
            <AvatarFallback className="bg-[#171411] text-[#F2EDDF] text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
