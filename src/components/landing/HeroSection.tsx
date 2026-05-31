'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0A0A0A]">
      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 60px),
                          repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 60px)`
      }} />

      {/* Glow accent */}
      <div className="absolute top-1/3 end-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-white/80 text-sm font-medium">אפליקציית ההיכרויות לישראלים</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
            {t.landing.hero_title}
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold text-white/30 mb-8 leading-tight">
            מצאתי אותך
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl leading-relaxed">
            {t.landing.hero_subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 rounded-2xl font-bold">
              <Link href="/register">
                {t.landing.hero_cta_primary}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl font-bold">
              <Link href="/login">
                {t.landing.hero_cta_secondary}
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap gap-8">
            {[
              { value: '50,000+', label: t.landing.stats_members },
              { value: '3,200+', label: t.landing.stats_matches },
              { value: '80+', label: t.landing.stats_cities },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/40 text-sm mt-1">{stat.label}</div>
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
