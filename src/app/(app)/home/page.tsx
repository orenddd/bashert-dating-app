'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, BellRing, UserCircle, MessageSquare, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/components/shared/AuthProvider'
import { FeedbackModal } from '@/components/shared/FeedbackModal'

export default function HomePage() {
  const { user } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const firstName = user?.profile?.first_name ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phone = (user?.profile as any)?.phone_number as string | undefined

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4 pt-8">

      {/* כרטיס ראשי — בקרוב */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-[#FFD24A]" />
        </div>

        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-3">
          {firstName ? `תודה שנרשמת, ${firstName}! 🎉` : 'תודה שנרשמת! 🎉'}
        </h1>

        <p className="text-[#737373] text-base leading-relaxed mb-2">
          הפרופיל שלך נקלט במערכת בהצלחה.
        </p>
        <p className="text-[#737373] text-base leading-relaxed">
          <strong className="text-[#0A0A0A]">בקרוב</strong> נתחיל להציג לך פרופילים רלוונטיים —
          וברגע שיהיו התאמות בשבילך, נעדכן אותך ישירות.
        </p>

        {/* כיצד נעדכן */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          {user?.email && (
            <span className="inline-flex items-center justify-center gap-2 bg-[#F5F5F5] text-[#0A0A0A] text-sm px-4 py-2 rounded-full">
              <Mail className="w-4 h-4 text-[#737373]" />
              {user.email}
            </span>
          )}
          {phone && (
            <span className="inline-flex items-center justify-center gap-2 bg-[#F5F5F5] text-[#0A0A0A] text-sm px-4 py-2 rounded-full" dir="ltr">
              <Phone className="w-4 h-4 text-[#737373]" />
              {phone}
            </span>
          )}
        </div>
        <p className="text-xs text-[#A3A3A3] mt-3 flex items-center justify-center gap-1.5">
          <BellRing className="w-3.5 h-3.5" />
          העדכון יישלח אליך במייל ו/או ב-SMS
        </p>
      </div>

      {/* פעולות זמינות */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/profile/me"
          className="bg-white rounded-3xl border border-[#E5E5E5] p-5 flex items-center gap-4 hover:border-[#0A0A0A] transition-colors"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F5F5] flex items-center justify-center flex-none">
            <UserCircle className="w-6 h-6 text-[#0A0A0A]" />
          </div>
          <div>
            <p className="font-bold text-[#0A0A0A] text-sm">הפרופיל שלי</p>
            <p className="text-xs text-[#A3A3A3]">צפייה ועריכה של הפרטים שלך</p>
          </div>
        </Link>

        <button
          onClick={() => setFeedbackOpen(true)}
          className="bg-white rounded-3xl border border-[#E5E5E5] p-5 flex items-center gap-4 hover:border-[#0A0A0A] transition-colors text-right"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F5F5] flex items-center justify-center flex-none">
            <MessageSquare className="w-6 h-6 text-[#0A0A0A]" />
          </div>
          <div>
            <p className="font-bold text-[#0A0A0A] text-sm">שליחת משוב</p>
            <p className="text-xs text-[#A3A3A3]">ספר/י לנו מה אפשר לשפר</p>
          </div>
        </button>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}
