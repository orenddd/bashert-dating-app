import Link from 'next/link'
import { LangToggle } from '@/components/layout/LangToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-[#0A0A0A]">מצאתי אותך</span>
        </Link>
        <LangToggle />
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
