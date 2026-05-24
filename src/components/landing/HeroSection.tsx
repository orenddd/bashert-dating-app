'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { Heart, Star, Shield } from 'lucide-react'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2744] via-[#1a3a5c] to-[#122840]" />
      {/* Decorative circles */}
      <div className="absolute top-20 end-20 w-64 h-64 bg-[#c9a84c]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 start-10 w-80 h-80 bg-[#e8566c]/10 rounded-full blur-3xl" />
      {/* Star of David subtle watermark */}
      <div className="absolute inset-0 flex items-center justify-end pe-8 opacity-5">
        <svg viewBox="0 0 100 100" className="w-96 h-96" fill="white">
          <polygon points="50,5 61,35 95,35 68,57 79,87 50,68 21,87 32,57 5,35 39,35" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]" />
            <span className="text-white/90 text-sm font-medium">הכרויות יהודיות מס׳ 1 לישראלים בארה"ב</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {t.landing.hero_title}
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold mb-8" style={{ color: '#c9a84c' }}>
            Bashert
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
            {t.landing.hero_subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-[#e8566c] hover:bg-[#c93a52] text-white text-lg px-8 py-6 rounded-2xl font-bold shadow-xl shadow-[#e8566c]/30">
              <Link href="/register">
                <Heart className="w-5 h-5 me-2 fill-white" />
                {t.landing.hero_cta_primary}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl font-bold backdrop-blur-sm">
              <Link href="/login">
                {t.landing.hero_cta_secondary}
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap gap-6">
            {[
              { value: '50,000+', label: t.landing.stats_members },
              { value: '3,200+', label: t.landing.stats_matches },
              { value: '80+', label: t.landing.stats_cities },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#c9a84c]">{stat.value}</div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 80" fill="white" preserveAspectRatio="none" className="w-full h-16">
          <path d="M0,80 C300,0 900,80 1200,0 L1200,80 Z" />
        </svg>
      </div>
    </section>
  )
}
