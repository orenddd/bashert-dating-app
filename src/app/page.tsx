import Link from 'next/link'
import { Heart } from 'lucide-react'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FooterSection } from '@/components/landing/FooterSection'
import { LangToggle } from '@/components/layout/LangToggle'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-7 h-7 text-[#e8566c] fill-[#e8566c]" />
          <span className="text-2xl font-bold text-white">Bashert</span>
        </Link>
        <div className="flex items-center gap-4">
          <LangToggle className="text-white hover:text-white/80" />
          <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            כניסה
          </Link>
          <Link
            href="/register"
            className="bg-[#e8566c] hover:bg-[#c93a52] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors"
          >
            הצטרף בחינם
          </Link>
        </div>
      </nav>

      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
      </main>

      <FooterSection />
    </div>
  )
}
