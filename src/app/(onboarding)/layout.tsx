import Link from 'next/link'
import { Heart } from 'lucide-react'
import { LangToggle } from '@/components/layout/LangToggle'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rose-50">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/60">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#e8566c] fill-[#e8566c]" />
          <span className="text-xl font-bold text-[#c9a84c]">Bashert</span>
        </Link>
        <LangToggle />
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {children}
      </div>
    </div>
  )
}
