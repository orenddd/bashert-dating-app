'use client'

import { useTranslation } from '@/lib/i18n'
import { Quote, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'שרה ויוסי', city: 'New York, NY',
    text: 'הכרנו כאן לפני שנה וחצי. כבר התחתנו! לא האמנו שאפליקציה תוכל לחבר שני ישראלים בניו יורק כל כך טוב.',
    photo: 'https://picsum.photos/seed/testimonial1/80/80',
  },
  {
    name: 'מיכל ודן', city: 'Los Angeles, CA',
    text: 'חיפשנו שניים מישהו עם חיבור יהודי אמיתי. כאן מצאנו. שמחים לשתף שבדרך לחופה!',
    photo: 'https://picsum.photos/seed/testimonial2/80/80',
  },
  {
    name: 'רונית ועמי', city: 'Chicago, IL',
    text: 'האלגוריתם ממש הבין אותנו — שניינו שומרי שבת עם תוכניות עלייה. ההתאמה הייתה מדויקת.',
    photo: 'https://picsum.photos/seed/testimonial3/80/80',
  },
]

export function TestimonialsSection() {
  const { t } = useTranslation()

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1a3a5c] mb-4">{t.landing.testimonials_title}</h2>
          <div className="w-16 h-1 bg-[#e8566c] mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
              <Quote className="absolute top-6 start-6 w-8 h-8 text-[#c9a84c]/20" />
              <div className="flex gap-1 mb-4 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">{t.text}</p>
              <div className="flex items-center gap-3">
                <img src={t.photo} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-[#1a3a5c]">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
