'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/components/shared/AuthProvider'
import { LoginSchema, type LoginData } from '@/lib/types/forms'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      window.location.href = '/discover'
    } catch {
      toast.error('שגיאה בכניסה. בדוק את פרטיך ונסה שנית.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/40">
      <CardHeader className="text-center pb-6">
        <CardTitle className="font-serif text-2xl font-black text-white">ברוך הבא בחזרה</CardTitle>
        <CardDescription className="text-white/60">התחבר לחשבון מצאתי אותך שלך</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90 font-medium">אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-300 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90 font-medium">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.password ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-3 flex items-center text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-300 text-xs">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-white/60 hover:text-white underline underline-offset-4">
              שכחת סיסמה?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FFD24A] hover:bg-[#f5c324] text-[#0A0A0A] rounded-2xl h-11 font-bold text-base"
            disabled={isLoading}
          >
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </Button>
        </form>

        <div className="text-center text-sm text-white/60">
          אין לך חשבון?{' '}
          <Link href="/register" className="text-[#FFD24A] font-bold hover:underline">
            הצטרף עכשיו
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
