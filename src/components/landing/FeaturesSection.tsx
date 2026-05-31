'use client'

import { useTranslation } from '@/lib/i18n'
import { Users, Sparkles, Shield, Languages } from 'lucide-react'

const icons = [Users, Sparkles, Shield, Languages]

export function FeaturesSection() {
  const { t } = useTranslation()

  const features = [
    { title: t.landing.feature1_title, desc: t.landing.feature1_desc },
    { title: t.landing.feature2_title, desc: t.landing.feature2_desc },
    { title: t.landing.feature3_title, desc: t.landing.feature3_desc },
    { title: t.landing.feature4_title, desc: t.landing.feature4_desc },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0A0A0A] mb-4">{t.landing.features_title}</h2>
          <div className="w-16 h-1 bg-[#0A0A0A] mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => {
            const Icon = icons[i]
            return (
              <div
                key={feature.title}
                className="group p-8 rounded-3xl border border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-black group-hover:scale-110 transition-all">
                  <Icon className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
