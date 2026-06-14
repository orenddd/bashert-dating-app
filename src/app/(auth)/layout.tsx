'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#050a1a]">
      {/* רקע — פוסטר המותג */}
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: 'url(/logodatingapp.jpeg)' }}
      />
      {/* שכבת כהיה לקריאוּת הטופס */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,10,26,0.25) 0%, rgba(5,10,26,0.55) 45%, rgba(5,10,26,0.9) 72%, rgba(5,10,26,0.97) 100%)',
        }}
      />

      <nav className="relative flex items-center px-4 py-3">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </nav>
      <div className="relative flex-1 flex items-end justify-center p-6 pb-10 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
