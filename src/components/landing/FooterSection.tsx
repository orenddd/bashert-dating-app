'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#0A0A0A] text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="mb-4">
              <span className="text-2xl font-bold text-white">מצאתי אותך</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {t.landing.footer_tagline}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white/60 text-sm uppercase tracking-wider">ניווט</h4>
            <ul className="space-y-2 text-sm text-white/40">
              {[
                { href: '/discover', label: t.nav.discover },
                { href: '/matches', label: t.nav.matches },
                { href: '/messages', label: t.nav.messages },
                { href: '/search', label: t.nav.search },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white/60 text-sm uppercase tracking-wider">משפטי</h4>
            <ul className="space-y-2 text-sm text-white/40">
              {['מדיניות פרטיות', 'תנאי שימוש', 'מדיניות עוגיות', 'צור קשר'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-sm">
          <span>© {new Date().getFullYear()} מצאתי אותך. כל הזכויות שמורות.</span>
          <span>{t.landing.footer_tagline}</span>
        </div>
      </div>
    </footer>
  )
}
