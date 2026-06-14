'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/components/shared/AuthProvider'
import { Eye, EyeOff, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const RegisterSchema = z.object({
  first_name: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  last_name: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone_number: z.string().min(9, 'מספר טלפון לא תקין').regex(/^[0-9+\-() ]+$/, 'מספר טלפון לא תקין'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirm_password'],
})

type RegisterData = z.infer<typeof RegisterSchema>

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
  })

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      await authRegister(data.email, data.password, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
      })
      router.push('/setup-profile')
    } catch {
      toast.error('שגיאה ביצירת החשבון. אולי האימייל כבר קיים?')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/40">
      <CardHeader className="text-center pb-4">
        <CardTitle className="font-serif text-2xl font-black text-white">הצטרף למצאתי אותך</CardTitle>
        <CardDescription className="text-white/60">מצא את הזיווג שלך — בחינם</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/90 font-medium text-sm">שם פרטי</Label>
              <Input
                {...register('first_name')}
                placeholder="ישראל"
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              {errors.first_name && <p className="text-red-300 text-xs">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/90 font-medium text-sm">שם משפחה</Label>
              <Input
                {...register('last_name')}
                placeholder="ישראלי"
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              {errors.last_name && <p className="text-red-300 text-xs">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/90 font-medium text-sm">אימייל</Label>
            <Input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.email && <p className="text-red-300 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/90 font-medium text-sm flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              מספר טלפון
            </Label>
            <Input
              type="tel"
              {...register('phone_number')}
              placeholder="050-0000000"
              className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              dir="ltr"
            />
            {errors.phone_number
              ? <p className="text-red-300 text-xs">{errors.phone_number.message}</p>
              : <p className="text-white/45 text-xs">מספר הטלפון עוזר לנו למנוע פרופילים פיקטיביים</p>
            }
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/90 font-medium text-sm">סיסמה</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 end-3 flex items-center text-white/50 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-300 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/90 font-medium text-sm">אימות סיסמה</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password')}
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 end-3 flex items-center text-white/50 hover:text-white">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && <p className="text-red-300 text-xs">{errors.confirm_password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FFD24A] hover:bg-[#f5c324] text-[#0A0A0A] rounded-2xl h-11 font-bold text-base"
            disabled={isLoading}
          >
            {isLoading ? 'יוצר חשבון...' : 'יצירת חשבון'}
          </Button>
        </form>

        <div className="text-center text-sm text-white/60">
          יש לך כבר חשבון?{' '}
          <Link href="/login" className="text-[#FFD24A] font-bold hover:underline">
            כניסה
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
