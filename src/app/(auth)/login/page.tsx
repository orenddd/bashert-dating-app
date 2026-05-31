'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const { login, loginWithProvider } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      router.push('/discover')
    } catch {
      toast.error('שגיאה בכניסה. בדוק את פרטיך ונסה שנית.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    try {
      await loginWithProvider(provider)
    } catch {
      toast.error('שגיאה בהתחברות. נסה שנית.')
      setSocialLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm border border-[#E5E5E5] bg-white">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-[#0A0A0A] rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">♡</span>
          </div>
        </div>
        <CardTitle className="font-serif text-2xl font-black text-[#0A0A0A]">ברוך הבא בחזרה</CardTitle>
        <CardDescription className="text-[#737373]">התחבר לחשבון מצאתי אותך שלך</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Social Login */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-[#E5E5E5] h-11 font-medium text-[#0A0A0A] hover:bg-[#F5F5F5]"
            onClick={() => handleSocialLogin('google')}
            disabled={!!socialLoading}
          >
            <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {socialLoading === 'google' ? 'מתחבר...' : 'המשך עם Google'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-[#E5E5E5] h-11 font-medium text-[#0A0A0A] hover:bg-[#F5F5F5]"
            onClick={() => handleSocialLogin('facebook')}
            disabled={!!socialLoading}
          >
            <svg className="w-5 h-5 me-2" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {socialLoading === 'facebook' ? 'מתחבר...' : 'המשך עם Facebook'}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-xs text-[#A3A3A3] font-medium">או</span>
          <div className="flex-1 h-px bg-[#E5E5E5]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#0A0A0A] font-medium">אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`h-11 rounded-xl border-[#E5E5E5] ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#0A0A0A] font-medium">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`h-11 rounded-xl border-[#E5E5E5] ${errors.password ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-3 flex items-center text-[#A3A3A3] hover:text-[#0A0A0A]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-[#737373] hover:text-[#0A0A0A] underline underline-offset-4">
              שכחת סיסמה?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-11 font-bold text-base"
            disabled={isLoading}
          >
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </Button>
        </form>

        <div className="text-center text-sm text-[#737373]">
          אין לך חשבון?{' '}
          <Link href="/register" className="text-[#0A0A0A] font-bold hover:underline">
            הצטרף עכשיו
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
