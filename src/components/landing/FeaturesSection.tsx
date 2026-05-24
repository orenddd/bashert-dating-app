'use client'

import { useTranslation } from '@/lib/i18n'
import { Users, Sparkles, Shield, Languages } from 'lucide-react'

const icons = [Users, Sparkles, Shield, Languages]
const colors = ['text-[#1a3a5c]', 'text-[#c9a84c]', 'text-[#e8566c]', 'text-[#1a3a5c]']
const bgColors = ['bg-blue-50', 'bg-yellow-50', 'bg-rose-50', 'bg-blue-50']

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
          <h2 className="text-4xl font-bold text-[#1a3a5c] mb-4">{t.landing.features_title}</h2>
          <div className="w-16 h-1 bg-[#c9a84c] mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => {
            const Icon = icons[i]
            return (
              <div
                key={feature.title}
                className="group p-8 rounded-3xl border border-gray-100 hover:border-[#c9a84c]/30 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className={`w-16 h-16 ${bgColors[i]} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${colors[i]}`} />
                </div>
                <h3 className="text-lg font-bold text-[#1a3a5c] mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
