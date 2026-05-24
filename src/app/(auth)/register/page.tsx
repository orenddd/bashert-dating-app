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
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/shared/AuthProvider'
import { useTranslation } from '@/lib/i18n'
import {
  RegisterStep1Schema, RegisterStep2Schema, RegisterStep3Schema,
  type RegisterStep1Data, type RegisterStep2Data, type RegisterStep3Data
} from '@/lib/types/forms'
import { Eye, EyeOff, Heart, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const { t, isRTL } = useTranslation()
  const { register: authRegister } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<RegisterStep1Data & RegisterStep2Data & RegisterStep3Data>>({
    shomer_shabbat: false,
  })

  const form1 = useForm<RegisterStep1Data>({ resolver: zodResolver(RegisterStep1Schema), defaultValues: formData })
  const form2 = useForm<RegisterStep2Data>({
    resolver: zodResolver(RegisterStep2Schema),
    defaultValues: { shomer_shabbat: false, ...formData },
  })
  const form3 = useForm<RegisterStep3Data>({ resolver: zodResolver(RegisterStep3Schema) })

  const handleStep1 = (data: RegisterStep1Data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  const handleStep2 = (data: RegisterStep2Data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(3)
  }

  const handleStep3 = async (data: RegisterStep3Data) => {
    setIsLoading(true)
    try {
      await authRegister(formData.email!, data.password, { ...formData, ...data })
      router.push('/setup-profile')
    } catch {
      toast.error('שגיאה ביצירת החשבון. נסה שנית.')
    } finally {
      setIsLoading(false)
    }
  }

  const BackArrow = isRTL ? ArrowRight : ArrowLeft
  const NextArrow = isRTL ? ArrowLeft : ArrowRight

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e8566c] to-[#c93a52] rounded-2xl flex items-center justify-center">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1a3a5c]">{t.auth.register_title}</CardTitle>
        <CardDescription>{t.auth.register_subtitle}</CardDescription>
        <div className="mt-4 space-y-2">
          <Progress value={(step / 3) * 100} className="h-2" />
          <p className="text-xs text-gray-400">
            {t.auth.step_of} {step} {t.auth.of} 3 —{' '}
            {step === 1 ? t.auth.step1_title : step === 2 ? t.auth.step2_title : t.auth.step3_title}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.auth.first_name}</Label>
                <Input {...form1.register('first_name')} placeholder="שם פרטי" />
                {form1.formState.errors.first_name && <p className="text-red-500 text-xs">{form1.formState.errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t.auth.last_name}</Label>
                <Input {...form1.register('last_name')} placeholder="שם משפחה" />
                {form1.formState.errors.last_name && <p className="text-red-500 text-xs">{form1.formState.errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t.auth.email}</Label>
              <Input type="email" {...form1.register('email')} placeholder="you@example.com" />
              {form1.formState.errors.email && <p className="text-red-500 text-xs">{form1.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{t.auth.date_of_birth}</Label>
              <Input type="date" {...form1.register('date_of_birth')} />
              {form1.formState.errors.date_of_birth && <p className="text-red-500 text-xs">{form1.formState.errors.date_of_birth.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{t.auth.gender}</Label>
              <RadioGroup
                defaultValue={formData.gender}
                onValueChange={(v) => form1.setValue('gender', v as 'male' | 'female' | 'other')}
                className="flex gap-3"
              >
                {[{ value: 'male', label: t.auth.male }, { value: 'female', label: t.auth.female }, { value: 'other', label: t.auth.other_gender }].map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                    <Label htmlFor={`gender-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label>{t.auth.seeking}</Label>
              <RadioGroup
                defaultValue={formData.seeking}
                onValueChange={(v) => form1.setValue('seeking', v as 'male' | 'female' | 'both')}
                className="flex gap-3"
              >
                {[{ value: 'male', label: t.auth.male }, { value: 'female', label: t.auth.female }, { value: 'both', label: t.auth.both }].map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`seeking-${opt.value}`} />
                    <Label htmlFor={`seeking-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full bg-[#1a3a5c] hover:bg-[#122840] text-white rounded-2xl py-5 font-bold">
              {t.common.next} <NextArrow className="w-4 h-4 ms-2" />
            </Button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.religious.level_label}</Label>
              <Select onValueChange={(v) => form2.setValue('religious_level', v as RegisterStep2Data['religious_level'])}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'] as const).map(r => (
                    <SelectItem key={r} value={r}>{t.religious[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.religious.kosher_label}</Label>
              <Select onValueChange={(v) => form2.setValue('kosher_level', v as RegisterStep2Data['kosher_level'])}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'none', label: t.religious.kosher_none },
                    { value: 'kosher_home', label: t.religious.kosher_home },
                    { value: 'kosher_out', label: t.religious.kosher_out },
                    { value: 'strict', label: t.religious.kosher_strict },
                  ].map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>{t.religious.shomer_shabbat}</Label>
              <Switch onCheckedChange={(v) => form2.setValue('shomer_shabbat', v)} />
            </div>

            <div className="space-y-1.5">
              <Label>{t.community.background_label}</Label>
              <Select onValueChange={(v) => form2.setValue('community_background', v as RegisterStep2Data['community_background'])}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed', 'other'] as const).map(c => (
                    <SelectItem key={c} value={c}>{t.community[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.community.hebrew_fluency_label}</Label>
              <Select onValueChange={(v) => form2.setValue('hebrew_fluency', v as RegisterStep2Data['hebrew_fluency'])}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'none', label: t.community.hebrew_none },
                    { value: 'basic', label: t.community.hebrew_basic },
                    { value: 'conversational', label: t.community.hebrew_conversational },
                    { value: 'fluent', label: t.community.hebrew_fluent },
                    { value: 'native', label: t.community.hebrew_native },
                  ].map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-2xl">
                <BackArrow className="w-4 h-4 me-2" /> {t.common.back}
              </Button>
              <Button type="submit" className="flex-1 bg-[#1a3a5c] hover:bg-[#122840] text-white rounded-2xl font-bold">
                {t.common.next} <NextArrow className="w-4 h-4 ms-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={form3.handleSubmit(handleStep3)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.auth.password}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...form3.register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 end-3 flex items-center text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form3.formState.errors.password && <p className="text-red-500 text-xs">{form3.formState.errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{t.auth.confirm_password}</Label>
              <Input type="password" {...form3.register('confirm_password')} />
              {form3.formState.errors.confirm_password && <p className="text-red-500 text-xs">{form3.formState.errors.confirm_password.message}</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-2xl">
                <BackArrow className="w-4 h-4 me-2" /> {t.common.back}
              </Button>
              <Button type="submit" className="flex-1 bg-[#e8566c] hover:bg-[#c93a52] text-white rounded-2xl font-bold" disabled={isLoading}>
                {isLoading ? t.common.loading : t.common.done}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          {t.auth.has_account}{' '}
          <Link href="/login" className="text-[#1a3a5c] font-bold hover:underline">{t.auth.login_link}</Link>
        </div>
      </CardContent>
    </Card>
  )
}
