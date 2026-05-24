'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { Check, Crown } from 'lucide-react'

export function PricingSection() {
  const { t } = useTranslation()

  const plans = [
    {
      name: t.subscription.free_name,
      price: t.subscription.free_price,
      features: t.subscription.features_free,
      cta: t.landing.hero_cta_primary,
      highlight: false,
      tier: 'free',
    },
    {
      name: t.subscription.gold_name,
      price: '$19.99',
      features: t.subscription.features_gold,
      cta: `${t.common.upgrade} ${t.subscription.gold_name}`,
      highlight: true,
      tier: 'gold',
      badge: t.subscription.recommended,
    },
    {
      name: t.subscription.platinum_name,
      price: '$34.99',
      features: t.subscription.features_platinum,
      cta: `${t.common.upgrade} ${t.subscription.platinum_name}`,
      highlight: false,
      tier: 'platinum',
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1a3a5c] mb-4">{t.landing.pricing_title}</h2>
          <p className="text-gray-500">{t.landing.pricing_subtitle}</p>
          <div className="w-16 h-1 bg-[#c9a84c] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 border-2 transition-all duration-300 ${
                plan.highlight
                  ? 'border-[#c9a84c] bg-gradient-to-b from-[#1a3a5c] to-[#122840] text-white shadow-2xl scale-105'
                  : 'border-gray-200 bg-white hover:border-[#c9a84c]/50 hover:shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 bg-[#c9a84c] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-[#c9a84c]' : 'text-[#1a3a5c]'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-[#1a3a5c]'}`}>
                    {plan.price}
                  </span>
                  {plan.price !== t.subscription.free_price && (
                    <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-gray-400'}`}>
                      {t.common.per_month}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlight ? 'bg-[#c9a84c]' : 'bg-green-100'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.highlight ? 'text-[#1a3a5c]' : 'text-green-600'}`} />
                    </div>
                    <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-2xl font-bold py-3 ${
                  plan.highlight
                    ? 'bg-[#c9a84c] hover:bg-[#a88530] text-[#1a3a5c]'
                    : plan.tier === 'free'
                    ? 'bg-[#e8566c] hover:bg-[#c93a52] text-white'
                    : 'bg-[#1a3a5c] hover:bg-[#122840] text-white'
                }`}
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
