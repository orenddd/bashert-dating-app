'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { t, isRTL } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const BackArrow = isRTL ? ArrowRight : ArrowLeft

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#c9a84c] to-[#a88530] rounded-2xl flex items-center justify-center">
            <Mail className="w-7 h-7 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1a3a5c]">{t.auth.forgot_title}</CardTitle>
        <CardDescription>{t.auth.forgot_subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-gray-600">{t.auth.reset_sent}</p>
            <p className="font-medium text-[#1a3a5c]">{email}</p>
            <Button asChild variant="outline" className="w-full rounded-2xl">
              <Link href="/login">
                <BackArrow className="w-4 h-4 me-2" />
                {t.auth.back_to_login}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.auth.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              onClick={() => setSent(true)}
              className="w-full bg-[#1a3a5c] hover:bg-[#122840] text-white rounded-2xl py-5 font-bold"
              disabled={!email}
            >
              {t.auth.send_reset}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <BackArrow className="w-4 h-4 me-2" />
                {t.auth.back_to_login}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
