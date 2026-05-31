'use client'

import Link from 'next/link'
import { Settings, Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LangToggle } from './LangToggle'
import { useAuth } from '@/components/shared/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface Props {
  title?: string
  showBack?: boolean
}

export function AppHeader({ title, showBack }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const initials = user?.profile
    ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`
    : 'U'

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] flex items-center justify-between px-4 md:px-6 h-14">
      {showBack && (
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#A3A3A3] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] -ms-2">
          <ArrowRight className="w-5 h-5" />
        </Button>
      )}
      {title && (
        <h1 className="font-serif text-xl font-bold text-[#0A0A0A] tracking-tight">{title}</h1>
      )}
      <div className="flex items-center gap-1.5 ms-auto">
        <LangToggle />
        <Button variant="ghost" size="icon" asChild className="text-[#A3A3A3] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]">
          <Link href="/settings">
            <Bell className="w-5 h-5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="text-[#A3A3A3] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]">
          <Link href="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
        <Link href="/profile/me">
          <Avatar className="w-8 h-8">
            <AvatarImage src={`https://picsum.photos/seed/current-user-1/80/80`} />
            <AvatarFallback className="bg-[#0A0A0A] text-white text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
