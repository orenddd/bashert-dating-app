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
import { useTranslation } from '@/lib/i18n'
import { LoginSchema, type LoginData } from '@/lib/types/forms'
import { Eye, EyeOff, Heart } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-[#171411] rounded-2xl flex items-center justify-center">
            <Heart className="w-7 h-7 text-[#F2EDDF] fill-[#F2EDDF]" />
          </div>
        </div>
        <CardTitle className="font-serif text-2xl font-black text-[#171411]">{t.auth.login_title}</CardTitle>
        <CardDescription>{t.auth.login_subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-400' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={errors.password ? 'border-red-400' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-[#171411] hover:underline">
              {t.auth.forgot_password}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#171411] hover:bg-[#2A2520] text-white rounded-2xl py-5 font-bold text-base"
            disabled={isLoading}
          >
            {isLoading ? t.common.loading : t.auth.login_link}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t.auth.no_account}{' '}
          <Link href="/register" className="text-[#B8472A] font-bold hover:underline">
            {t.auth.register_link}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
