'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'
import { Camera, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const TOTAL_STEPS = 5

export default function SetupProfilePage() {
  const { t, isRTL } = useTranslation()
  const { updateProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    city: '', state: '', occupation: '', education: '', height_cm: '',
    bio: '',
    religious_level: '', kosher_level: '', shomer_shabbat: false,
    synagogue_attendance: '', community_background: '', hebrew_fluency: '', aliyah_plan: '',
    children_status: '', wants_children: false,
    age_pref_min: '25', age_pref_max: '45', distance_pref: '80',
  })

  const update = (key: string, value: string | boolean | null) =>
    setFormData(prev => ({ ...prev, [key]: value ?? '' }))

  const BackArrow = isRTL ? ArrowRight : ArrowLeft
  const NextArrow = isRTL ? ArrowLeft : ArrowRight

  const finish = () => {
    updateProfile({ profile_complete: true, bio: formData.bio, city: formData.city, state: formData.state } as Parameters<typeof updateProfile>[0])
    toast.success('הפרופיל שלך מוכן!')
    router.push('/discover')
  }

  const stepLabels = [t.onboarding.step1, t.onboarding.step2, t.onboarding.step3, t.onboarding.step4, t.onboarding.step5]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1a3a5c] mb-2">{t.onboarding.title}</h1>
        <p className="text-gray-500">{t.onboarding.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2.5" />
        <div className="flex justify-between">
          {stepLabels.map((label, i) => (
            <span key={i} className={`text-xs ${i + 1 === step ? 'text-[#1a3a5c] font-bold' : 'text-gray-400'}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">

        {/* Step 1: Location & Career */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1a3a5c]">{t.onboarding.step1}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.onboarding.city_placeholder}</Label>
                <Input value={formData.city} onChange={e => update('city', e.target.value)} placeholder="New York" />
              </div>
              <div className="space-y-1.5">
                <Label>{t.onboarding.state_placeholder}</Label>
                <Input value={formData.state} onChange={e => update('state', e.target.value)} placeholder="NY" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.occupation_placeholder}</Label>
              <Input value={formData.occupation} onChange={e => update('occupation', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.education_placeholder}</Label>
              <Input value={formData.education} onChange={e => update('education', e.target.value)} placeholder="Columbia University" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.height_placeholder}</Label>
              <Input type="number" value={formData.height_cm} onChange={e => update('height_cm', e.target.value)} placeholder="175" />
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1a3a5c]">{t.onboarding.step2}</h2>
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#1a3a5c]" />
              <p className="text-sm text-[#1a3a5c]">{t.onboarding.photo_tip}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                    i === 0 ? 'border-[#1a3a5c] bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {i === 0 ? (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-[#1a3a5c] mx-auto mb-2" />
                      <span className="text-xs text-[#1a3a5c] font-medium">{t.profile.primary_photo}</span>
                    </div>
                  ) : (
                    <Camera className="w-6 h-6 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">{t.profile.add_photo}</p>
          </div>
        )}

        {/* Step 3: Jewish Identity */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1a3a5c]">{t.onboarding.step3}</h2>
            <div className="space-y-1.5">
              <Label>{t.religious.level_label}</Label>
              <Select value={formData.religious_level} onValueChange={v => update('religious_level', v)}>
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
              <Select value={formData.kosher_level} onValueChange={v => update('kosher_level', v)}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'none', label: t.religious.kosher_none },
                    { value: 'kosher_home', label: t.religious.kosher_home },
                    { value: 'kosher_out', label: t.religious.kosher_out },
                    { value: 'strict', label: t.religious.kosher_strict },
                  ].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>{t.religious.shomer_shabbat}</Label>
              <Switch checked={formData.shomer_shabbat} onCheckedChange={v => update('shomer_shabbat', v)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.religious.synagogue_label}</Label>
              <Select value={formData.synagogue_attendance} onValueChange={v => update('synagogue_attendance', v)}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'never', label: t.religious.synagogue_never },
                    { value: 'holidays', label: t.religious.synagogue_holidays },
                    { value: 'monthly', label: t.religious.synagogue_monthly },
                    { value: 'weekly', label: t.religious.synagogue_weekly },
                    { value: 'daily', label: t.religious.synagogue_daily },
                  ].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.community.background_label}</Label>
              <Select value={formData.community_background} onValueChange={v => update('community_background', v)}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed', 'other'] as const).map(c => (
                    <SelectItem key={c} value={c}>{t.community[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.community.aliyah_label}</Label>
              <Select value={formData.aliyah_plan} onValueChange={v => update('aliyah_plan', v)}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'no', label: t.community.aliyah_no },
                    { value: 'considering', label: t.community.aliyah_considering },
                    { value: 'planning', label: t.community.aliyah_planning },
                    { value: 'already_made', label: t.community.aliyah_done },
                  ].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1a3a5c]">{t.onboarding.step4}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.onboarding.pref_age_min}</Label>
                <Input type="number" min={18} max={80} value={formData.age_pref_min} onChange={e => update('age_pref_min', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.onboarding.pref_age_max}</Label>
                <Input type="number" min={18} max={80} value={formData.age_pref_max} onChange={e => update('age_pref_max', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.pref_distance}</Label>
              <Input type="number" value={formData.distance_pref} onChange={e => update('distance_pref', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.children.status_label}</Label>
              <Select value={formData.children_status} onValueChange={v => update('children_status', v)}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'no_children', label: t.children.no_children },
                    { value: 'has_children', label: t.children.has_children },
                    { value: 'wants_children', label: t.children.wants_children },
                    { value: 'does_not_want', label: t.children.does_not_want },
                    { value: 'open', label: t.children.open },
                  ].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 5: Bio */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1a3a5c]">{t.onboarding.step5}</h2>
            <div className="space-y-1.5">
              <Label>{t.profile.about}</Label>
              <Textarea
                value={formData.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder={t.onboarding.bio_placeholder}
                className="min-h-40 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 text-end">{formData.bio.length}/500</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">הפרופיל שלך כמעט מוכן!</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => (s - 1) as typeof step)} className="flex-1 rounded-2xl">
            <BackArrow className="w-4 h-4 me-2" /> {t.common.back}
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            onClick={() => setStep(s => (s + 1) as typeof step)}
            className="flex-1 bg-[#1a3a5c] hover:bg-[#122840] text-white rounded-2xl font-bold"
          >
            {t.common.next} <NextArrow className="w-4 h-4 ms-2" />
          </Button>
        ) : (
          <Button onClick={finish} className="flex-1 bg-[#e8566c] hover:bg-[#c93a52] text-white rounded-2xl font-bold">
            {t.onboarding.finish}
          </Button>
        )}
      </div>
    </div>
  )
}
