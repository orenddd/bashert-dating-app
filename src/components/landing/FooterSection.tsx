'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { Heart } from 'lucide-react'

export function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#0f2744] text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-7 h-7 text-[#e8566c] fill-[#e8566c]" />
              <span className="text-2xl font-bold text-[#c9a84c]">Bashert</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              {t.landing.footer_tagline}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-[#c9a84c]">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/60">
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
            <h4 className="font-bold mb-4 text-[#c9a84c]">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
          <span>© {new Date().getFullYear()} Bashert. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 fill-[#e8566c] text-[#e8566c]" /> for the Jewish community
          </span>
        </div>
      </div>
    </footer>
  )
}
