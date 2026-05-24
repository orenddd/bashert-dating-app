import Link from 'next/link'
import { Heart } from 'lucide-react'
import { LangToggle } from '@/components/layout/LangToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#e8566c] fill-[#e8566c]" />
          <span className="text-xl font-bold text-[#c9a84c]">Bashert</span>
        </Link>
        <LangToggle />
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
