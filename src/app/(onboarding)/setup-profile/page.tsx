'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/components/shared/AuthProvider'
import { ArrowRight, ArrowLeft, Camera, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  first_name: string
  last_name: string
  birth_year: string
  gender: 'male' | 'female' | ''
  marital_status: 'single' | 'divorced' | 'widowed' | ''
  height_cm: string
  relationship_goal: string[]
  children_future: string
  seeking_status: string[]
  seeking_with_kids: string
  age_pref_min: number
  age_pref_max: number
  distance_pref_km: number
  religion: string[]
  city: string
  residence_intent: string[]
  photos: File[]
  languages: string[]
  romantic_vision: string[]
  friday_night: string[]
  saturday_morning: string[]
  hobbies: string
  hobby_custom: string
  open_bio: string
  open_seeking: string
  open_dealbreaker: string
  open_work: string
  open_quote: string
  open_loves: string
  open_strength: string
  open_future_self: string
  open_future_us: string
  open_lie: string
  open_movie: string
  open_crazy: string
  open_first_impression: string
  open_song: string
  open_weird_habit: string
  open_childish: string
  open_food: string
}

// ─── Helper Components ────────────────────────────────────────────────────────

function MultiSelectButtons({
  options,
  selected,
  onToggle,
  max,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
  max?: number
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value)
        const atMax = max !== undefined && selected.length >= max && !isSelected
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !atMax && onToggle(opt.value)}
            className={cn(
              'px-4 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all text-right',
              isSelected
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : atMax
                ? 'opacity-40 cursor-not-allowed border-[#E5E5E5] text-[#A3A3A3]'
                : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
            )}
          >
            {isSelected && <Check className="w-3 h-3 inline me-1" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function SingleSelectButtons({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; desc?: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={cn(
            'w-full text-right px-4 py-3 rounded-2xl border-2 transition-all',
            selected === opt.value
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
              : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
          )}
        >
          <div className="font-medium text-sm">{opt.label}</div>
          {opt.desc && (
            <div className={cn('text-xs mt-0.5', selected === opt.value ? 'text-white/60' : 'text-[#A3A3A3]')}>
              {opt.desc}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function StepHeader({ title, subtitle, optional }: { title: string; subtitle?: string; optional?: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-[#0A0A0A]">{title}</h2>
        {optional && (
          <span className="text-xs bg-[#EDE9FE] text-[#7C3AED] px-2.5 py-0.5 rounded-full font-medium">
            אופציונלי
          </span>
        )}
      </div>
      {subtitle && <p className="text-[#737373] text-sm">{subtitle}</p>}
    </div>
  )
}

function RangeSlider({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[#0A0A0A]">{label}</label>
        <span className="text-sm font-bold text-[#0A0A0A]">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none bg-[#E5E5E5] rounded-full cursor-pointer accent-[#0A0A0A]"
      />
      <div className="flex justify-between text-xs text-[#A3A3A3]">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  'name', 'birth_year', 'gender', 'status', 'height',
  'relationship_goal', 'children_future',
  'seeking_partner', 'seeking_range',
  'religion', 'location', 'residence_intent',
  'photos', 'languages',
  'romantic_vision', 'friday_night', 'saturday_morning', 'hobbies',
  'open_required', 'open_optional',
] as const

type Step = typeof STEPS[number]

const TOTAL = STEPS.length

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const defaultFirst = user?.profile?.first_name ?? ''
  const defaultLast = user?.profile?.last_name ?? ''

  const [form, setForm] = useState<FormData>({
    first_name: defaultFirst,
    last_name: defaultLast,
    birth_year: '',
    gender: '',
    marital_status: '',
    height_cm: '',
    relationship_goal: [],
    children_future: '',
    seeking_status: [],
    seeking_with_kids: '',
    age_pref_min: 22,
    age_pref_max: 45,
    distance_pref_km: 50,
    religion: [],
    city: '',
    residence_intent: [],
    photos: [],
    languages: [],
    romantic_vision: [],
    friday_night: [],
    saturday_morning: [],
    hobbies: '',
    hobby_custom: '',
    open_bio: '',
    open_seeking: '',
    open_dealbreaker: '',
    open_work: '',
    open_quote: '',
    open_loves: '',
    open_strength: '',
    open_future_self: '',
    open_future_us: '',
    open_lie: '',
    open_movie: '',
    open_crazy: '',
    open_first_impression: '',
    open_song: '',
    open_weird_habit: '',
    open_childish: '',
    open_food: '',
  })

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const toggleMulti = (field: keyof FormData, value: string) => {
    const arr = form[field] as string[]
    set(field as keyof FormData, (arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]) as FormData[typeof field])
  }

  const currentStep: Step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / TOTAL) * 100

  // Validation per step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'name': return form.first_name.trim().length >= 2 && form.last_name.trim().length >= 2
      case 'birth_year': return !!form.birth_year && Number(form.birth_year) >= 1944 && Number(form.birth_year) <= 2006
      case 'gender': return !!form.gender
      case 'status': return !!form.marital_status
      case 'height': return true // optional
      case 'relationship_goal': return form.relationship_goal.length > 0
      case 'children_future': return !!form.children_future
      case 'seeking_partner': return form.seeking_status.length > 0
      case 'seeking_range': return true
      case 'religion': return form.religion.length > 0
      case 'location': return form.city.trim().length > 0
      case 'residence_intent': return form.residence_intent.length > 0
      case 'photos': return form.photos.length >= 3
      case 'languages': return form.languages.length > 0
      case 'romantic_vision': return true
      case 'friday_night': return true
      case 'saturday_morning': return true
      case 'hobbies': return true
      case 'open_required': return form.open_bio.trim().length >= 10
      case 'open_optional': return true
      default: return true
    }
  }

  const isOptionalStep = ['height', 'seeking_range', 'romantic_vision', 'friday_night', 'saturday_morning', 'hobbies', 'open_optional'].includes(currentStep)

  const finish = async () => {
    setIsSaving(true)
    try {
      const hobbiesArr = [
        ...form.hobbies.split(',').map(h => h.trim()).filter(Boolean),
        ...(form.hobby_custom ? [form.hobby_custom.trim()] : []),
      ]
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        display_name: `${form.first_name} ${form.last_name}`.trim(),
        birth_year: Number(form.birth_year) || null,
        gender: form.gender as 'male' | 'female',
        seeking: form.gender === 'male' ? 'female' : 'male',
        marital_status: form.marital_status as 'single' | 'divorced' | 'widowed',
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        relationship_goal: form.relationship_goal,
        children_future: form.children_future as FormData['children_future'],
        seeking_status: form.seeking_status,
        seeking_with_kids: form.seeking_with_kids as 'yes' | 'no' | 'dont_mind' | '',
        age_pref_min: form.age_pref_min,
        age_pref_max: form.age_pref_max,
        distance_pref_km: form.distance_pref_km,
        religious_level: (form.religion[0] ?? 'masorti') as 'hiloni' | 'masorti' | 'dati_light' | 'dati' | 'haredi',
        city: form.city,
        residence_intent: form.residence_intent,
        languages: form.languages,
        romantic_vision: form.romantic_vision,
        friday_night: form.friday_night,
        saturday_morning: form.saturday_morning,
        hobbies: hobbiesArr,
        open_questions: {
          bio: form.open_bio,
          seeking: form.open_seeking,
          dealbreaker: form.open_dealbreaker,
          work: form.open_work,
          quote: form.open_quote,
          loves: form.open_loves,
          strength: form.open_strength,
          future_self: form.open_future_self,
          future_us: form.open_future_us,
          lie: form.open_lie,
          movie: form.open_movie,
          crazy: form.open_crazy,
          first_impression: form.open_first_impression,
          song: form.open_song,
          weird_habit: form.open_weird_habit,
          childish: form.open_childish,
          food: form.open_food,
        },
        bio: form.open_bio,
        profile_complete: true,
      })
      toast.success('הפרופיל שלך מוכן! 🎉')
      router.push('/discover')
    } catch {
      toast.error('שגיאה בשמירת הפרופיל. נסה שנית.')
    } finally {
      setIsSaving(false)
    }
  }

  const next = () => {
    if (stepIndex < TOTAL - 1) setStepIndex(s => s + 1)
    else finish()
  }

  const back = () => {
    if (stepIndex > 0) setStepIndex(s => s - 1)
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)
    setForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...newFiles].slice(0, 10),
    }))
  }

  const removePhoto = (i: number) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#E5E5E5]">
        <div
          className="h-full bg-[#0A0A0A] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="fixed top-1 left-0 right-0 z-40 flex items-center justify-between px-4 pt-3 pb-2 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <button
          onClick={back}
          disabled={stepIndex === 0}
          className="text-[#A3A3A3] hover:text-[#0A0A0A] disabled:opacity-30 transition-colors p-1"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-[#A3A3A3] font-medium">שלב {stepIndex + 1} מתוך {TOTAL}</p>
          <p className="text-xs font-bold text-[#0A0A0A]">מצאתי אותך</p>
        </div>
        {isOptionalStep && (
          <button onClick={next} className="text-xs text-[#7C3AED] font-medium hover:underline">
            דלג
          </button>
        )}
        {!isOptionalStep && <div className="w-10" />}
      </div>

      {/* Content */}
      <div className="pt-20 pb-32 px-4 max-w-lg mx-auto">
        {/* ── Step: Name ── */}
        {currentStep === 'name' && (
          <div>
            <StepHeader title="נעים להכיר 👋" subtitle="איך קוראים לך?" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">שם פרטי</label>
                <Input
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="ישראל"
                  className="h-12 rounded-2xl border-[#E5E5E5] text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">שם משפחה</label>
                <Input
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="ישראלי"
                  className="h-12 rounded-2xl border-[#E5E5E5] text-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Birth Year ── */}
        {currentStep === 'birth_year' && (
          <div>
            <StepHeader title="שנת לידה" subtitle="כמה גרוסים אתה?" />
            <Input
              type="number"
              value={form.birth_year}
              onChange={e => set('birth_year', e.target.value)}
              placeholder="1990"
              min={1944}
              max={2006}
              className="h-16 rounded-2xl border-[#E5E5E5] text-3xl font-bold text-center"
              dir="ltr"
            />
            <p className="text-xs text-[#A3A3A3] mt-2 text-center">גיל נגזר מהשנה בלבד — לא תאריך מלא</p>
          </div>
        )}

        {/* ── Step: Gender ── */}
        {currentStep === 'gender' && (
          <div>
            <StepHeader title="גבר או אישה?" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { value: 'male', label: '👨 גבר' },
                { value: 'female', label: '👩 אישה' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('gender', opt.value as 'male' | 'female')}
                  className={cn(
                    'h-24 rounded-3xl border-2 text-lg font-bold transition-all',
                    form.gender === opt.value
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Marital Status ── */}
        {currentStep === 'status' && (
          <div>
            <StepHeader title="מה הסטטוס שלך?" />
            <SingleSelectButtons
              options={[
                { value: 'single', label: 'רווק / רווקה' },
                { value: 'divorced', label: 'גרוש / גרושה' },
                { value: 'widowed', label: 'אלמן / אלמנה' },
              ]}
              selected={form.marital_status}
              onSelect={v => set('marital_status', v as FormData['marital_status'])}
            />
          </div>
        )}

        {/* ── Step: Height (optional) ── */}
        {currentStep === 'height' && (
          <div>
            <StepHeader title="מה הגובה שלך?" optional />
            <div className="space-y-2">
              <Input
                type="number"
                value={form.height_cm}
                onChange={e => set('height_cm', e.target.value)}
                placeholder="175"
                min={140}
                max={220}
                className="h-16 rounded-2xl border-[#E5E5E5] text-3xl font-bold text-center"
                dir="ltr"
              />
              <p className="text-center text-[#A3A3A3] text-sm">ס"מ</p>
            </div>
          </div>
        )}

        {/* ── Step: Relationship Goal ── */}
        {currentStep === 'relationship_goal' && (
          <div>
            <StepHeader title="מה אני מחפש?" subtitle="אפשר לבחור יותר מאחד" />
            <MultiSelectButtons
              options={[
                { value: 'marriage', label: '💍 חתונה וחמין בשבת' },
                { value: 'serious_easy', label: '☕ קשר רציני בקצב רגוע וקליל' },
                { value: 'chapter2', label: '🌱 פרק ב׳' },
                { value: 'chemistry', label: '✨ כימיה טובה ומשם נראה' },
                { value: 'dating', label: '😊 היכרות קלילה / דייטינג בכיף' },
                { value: 'just_looking', label: '👀 רק בודק מה יש פה באפליקציה 😅' },
              ]}
              selected={form.relationship_goal}
              onToggle={v => toggleMulti('relationship_goal', v)}
            />
          </div>
        )}

        {/* ── Step: Children Future ── */}
        {currentStep === 'children_future' && (
          <div>
            <StepHeader title="ילדים בעתיד" subtitle="איפה אתה עומד בנושא?" />
            <SingleSelectButtons
              options={[
                { value: 'want_must', label: '👨‍👩‍👧 רוצה משפחה וילדים — זה חובה מבחינתי' },
                { value: 'want_sometime', label: '🌿 כן, אבל כל דבר בזמן שלו' },
                { value: 'undecided', label: '🤷 עוד לא החלטתי לגבי ילדים' },
                { value: 'dont_want', label: '✋ ילדים זה לא חלק מהתוכנית שלי' },
                { value: 'have_maybe_more', label: '👶 כבר יש לי ילדים — ואולי עוד בהמשך' },
                { value: 'have_enough', label: '💛 כבר יש לי ילדים, וזה מספיק לי כרגע' },
              ]}
              selected={form.children_future}
              onSelect={v => set('children_future', v)}
            />
          </div>
        )}

        {/* ── Step: Seeking Partner ── */}
        {currentStep === 'seeking_partner' && (
          <div>
            <StepHeader title="האחת שלי / האחד שלי" subtitle="מה הסטטוס המועדף? (אפשר כמה)" />
            <MultiSelectButtons
              options={[
                { value: 'single', label: 'רווקה / רווק' },
                { value: 'divorced', label: 'גרושה / גרוש' },
                { value: 'widowed', label: 'אלמנה / אלמן' },
              ]}
              selected={form.seeking_status}
              onToggle={v => toggleMulti('seeking_status', v)}
            />
            <div className="mt-6">
              <p className="text-sm font-medium text-[#0A0A0A] mb-3">ילדים מקשר קודם?</p>
              <SingleSelectButtons
                options={[
                  { value: 'yes', label: '✅ עם ילדים — בסדר גמור' },
                  { value: 'no', label: '🚫 מעדיפ/ה ללא ילדים' },
                  { value: 'dont_mind', label: '💛 לא משנה לי' },
                ]}
                selected={form.seeking_with_kids}
                onSelect={v => set('seeking_with_kids', v)}
              />
            </div>
          </div>
        )}

        {/* ── Step: Seeking Range (optional) ── */}
        {currentStep === 'seeking_range' && (
          <div>
            <StepHeader title="טווח העדפות" optional />
            <div className="space-y-8">
              <div className="space-y-4">
                <RangeSlider
                  label={`גיל מינימלי`}
                  value={form.age_pref_min}
                  min={18}
                  max={form.age_pref_max - 1}
                  onChange={v => set('age_pref_min', v)}
                  suffix=" שנה"
                />
                <RangeSlider
                  label={`גיל מקסימלי`}
                  value={form.age_pref_max}
                  min={form.age_pref_min + 1}
                  max={80}
                  onChange={v => set('age_pref_max', v)}
                  suffix=" שנה"
                />
              </div>
              <RangeSlider
                label="מרחק מקסימלי ממני"
                value={form.distance_pref_km}
                min={5}
                max={500}
                onChange={v => set('distance_pref_km', v)}
                suffix=" ק״מ"
              />
            </div>
          </div>
        )}

        {/* ── Step: Religion ── */}
        {currentStep === 'religion' && (
          <div>
            <StepHeader title="דת ורמת דתיות" subtitle="איך תגדיר את עצמך?" />
            <MultiSelectButtons
              options={[
                { value: 'hiloni', label: '☀️ חילוני' },
                { value: 'hiloni_heart', label: '💙 יהודי בלב, חילוני בלו״ז. בית כנסת — רק בבר מצווה' },
                { value: 'masorti', label: '🕎 מסורתי' },
                { value: 'masorti_lite', label: '🍷 עושה קידוש בשישי ואז מדליק את הטלוויזיה' },
                { value: 'dati_light', label: '📖 דתי לייט — שומר שבת וכשרות, אבל זורם עם העולם' },
                { value: 'dati', label: '✡️ דתי על מלא — בית דתי למהדרין, תפילות, חגים — כל החבילה' },
              ]}
              selected={form.religion}
              onToggle={v => toggleMulti('religion', v)}
            />
          </div>
        )}

        {/* ── Step: Location ── */}
        {currentStep === 'location' && (
          <div>
            <StepHeader title="איפה אתה גר?" subtitle="עיר מגורים" />
            <Input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="תל אביב, ניו יורק, לוס אנג׳לס..."
              className="h-14 rounded-2xl border-[#E5E5E5] text-base"
            />
          </div>
        )}

        {/* ── Step: Residence Intent ── */}
        {currentStep === 'residence_intent' && (
          <div>
            <StepHeader title="איפה הלב שלך מתכנן לגור? 🏡" subtitle="אפשר לבחור יותר מאחד" />
            <MultiSelectButtons
              options={[
                { value: 'israel_stay', label: '🇮🇱 בארץ ולא זז — טוב לי פה 😎' },
                { value: 'israel_maybe_reloc', label: '✈️ בארץ… אבל אהבה טובה יכולה לשלוח אותי לרילוקיישן' },
                { value: 'abroad_return_soon', label: '🔄 כרגע בחו״ל, אבל ישראל קוראת לי לחזור בשנה-שנתיים' },
                { value: 'abroad_return_later', label: '⏳ כרגע בחו״ל, כנראה חוזר/ת בעוד כמה שנים' },
                { value: 'abroad_stay', label: '🌍 בחו״ל וטפו טפו, בינתיים נשאר' },
                { value: 'flexible', label: '💕 תלוי בזוגיות — הבית זה איפה שיש חיבור טוב' },
              ]}
              selected={form.residence_intent}
              onToggle={v => toggleMulti('residence_intent', v)}
            />
          </div>
        )}

        {/* ── Step: Photos ── */}
        {currentStep === 'photos' && (
          <div>
            <StepHeader title="תמונות ומדיה" subtitle="חובה לפחות 3, עד 10 קבצים (תמונות, סרטון, שמע)" />

            <div className="grid grid-cols-3 gap-2 mb-4">
              {form.photos.map((file, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#E5E5E5]">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 end-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1">
                      ראשית
                    </div>
                  )}
                </div>
              ))}

              {form.photos.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                    form.photos.length < 3
                      ? 'border-[#0A0A0A] bg-gray-50'
                      : 'border-[#E5E5E5] hover:border-[#0A0A0A]'
                  )}
                >
                  <Camera className="w-6 h-6 text-[#A3A3A3]" />
                  <span className="text-xs text-[#A3A3A3]">הוסף</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              className="hidden"
              onChange={handlePhotos}
            />

            <div className="bg-[#F5F5F5] rounded-2xl p-3 text-center">
              <p className="text-sm text-[#737373]">
                {form.photos.length}/10 קבצים •{' '}
                {form.photos.length < 3
                  ? <span className="text-red-500 font-medium">נדרשות לפחות {3 - form.photos.length} תמונות נוספות</span>
                  : <span className="text-green-600 font-medium">✓ מינימום הושג</span>
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Step: Languages ── */}
        {currentStep === 'languages' && (
          <div>
            <StepHeader title="באילו שפות אתה מדבר?" subtitle="אפשר לבחור כמה" />
            <MultiSelectButtons
              options={[
                { value: 'he', label: '🇮🇱 עברית' },
                { value: 'en', label: '🇺🇸 אנגלית' },
                { value: 'ar', label: '🌙 ערבית' },
                { value: 'ru', label: '🇷🇺 רוסית' },
                { value: 'es', label: '🇪🇸 ספרדית' },
                { value: 'fr', label: '🇫🇷 צרפתית' },
                { value: 'am', label: '🇪🇹 אמהרית' },
                { value: 'yi', label: '✡️ יידיש' },
                { value: 'fa', label: '🇮🇷 פרסית' },
                { value: 'pt', label: '🇧🇷 פורטוגזית' },
                { value: 'de', label: '🇩🇪 גרמנית' },
                { value: 'it', label: '🇮🇹 איטלקית' },
              ]}
              selected={form.languages}
              onToggle={v => toggleMulti('languages', v)}
            />
          </div>
        )}

        {/* ── Step: Romantic Vision (optional) ── */}
        {currentStep === 'romantic_vision' && (
          <div>
            <StepHeader title="רומנטי בעיניי זה..." optional subtitle="אפשר לבחור כמה שרוצים" />
            <MultiSelectButtons
              options={[
                { value: 'cuddle_movie', label: '🛋️ להתכרבל יחד ולראות סרט בבית' },
                { value: 'walk_talk', label: '🚶 טיול רגלי בלי יעד, רק יחד עם שיחה עמוקה' },
                { value: 'long_hug', label: '🤗 חיבוק ארוך אחרי יום קשוח' },
                { value: 'midday_msg', label: '💬 הודעה קטנה באמצע היום שמעלה חיוך' },
                { value: 'car_music', label: '🚗 נסיעה ברכב עם מוזיקה בפול וולום וחלונות פתוחים' },
                { value: 'shared_laugh', label: '😂 צחוק משותף על שטות שאף אחד אחר לא מבין' },
                { value: 'shawarma', label: '🌯 מישהו שקונה לך לאפה שווארמה ב-11 בלילה' },
              ]}
              selected={form.romantic_vision}
              onToggle={v => toggleMulti('romantic_vision', v)}
            />
          </div>
        )}

        {/* ── Step: Friday Night (optional) ── */}
        {currentStep === 'friday_night' && (
          <div>
            <StepHeader title="שישי בערב אצלי זה..." optional subtitle="אפשר לבחור כמה" />
            <MultiSelectButtons
              options={[
                { value: 'family_kiddush', label: '🕯️ קידוש אצל ההורים / ארוחה משפחתית כהלכתה — חובה חלה עם חריימה' },
                { value: 'friends_dinner', label: '🥂 ארוחת שישי מגניבה עם חברים כולל רכילות על חתונמי' },
                { value: 'takeaway_netflix', label: '🍕 טייק אוואי ונטפליקס' },
              ]}
              selected={form.friday_night}
              onToggle={v => toggleMulti('friday_night', v)}
            />
          </div>
        )}

        {/* ── Step: Saturday Morning (optional) ── */}
        {currentStep === 'saturday_morning' && (
          <div>
            <StepHeader title="שבת בבוקר..." optional subtitle="אפשר לבחור כמה" />
            <MultiSelectButtons
              options={[
                { value: 'beach_matkot', label: '🏖️ ים, מטקות ואבטיח' },
                { value: 'cafe', label: '☕ בית קפה ברגוע' },
                { value: 'synagogue', label: '🕍 בית כנסת על הבוקר' },
                { value: 'sleep_late', label: '😴 נוחר עד 12:00 ואז ישיר לחמין של שבת' },
              ]}
              selected={form.saturday_morning}
              onToggle={v => toggleMulti('saturday_morning', v)}
            />
          </div>
        )}

        {/* ── Step: Hobbies (optional) ── */}
        {currentStep === 'hobbies' && (
          <div>
            <StepHeader title="מה התחביבים שלך?" optional subtitle="בחר מהרשימה ו/או כתוב בעצמך" />
            <MultiSelectButtons
              options={[
                { value: 'soccer', label: '⚽ כדורגל ישראלי/אירופאי' },
                { value: 'sport', label: '🏃 ספורט / כושר / ריצה' },
                { value: 'torah', label: '📜 שיעורי תורה' },
                { value: 'cooking', label: '👨‍🍳 בשלן תותח — עונה הבאה אני במסטאר שף' },
                { value: 'nightlife', label: '🍽️ מסעדות, ברים ויציאות בעיר' },
                { value: 'series', label: '📺 צפייה בסדרות / סרטים' },
                { value: 'music', label: '🎵 מוזיקה (לשמוע / לנגן / הופעות)' },
                { value: 'reading', label: '📚 קריאה / ספרים' },
                { value: 'tech', label: '💻 טכנולוגיה / גאדג׳טים / סטארטאפים / גיימינג' },
                { value: 'art', label: '🎨 אמנות / צילום / יצירה' },
                { value: 'meditation', label: '🧘 מדיטציה / יוגה / מיינדפולנס' },
                { value: 'bbq', label: '🔥 על האש עם חברים ומשפחה' },
                { value: 'travel', label: '✈️ טיולים בטבע בארץ ונסיעות וחו״ל' },
                { value: 'chill', label: '🌊 אין לי תחביב מוגדר — זורם עם החיים' },
                { value: 'politics', label: '🗞️ פוליטיקה, אקטואליה ולייעץ לטראמפ מה צריך לעשות…' },
              ]}
              selected={form.hobbies.split(',').filter(Boolean)}
              onToggle={v => {
                const arr = form.hobbies.split(',').filter(Boolean)
                const newArr = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
                set('hobbies', newArr.join(','))
              }}
            />
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-[#0A0A0A]">משהו אחר לגמרי? כתוב ✍️</label>
              <Input
                value={form.hobby_custom}
                onChange={e => set('hobby_custom', e.target.value)}
                placeholder="תחביב שלא ברשימה..."
                className="h-11 rounded-xl border-[#E5E5E5]"
              />
            </div>
          </div>
        )}

        {/* ── Step: Open Required ── */}
        {currentStep === 'open_required' && (
          <div>
            <StepHeader title="קצת עליך" subtitle="שאלות חובה — אל תפחד להיות אתה" />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#0A0A0A]">ספר על עצמך... *</label>
                <Textarea
                  value={form.open_bio}
                  onChange={e => set('open_bio', e.target.value)}
                  placeholder="מי אתה, מה אתה אוהב, מה מניע אותך..."
                  className="min-h-32 rounded-2xl border-[#E5E5E5] resize-none"
                  maxLength={600}
                />
                <p className="text-xs text-[#A3A3A3] text-end">{form.open_bio.length}/600</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#0A0A0A]">מה אתה מחפש בזוגיות? *</label>
                <Textarea
                  value={form.open_seeking}
                  onChange={e => set('open_seeking', e.target.value)}
                  placeholder="בן/בת זוג אידיאלי/ת בעיניי..."
                  className="min-h-28 rounded-2xl border-[#E5E5E5] resize-none"
                  maxLength={400}
                />
                <p className="text-xs text-[#A3A3A3] text-end">{form.open_seeking.length}/400</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Open Optional ── */}
        {currentStep === 'open_optional' && (
          <div>
            <StepHeader title="שאלות נוספות" subtitle="כולן אופציונליות — ענה על מה שמתחשק" optional />
            <div className="space-y-5">
              {[
                { key: 'open_dealbreaker' as const, label: 'מה הדיל ברייקר שלך?', ph: 'דבר שלא תהיה מוכן/ה לוותר עליו...' },
                { key: 'open_work' as const, label: 'מה אתה עושה בחיים חוץ מלגלול פה...', ph: 'עבודה / קריירה / עיסוק...' },
                { key: 'open_quote' as const, label: 'משפט לחיים...', ph: 'משפט שמנחה אותך...' },
                { key: 'open_loves' as const, label: 'הנה כמה דברים שאני אוהב...', ph: '3 דברים שאתה אוהב...' },
                { key: 'open_strength' as const, label: 'החוזקה הכי גדולה שלי בחיים היא...', ph: 'הכוח שלך...' },
                { key: 'open_future_self' as const, label: 'איך אני רואה את העתיד שלי...', ph: 'החלום / התוכנית...' },
                { key: 'open_future_us' as const, label: 'איך אני רואה את העתיד שלנו...', ph: 'איך נראית מערכת יחסים מושלמת בעינייך...' },
                { key: 'open_lie' as const, label: 'שקר שאני אוהב לספר...', ph: '😄' },
                { key: 'open_movie' as const, label: 'אם היו עושים עליך סרט — איך היו קוראים לו?', ph: 'שם הסרט...' },
                { key: 'open_crazy' as const, label: 'מה הדבר הכי לא הגיוני שעשית?', ph: 'כאן אפשר לפרוא...' },
                { key: 'open_first_impression' as const, label: 'מה הדבר הראשון שאנשים חושבים עליך?', ph: 'מה אומרים עליך...' },
                { key: 'open_song' as const, label: 'אם היית צריך לבחור שיר כנושא החיים שלך — מה הוא היה?', ph: 'שם השיר ומי שר...' },
                { key: 'open_weird_habit' as const, label: 'מה ההרגל הכי מוזר שלך?', ph: 'תתעז לשתף...' },
                { key: 'open_childish' as const, label: 'מה הדבר הכי ילדותי שאתה עדיין עושה היום?', ph: '😄' },
                { key: 'open_food' as const, label: 'מה האוכל שאתה יכול לאכול כל יום?', ph: 'אוכל שאתה ממש אוהב...' },
              ].map(({ key, label, ph }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A0A0A]">{label}</label>
                  <Textarea
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="min-h-20 rounded-2xl border-[#E5E5E5] resize-none text-sm"
                    maxLength={300}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#E5E5E5] p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {stepIndex > 0 && (
            <Button
              variant="outline"
              onClick={back}
              className="flex-none border-[#E5E5E5] rounded-2xl px-5 h-12"
            >
              <ArrowRight className="w-4 h-4 me-1" />
              חזור
            </Button>
          )}
          <Button
            onClick={next}
            disabled={!canProceed() || isSaving}
            className="flex-1 bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-12 font-bold disabled:opacity-40"
          >
            {isSaving ? 'שומר...' : stepIndex === TOTAL - 1 ? '🎉 סיום ולגלות!' : (
              <>
                המשך
                <ArrowLeft className="w-4 h-4 ms-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
