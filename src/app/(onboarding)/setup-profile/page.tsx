'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/components/shared/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowLeft, Camera, X, Check, ImageUp, Sparkles, Eye, ClipboardList, Smile, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { YearWheel } from '@/components/shared/YearWheel'
import { NumberWheel } from '@/components/shared/NumberWheel'
import { CityAutocomplete } from '@/components/shared/CityAutocomplete'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  first_name: string
  last_name: string
  phone_number: string
  birth_year: string
  gender: 'male' | 'female' | ''
  marital_status: 'single' | 'divorced' | 'widowed' | ''
  children_count: string
  height_cm: string
  relationship_goal: string[]
  children_future: string
  seeking_status: string[]
  seeking_with_kids: string
  age_pref_min: number
  age_pref_max: number
  distance_pref_km: number
  distance_unlimited: boolean
  religion: string[]
  city: string
  latitude: number | null
  longitude: number | null
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

// מיפוי בחירת הדתיות (כולל ערכים "עשירים") לערך תקין בעמודת enum של ה-DB
function mapReligiousLevel(value?: string): 'hiloni' | 'masorti' | 'dati_light' | 'dati' | 'haredi' {
  switch (value) {
    case 'hiloni':
    case 'hiloni_heart':
      return 'hiloni'
    case 'masorti':
    case 'masorti_lite':
      return 'masorti'
    case 'dati_light':
      return 'dati_light'
    case 'dati':
      return 'dati'
    case 'haredi':
      return 'haredi'
    default:
      return 'masorti'
  }
}

// המרת קלט מספרי מהטופס לערך שלם תקין בטווח ה-CHECK של ה-DB (מונע constraint violation)
function clampInt(value: string, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

// כמו clampInt, אך מחזיר null אם הערך ריק או מחוץ לטווח (לשדות אופציונליים כמו גובה)
function clampIntOrNull(value: string, min: number, max: number): number | null {
  if (value === '' || value == null) return null
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < min || n > max) return null
  return n
}

// ─── Helper Components ────────────────────────────────────────────────────────

// כפתורי בחירה מרובה — תמיד מסודרים אחד מתחת לשני (full width), בפונט קריא
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
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value)
        const atMax = max !== undefined && selected.length >= max && !isSelected
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !atMax && onToggle(opt.value)}
            className={cn(
              'w-full px-4 py-3.5 rounded-2xl text-base font-medium border-2 transition-all text-right flex items-center gap-2',
              isSelected
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : atMax
                ? 'opacity-40 cursor-not-allowed border-[#E5E5E5] text-[#A3A3A3]'
                : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A] active:scale-[0.99]'
            )}
          >
            <span className={cn(
              'flex-none w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
              isSelected ? 'bg-white border-white' : 'border-[#D4D4D4]'
            )}>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#0A0A0A]" />}
            </span>
            <span className="flex-1">{opt.label}</span>
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
            'w-full text-right px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.99]',
            selected === opt.value
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
              : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
          )}
        >
          <div className="font-medium text-base">{opt.label}</div>
          {opt.desc && (
            <div className={cn('text-sm mt-0.5', selected === opt.value ? 'text-white/60' : 'text-[#A3A3A3]')}>
              {opt.desc}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function StepHeader({ title, subtitle, optional, multi }: { title: string; subtitle?: string; optional?: boolean; multi?: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-[28px] leading-tight font-bold text-[#0A0A0A]">{title}</h2>
        {optional && (
          <span className="text-sm bg-[#EDE9FE] text-[#7C3AED] px-3 py-1 rounded-full font-semibold">
            שדה אופציונלי
          </span>
        )}
      </div>
      {subtitle && <p className="text-[#737373] text-base leading-relaxed">{subtitle}</p>}
      {multi && (
        <div className="mt-3 inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#92400E] text-sm font-semibold px-3 py-1.5 rounded-full">
          <Check className="w-4 h-4" />
          אפשר לבחור יותר מאחד 👇
        </div>
      )}
    </div>
  )
}

// סליידר טווח עם שתי ידיות עצמאיות — שינוי הגיל המקסימלי לא משפיע על המינימלי (ולהפך)
function DualRangeSlider({
  low,
  high,
  min,
  max,
  onLow,
  onHigh,
  suffix,
}: {
  low: number
  high: number
  min: number
  max: number
  onLow: (v: number) => void
  onHigh: (v: number) => void
  suffix?: string
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-[#0A0A0A]">{low}–{high}</span>
        {suffix && <span className="text-base text-[#A3A3A3] ms-1.5">{suffix}</span>}
      </div>
      <div className="dual-range relative h-10 select-none" dir="ltr">
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-2 bg-[#E5E5E5] rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#0A0A0A] rounded-full"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={e => onLow(Math.min(Number(e.target.value), high - 1))}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={e => onHigh(Math.max(Number(e.target.value), low + 1))}
        />
      </div>
      <div className="flex justify-between text-xs text-[#A3A3A3] mt-2" dir="ltr">
        <span>{min}</span>
        <span>{max}+</span>
      </div>
      <style>{`
        .dual-range input[type=range]{position:absolute;top:0;left:0;width:100%;height:100%;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none}
        .dual-range input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;pointer-events:auto;width:28px;height:28px;border-radius:9999px;background:#0A0A0A;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}
        .dual-range input[type=range]::-moz-range-thumb{pointer-events:auto;width:28px;height:28px;border-radius:9999px;background:#0A0A0A;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}
        .dual-range input[type=range]::-moz-range-track{background:transparent;border:none}
      `}</style>
    </div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  // ── שאלות חובה (קודם) ──
  'name', 'birth_year', 'gender', 'status', 'children_count',
  'relationship_goal', 'children_future', 'seeking_partner',
  'religion', 'location', 'residence_intent',
  'photos', 'languages',
  'open_required',
  // ── שאלות רשות (אחר כך) ──
  'height', 'seeking_range',
  'romantic_vision', 'friday_night', 'saturday_morning', 'hobbies',
  'open_optional',
] as const

type Step = typeof STEPS[number]

const TOTAL = STEPS.length

// ערך-דגל ל"ללא הגבלת מרחק" (עמודת ה-DB היא INTEGER NOT NULL, לכן לא ניתן לשמור null)
const DISTANCE_NO_LIMIT = 99999

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // מסך פתיחה (הסבר) לפני תחילת התהליך
  const [started, setStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  // אינדיקציית התקדמות בעת הסיום (העלאת תמונות + שמירת פרופיל)
  const [uploadState, setUploadState] = useState<{
    active: boolean
    current: number
    total: number
    label: string
  }>({ active: false, current: 0, total: 0, label: '' })

  const [form, setForm] = useState<FormData>({
    first_name: user?.profile?.first_name ?? '',
    last_name: user?.profile?.last_name ?? '',
    phone_number: user?.profile?.phone_number ?? '',
    birth_year: '',
    gender: '',
    marital_status: '',
    children_count: '',
    height_cm: '',
    relationship_goal: [],
    children_future: '',
    seeking_status: [],
    seeking_with_kids: '',
    age_pref_min: 22,
    age_pref_max: 45,
    distance_pref_km: 50,
    distance_unlimited: false,
    religion: [],
    city: '',
    latitude: null,
    longitude: null,
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

  // טעינה אמינה של הפרטים שכבר מולאו בהרשמה (שם + טלפון) ברגע שהפרופיל נטען —
  // useState רץ פעם אחת, ואם הפרופיל עוד לא היה זמין במאונט השדות היו נשארים ריקים.
  // ממלאים פעם אחת בלבד ורק אם המשתמש עדיין לא הקליד דבר, כדי לא לדרוס עריכות.
  const hydratedRef = useRef(false)
  useEffect(() => {
    const p = user?.profile
    if (!p || hydratedRef.current) return
    hydratedRef.current = true
    setForm(prev => ({
      ...prev,
      first_name: prev.first_name || p.first_name || '',
      last_name: prev.last_name || p.last_name || '',
      phone_number: prev.phone_number || p.phone_number || '',
    }))
  }, [user?.profile])

  // ─── ניסוח לפי מגדר ──────────────────────────────────────────────────────────
  const isFemale = form.gender === 'female'
  // טקסט לפי המגדר של המשתמש/ת (ברירת מחדל: לשון זכר עד הבחירה)
  const gSelf = (male: string, female: string) => (isFemale ? female : male)
  // טקסט המתאר את בן/בת הזוג (המגדר ההפוך): גבר מחפש אישה, אישה מחפשת גבר
  const gPartner = (femalePartner: string, malePartner: string) =>
    (isFemale ? malePartner : femalePartner)

  const toggleMulti = (field: keyof FormData, value: string) => {
    const arr = form[field] as string[]
    set(field as keyof FormData, (arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]) as FormData[typeof field])
  }

  const currentStep: Step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / TOTAL) * 100

  // Validation per step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'name': return form.first_name.trim().length >= 2 && form.last_name.trim().length >= 2 && form.phone_number.replace(/[^0-9]/g, '').length >= 9
      case 'birth_year': return !!form.birth_year && Number(form.birth_year) >= 1944 && Number(form.birth_year) <= 2006
      case 'gender': return !!form.gender
      case 'status': return !!form.marital_status
      case 'children_count': return form.children_count !== '' && Number(form.children_count) >= 0
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
    setUploadState({
      active: true,
      current: 0,
      total: form.photos.length,
      label: form.photos.length > 0 ? 'מתחילים בהעלאת התמונות...' : 'שומרים את הפרופיל...',
    })
    try {
      // ─── העלאת תמונות ל-Supabase Storage ─────────────────────────────────
      if (user?.id && form.photos.length > 0) {
        const supabase = createClient()
        const toInsert: {
          user_id: string; url: string; is_primary: boolean;
          order_index: number; media_type: string;
        }[] = []

        for (let i = 0; i < form.photos.length; i++) {
          const file = form.photos[i]
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
          const path = `${user.id}/${Date.now()}-${i}.${ext}`
          const mediaType = file.type.startsWith('video') ? 'video'
            : file.type.startsWith('audio') ? 'audio' : 'image'

          setUploadState({
            active: true,
            current: i,
            total: form.photos.length,
            label: `מעלה ${mediaType === 'video' ? 'סרטון' : mediaType === 'audio' ? 'הקלטה' : 'תמונה'} ${i + 1} מתוך ${form.photos.length}...`,
          })

          const { data: uploaded, error: uploadErr } = await supabase.storage
            .from('profile-photos')
            .upload(path, file, { upsert: true })

          if (uploadErr) {
            console.error('upload error:', uploadErr)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(uploaded.path)

          toInsert.push({
            user_id: user.id,
            url: publicUrl,
            is_primary: i === 0,
            order_index: i,
            media_type: mediaType,
          })
        }

        if (toInsert.length > 0) {
          // מחק תמונות ישנות והכנס חדשות
          await supabase.from('photos').delete().eq('user_id', user.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insertErr } = await (supabase.from('photos') as any).insert(toInsert)
          if (insertErr) console.error('photos insert error:', insertErr)
        }
      }

      // ─── עדכון פרופיל ────────────────────────────────────────────────────
      setUploadState({
        active: true,
        current: form.photos.length,
        total: form.photos.length,
        label: 'כמעט שם — שומרים את הפרופיל שלך... 💛',
      })
      const hobbiesArr = [
        ...form.hobbies.split(',').map(h => h.trim()).filter(Boolean),
        ...(form.hobby_custom ? [form.hobby_custom.trim()] : []),
      ]
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        display_name: `${form.first_name} ${form.last_name}`.trim(),
        birth_year: Number(form.birth_year) || null,
        gender: form.gender as 'male' | 'female',
        seeking: form.gender === 'male' ? 'female' : 'male',
        marital_status: form.marital_status as 'single' | 'divorced' | 'widowed',
        children_count: clampInt(form.children_count, 0, 20, 0),
        height_cm: clampIntOrNull(form.height_cm, 101, 249),
        relationship_goal: form.relationship_goal,
        children_future: form.children_future as import('@/lib/types/database').ChildrenFuture,
        seeking_status: form.seeking_status,
        seeking_with_kids: form.seeking_with_kids as 'yes' | 'no' | 'dont_mind' | '',
        age_pref_min: form.age_pref_min,
        age_pref_max: form.age_pref_max,
        distance_pref_km: form.distance_unlimited ? DISTANCE_NO_LIMIT : form.distance_pref_km,
        religious_level: mapReligiousLevel(form.religion[0]),
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
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
      // Full reload so AuthProvider re-fetches profile_complete from DB
      window.location.href = '/home'
    } catch (err) {
      console.error('finish error:', err)
      toast.error('שגיאה בשמירת הפרופיל. נסה שנית.')
      setUploadState(s => ({ ...s, active: false }))
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

  // אחוז ההתקדמות בהעלאה (אם אין תמונות — מצב אינדטרמיננטי)
  const uploadPct = uploadState.total > 0
    ? Math.round((uploadState.current / uploadState.total) * 100)
    : null

  // ─── מסך פתיחה / הסבר ───────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col px-6 pt-10 pb-8 max-w-lg mx-auto">
        <div className="flex-1 flex flex-col justify-center">
          <div className="w-16 h-16 rounded-3xl bg-[#0A0A0A] flex items-center justify-center mb-6">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>

          <h1 className="text-[32px] leading-tight font-bold text-[#0A0A0A] mb-3">
            יאללה, בונים לך פרופיל ✨
          </h1>
          <p className="text-lg text-[#404040] leading-relaxed mb-2">
            בדפים הבאים תיצרו את הפרופיל שלכם כפי שאחרים יראו אותו באפליקציה, וגם תמלאו שאלון התאמה קצר שיעזור לכם למצוא התאמות טובות יותר.
          </p>
          <p className="text-lg text-[#404040] leading-relaxed mb-2">
            אין צורך להילחץ — לא כל השאלות הן חובה, אפשר לענות רק על מה שמתחשק ובקצב שנוח לכם.
          </p>
          <p className="text-lg text-[#0A0A0A] font-semibold leading-relaxed mb-7">
            והכי חשוב: תזרמו — לא חקירה של השב״כ 😎
          </p>

          <div className="space-y-3">
            {[
              { icon: Eye, title: 'איך אחרים יראו אותך', desc: 'התמונות והפרטים שיופיעו בכרטיס שלך' },
              { icon: ClipboardList, title: 'שאלון התאמה קצר', desc: 'כמה שאלות שיעזרו למצוא לך התאמות מדויקות' },
              { icon: Smile, title: 'בקצב שלך, בלי לחץ', desc: 'אפשר לדלג על שאלות רשות ולהשלים מתי שבא לך' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border-2 border-[#F0F0F0] p-4">
                <div className="flex-none w-11 h-11 rounded-2xl bg-[#F5F5F5] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0A0A0A]" />
                </div>
                <div>
                  <p className="font-bold text-[#0A0A0A] text-base">{title}</p>
                  <p className="text-sm text-[#737373] leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setStarted(true)}
          className="w-full bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-14 text-lg font-bold mt-8"
        >
          בואו ניצור פרופיל
          <ArrowLeft className="w-5 h-5 ms-1.5" />
        </Button>
        <p className="text-center text-sm text-[#A3A3A3] mt-3">לוקח בערך 3–5 דקות 💛</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Overlay התקדמות סיום ── */}
      {uploadState.active && (
        <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center px-8">
          {/* אנימציה: טבעות מתרחבות + אייקון */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-8">
            <span className="absolute inset-0 rounded-full bg-[#0A0A0A]/10 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-[#0A0A0A]/10 animate-ping [animation-delay:300ms]" />
            <span className="absolute inset-0 rounded-full border-[3px] border-[#E5E5E5] border-t-[#0A0A0A] animate-spin" />
            <div className="relative w-16 h-16 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              {uploadPct === 100
                ? <Sparkles className="w-7 h-7 text-[#FFD24A]" />
                : <ImageUp className="w-7 h-7 text-white" />
              }
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#0A0A0A] mb-1.5 text-center">בונים את הפרופיל שלך</h2>
          <p className="text-[#737373] text-sm text-center mb-6 min-h-[20px]">{uploadState.label}</p>

          {/* פס התקדמות */}
          <div className="w-full max-w-xs">
            <div className="w-full bg-[#F5F5F5] rounded-full h-2.5 overflow-hidden">
              {uploadPct === null ? (
                <div className="h-full w-1/3 bg-[#0A0A0A] rounded-full animate-[indeterminate_1.2s_ease-in-out_infinite]" />
              ) : (
                <div
                  className="h-full bg-[#0A0A0A] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(uploadPct, 6)}%` }}
                />
              )}
            </div>
            {uploadState.total > 0 && (
              <p className="text-xs text-[#A3A3A3] text-center mt-3">
                {Math.min(uploadState.current + (uploadPct === 100 ? 0 : 1), uploadState.total)} מתוך {uploadState.total} קבצים
              </p>
            )}
          </div>

          <p className="text-[11px] text-[#A3A3A3] text-center mt-8 max-w-[240px] leading-relaxed">
            אנא אל תסגור/י את החלון — ההעלאה עשויה לקחת מספר שניות בהתאם לחיבור שלך 🙏
          </p>

          <style>{`
            @keyframes indeterminate {
              0% { margin-inline-start: -35%; }
              100% { margin-inline-start: 100%; }
            }
          `}</style>
        </div>
      )}

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
        {isOptionalStep && stepIndex < TOTAL - 1 ? (
          <button onClick={next} className="text-sm text-[#7C3AED] font-semibold hover:underline px-1">
            דלג
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Content */}
      <div className="pt-20 pb-32 px-4 max-w-lg mx-auto">
        {/* ── Step: Name ── */}
        {currentStep === 'name' && (
          <div>
            <StepHeader title="נעים להכיר 👋" subtitle="אלו הפרטים שמילאת בהרשמה — אפשר לעדכן אותם כאן 👇" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-base font-medium text-[#0A0A0A]">שם פרטי</label>
                <Input
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="ישראל"
                  className="h-14 rounded-2xl border-[#E5E5E5] text-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-medium text-[#0A0A0A]">שם משפחה</label>
                <Input
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="ישראלי"
                  className="h-14 rounded-2xl border-[#E5E5E5] text-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-medium text-[#0A0A0A]">מספר טלפון</label>
                <Input
                  type="tel"
                  value={form.phone_number}
                  onChange={e => set('phone_number', e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                  className="h-14 rounded-2xl border-[#E5E5E5] text-lg text-right"
                />
                <p className="text-xs text-[#A3A3A3]">מספר הטלפון עוזר לנו למנוע פרופילים פיקטיביים</p>
              </div>
              {user?.email && (
                <div className="space-y-1.5">
                  <label className="text-base font-medium text-[#A3A3A3]">אימייל</label>
                  <div className="h-14 rounded-2xl border-2 border-[#F0F0F0] bg-[#FAFAFA] px-4 flex items-center text-[#A3A3A3] text-lg" dir="ltr">
                    {user.email}
                  </div>
                  <p className="text-xs text-[#A3A3A3]">האימייל מההרשמה — לא ניתן לשינוי כאן</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Birth Year ── */}
        {currentStep === 'birth_year' && (
          <div>
            <StepHeader title="שנת לידה" subtitle="באיזו שנה נולדת?" />
            <YearWheel
              value={form.birth_year}
              min={1944}
              max={2006}
              onChange={v => set('birth_year', v)}
            />
            <p className="text-xs text-[#A3A3A3] mt-4 text-center">גלגל/י לשנה הנכונה — הגיל נגזר מהשנה בלבד</p>
          </div>
        )}

        {/* ── Step: Gender ── */}
        {currentStep === 'gender' && (
          <div>
            <StepHeader title="ספר/י לנו עליך" subtitle="מה המגדר שלך?" />
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { value: 'male', emoji: '👨', label: 'גבר' },
                { value: 'female', emoji: '👩', label: 'אישה' },
              ].map(opt => {
                const isSel = form.gender === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('gender', opt.value as 'male' | 'female')}
                    className={cn(
                      'h-[clamp(190px,38vh,280px)] rounded-[28px] border-2 flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.98]',
                      isSel
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-lg'
                        : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
                    )}
                  >
                    <span
                      className={cn(
                        'w-24 h-24 rounded-full flex items-center justify-center text-6xl transition-colors',
                        isSel ? 'bg-white/15' : 'bg-[#F5F5F5]'
                      )}
                    >
                      {opt.emoji}
                    </span>
                    <span className="text-2xl font-bold">{opt.label}</span>
                    {isSel && <Check className="w-6 h-6" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step: Marital Status ── */}
        {currentStep === 'status' && (
          <div>
            <StepHeader title="מה הסטטוס שלך?" />
            <SingleSelectButtons
              options={[
                { value: 'single', label: gSelf('רווק', 'רווקה') },
                { value: 'divorced', label: gSelf('גרוש', 'גרושה') },
                { value: 'widowed', label: gSelf('אלמן', 'אלמנה') },
              ]}
              selected={form.marital_status}
              onSelect={v => set('marital_status', v as FormData['marital_status'])}
            />
          </div>
        )}

        {/* ── Step: Children Count ── */}
        {currentStep === 'children_count' && (
          <div>
            <StepHeader title="כמה ילדים יש לך?" subtitle={gSelf('גם לרווק יכולים להיות ילדים — והכל בסדר גמור 💛', 'גם לרווקה יכולים להיות ילדים — והכל בסדר גמור 💛')} />
            <NumberWheel
              value={form.children_count}
              min={0}
              max={15}
              autoSelect
              defaultView={0}
              onChange={v => set('children_count', v)}
              formatLabel={n => (n === 0 ? 'אין ילדים' : String(n))}
            />
            <p className="text-xs text-[#A3A3A3] mt-4 text-center">גלגל/י עד למספר הנכון 👆</p>
          </div>
        )}

        {/* ── Step: Height (optional) ── */}
        {currentStep === 'height' && (
          <div>
            <StepHeader title="מה הגובה שלך?" optional subtitle="גלגל/י עד לגובה שלך, או דלג/י" />
            <NumberWheel
              value={form.height_cm}
              min={140}
              max={220}
              defaultView={172}
              onChange={v => set('height_cm', v)}
              formatLabel={n => `${n} ס״מ`}
            />
          </div>
        )}

        {/* ── Step: Relationship Goal ── */}
        {currentStep === 'relationship_goal' && (
          <div>
            <StepHeader title={gSelf('מה אני מחפש?', 'מה אני מחפשת?')} subtitle="מה הכי מדבר אליך כרגע?" multi />
            <MultiSelectButtons
              options={[
                { value: 'marriage', label: '💍 חתונה וחמין בשבת' },
                { value: 'serious_easy', label: '☕ קשר רציני בקצב רגוע וקליל' },
                { value: 'chapter2', label: '🌱 פרק ב׳' },
                { value: 'chemistry', label: '✨ כימיה טובה ומשם נראה' },
                { value: 'dating', label: '😊 היכרות קלילה / דייטינג בכיף' },
                { value: 'just_looking', label: gSelf('👀 רק בודק מה יש פה באפליקציה 😅', '👀 רק בודקת מה יש פה באפליקציה 😅') },
              ]}
              selected={form.relationship_goal}
              onToggle={v => toggleMulti('relationship_goal', v)}
            />
          </div>
        )}

        {/* ── Step: Children Future ── */}
        {currentStep === 'children_future' && (
          <div>
            <StepHeader title="ילדים בעתיד" subtitle={gSelf('איפה אתה עומד בנושא?', 'איפה את עומדת בנושא?')} />
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
            <StepHeader title={gPartner('האחת שלי', 'האחד שלי')} subtitle="מה הסטטוס המועדף עליך?" multi />
            <MultiSelectButtons
              options={[
                { value: 'single', label: gPartner('רווקה', 'רווק') },
                { value: 'divorced', label: gPartner('גרושה', 'גרוש') },
                { value: 'widowed', label: gPartner('אלמנה', 'אלמן') },
              ]}
              selected={form.seeking_status}
              onToggle={v => toggleMulti('seeking_status', v)}
            />
            <div className="mt-6">
              <p className="text-sm font-medium text-[#0A0A0A] mb-3">ילדים מקשר קודם?</p>
              <SingleSelectButtons
                options={[
                  { value: 'yes', label: '✅ עם ילדים — בסדר גמור' },
                  { value: 'no', label: gSelf('🚫 מעדיף ללא ילדים', '🚫 מעדיפה ללא ילדים') },
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
            <StepHeader title="טווח העדפות" optional subtitle="באיזה טווח גילאים ומרחק לחפש לך התאמות?" />
            <div className="space-y-10">
              <div>
                <label className="text-base font-medium text-[#0A0A0A] mb-3 block">טווח גילאים</label>
                <DualRangeSlider
                  low={form.age_pref_min}
                  high={form.age_pref_max}
                  min={18}
                  max={80}
                  onLow={v => set('age_pref_min', v)}
                  onHigh={v => set('age_pref_max', v)}
                  suffix="שנים"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-base font-medium text-[#0A0A0A]">מרחק מקסימלי ממני</label>
                  <span className="text-base font-bold text-[#0A0A0A]">
                    {form.distance_unlimited ? '🌍 ללא הגבלה' : `${form.distance_pref_km} ק״מ`}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  value={form.distance_pref_km}
                  disabled={form.distance_unlimited}
                  onChange={e => set('distance_pref_km', Number(e.target.value))}
                  className={cn(
                    'w-full h-2 appearance-none bg-[#E5E5E5] rounded-full accent-[#0A0A0A]',
                    form.distance_unlimited ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  )}
                />
                <div className="flex justify-between text-xs text-[#A3A3A3] mt-2">
                  <span>5 ק״מ</span>
                  <span>500 ק״מ</span>
                </div>
                <button
                  type="button"
                  onClick={() => set('distance_unlimited', !form.distance_unlimited)}
                  className={cn(
                    'w-full mt-4 px-4 py-3.5 rounded-2xl border-2 text-base font-medium transition-all flex items-center justify-center gap-2',
                    form.distance_unlimited
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  )}
                >
                  {form.distance_unlimited && <Check className="w-4 h-4" />}
                  🌍 חפש בכל העולם — בלי הגבלת מרחק
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Religion ── */}
        {currentStep === 'religion' && (
          <div>
            <StepHeader title="דת ורמת דתיות" subtitle={gSelf('איך תגדיר את עצמך?', 'איך תגדירי את עצמך?')} />
            <MultiSelectButtons
              options={[
                { value: 'hiloni', label: gSelf('☀️ חילוני', '☀️ חילונית') },
                { value: 'hiloni_heart', label: gSelf('💙 יהודי בלב, חילוני בלו״ז. בית כנסת — רק בבר מצווה', '💙 יהודייה בלב, חילונית בלו״ז. בית כנסת — רק בבר מצווה') },
                { value: 'masorti', label: gSelf('🕎 מסורתי', '🕎 מסורתית') },
                { value: 'masorti_lite', label: gSelf('🍷 עושה קידוש בשישי ואז מדליק את הטלוויזיה', '🍷 עושה קידוש בשישי ואז מדליקה את הטלוויזיה') },
                { value: 'dati_light', label: gSelf('📖 דתי לייט — שומר שבת וכשרות, אבל זורם עם העולם', '📖 דתייה לייט — שומרת שבת וכשרות, אבל זורמת עם העולם') },
                { value: 'dati', label: gSelf('✡️ דתי על מלא — בית דתי למהדרין, תפילות, חגים — כל החבילה', '✡️ דתייה על מלא — בית דתי למהדרין, תפילות, חגים — כל החבילה') },
              ]}
              selected={form.religion}
              onToggle={v => toggleMulti('religion', v)}
            />
          </div>
        )}

        {/* ── Step: Location ── */}
        {currentStep === 'location' && (
          <div>
            <StepHeader title={gSelf('איפה אתה גר?', 'איפה את גרה?')} subtitle="התחל/י להקליד והמערכת תשלים את שם העיר" />
            <CityAutocomplete
              value={form.city}
              placeholder="תל אביב, ניו יורק, לוס אנג׳לס..."
              onSelect={sel => {
                set('city', sel.city)
                if (sel.latitude !== null) set('latitude', sel.latitude)
                if (sel.longitude !== null) set('longitude', sel.longitude)
              }}
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
                { value: 'abroad_return_later', label: gSelf('⏳ כרגע בחו״ל, כנראה חוזר בעוד כמה שנים', '⏳ כרגע בחו״ל, כנראה חוזרת בעוד כמה שנים') },
                { value: 'abroad_stay', label: gSelf('🌍 בחו״ל וטפו טפו, בינתיים נשאר', '🌍 בחו״ל וטפו טפו, בינתיים נשארת') },
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
            <StepHeader title={gSelf('באילו שפות אתה מדבר?', 'באילו שפות את מדברת?')} subtitle="אפשר לבחור כמה" />
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
                { value: 'buh', label: '🇺🇿 בוכרית' },
                { value: 'ka', label: '🇬🇪 גרוזינית' },
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
                { value: 'sleep_late', label: gSelf('😴 נוחר עד 12:00 ואז ישיר לחמין של שבת', '😴 נוחרת עד 12:00 ואז ישר לחמין של שבת') },
              ]}
              selected={form.saturday_morning}
              onToggle={v => toggleMulti('saturday_morning', v)}
            />
          </div>
        )}

        {/* ── Step: Hobbies (optional) ── */}
        {currentStep === 'hobbies' && (
          <div>
            <StepHeader title="מה התחביבים שלך?" optional subtitle={gSelf('בחר מהרשימה ו/או כתוב בעצמך', 'בחרי מהרשימה ו/או כתבי בעצמך')} />
            <MultiSelectButtons
              options={[
                { value: 'cooking', label: gSelf('👨‍🍳 בשלן תותח — עונה הבאה אני במאסטר שף', '👩‍🍳 בשלנית תותחית — עונה הבאה אני במאסטר שף') },
                { value: 'travel', label: '✈️ טיולים בטבע בארץ ונסיעות וחו״ל' },
                { value: 'soccer', label: '⚽ כדורגל ישראלי/אירופאי' },
                { value: 'sport', label: '🏃 ספורט / כושר / ריצה' },
                { value: 'torah', label: '📜 שיעורי תורה' },
                { value: 'nightlife', label: '🍽️ מסעדות, ברים ויציאות בעיר' },
                { value: 'series', label: '📺 צפייה בסדרות / סרטים' },
                { value: 'music', label: '🎵 מוזיקה (לשמוע / לנגן / הופעות)' },
                { value: 'reading', label: '📚 קריאה / ספרים' },
                { value: 'tech', label: '💻 טכנולוגיה / גאדג׳טים / סטארטאפים / גיימינג' },
                { value: 'art', label: '🎨 אמנות / צילום / יצירה' },
                { value: 'meditation', label: '🧘 מדיטציה / יוגה / מיינדפולנס' },
                { value: 'bbq', label: '🔥 על האש עם חברים ומשפחה' },
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
              <label className="text-base font-medium text-[#0A0A0A]">{gSelf('משהו אחר לגמרי? כתוב ✍️', 'משהו אחר לגמרי? כתבי ✍️')}</label>
              <Input
                value={form.hobby_custom}
                onChange={e => set('hobby_custom', e.target.value)}
                placeholder="תחביב שלא ברשימה..."
                className="h-12 rounded-xl border-[#E5E5E5] text-base"
              />
            </div>
          </div>
        )}

        {/* ── Step: Open Required ── */}
        {currentStep === 'open_required' && (
          <div>
            <StepHeader title="קצת עליך" subtitle={gSelf('שאלות חובה — אל תפחד להיות אתה', 'שאלות חובה — אל תפחדי להיות את')} />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-base font-bold text-[#0A0A0A]">{gSelf('ספר על עצמך... *', 'ספרי על עצמך... *')}</label>
                <Textarea
                  value={form.open_bio}
                  onChange={e => set('open_bio', e.target.value)}
                  placeholder={gSelf('מי אתה, מה אתה אוהב, מה מניע אותך...', 'מי את, מה את אוהבת, מה מניע אותך...')}
                  className="min-h-32 rounded-2xl border-[#E5E5E5] resize-none text-base"
                  maxLength={600}
                />
                <p className="text-xs text-[#A3A3A3] text-end">{form.open_bio.length}/600</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-bold text-[#0A0A0A]">{gSelf('מה אתה מחפש בזוגיות? *', 'מה את מחפשת בזוגיות? *')}</label>
                <Textarea
                  value={form.open_seeking}
                  onChange={e => set('open_seeking', e.target.value)}
                  placeholder={gPartner('בת זוג אידיאלית בעיניי...', 'בן זוג אידיאלי בעיניי...')}
                  className="min-h-28 rounded-2xl border-[#E5E5E5] resize-none text-base"
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
            <StepHeader title="שאלות נוספות" subtitle={gSelf('כולן אופציונליות — ענה על מה שמתחשק', 'כולן אופציונליות — עני על מה שמתחשק')} optional />
            <div className="space-y-5">
              {[
                { key: 'open_dealbreaker' as const, label: 'מה הדיל ברייקר שלך?', ph: gSelf('דבר שלא תהיה מוכן לוותר עליו...', 'דבר שלא תהיי מוכנה לוותר עליו...') },
                { key: 'open_work' as const, label: gSelf('מה אתה עושה בחיים חוץ מלגלול פה...', 'מה את עושה בחיים חוץ מלגלול פה...'), ph: 'עבודה / קריירה / עיסוק...' },
                { key: 'open_quote' as const, label: 'משפט לחיים...', ph: 'משפט שמנחה אותך...' },
                { key: 'open_loves' as const, label: gSelf('הנה כמה דברים שאני אוהב...', 'הנה כמה דברים שאני אוהבת...'), ph: gSelf('3 דברים שאתה אוהב...', '3 דברים שאת אוהבת...') },
                { key: 'open_strength' as const, label: 'החוזקה הכי גדולה שלי בחיים היא...', ph: 'הכוח שלך...' },
                { key: 'open_future_self' as const, label: 'איך אני רואה את העתיד שלי...', ph: 'החלום / התוכנית...' },
                { key: 'open_future_us' as const, label: 'איך אני רואה את העתיד שלנו...', ph: 'איך נראית מערכת יחסים מושלמת בעינייך...' },
                { key: 'open_lie' as const, label: 'שקר שאני אוהב לספר...', ph: '😄' },
                { key: 'open_movie' as const, label: 'אם היו עושים עליך סרט — איך היו קוראים לו?', ph: 'שם הסרט...' },
                { key: 'open_crazy' as const, label: gSelf('מה הדבר הכי לא הגיוני שעשית?', 'מה הדבר הכי לא הגיוני שעשית?'), ph: 'כאן אפשר להשתולל...' },
                { key: 'open_first_impression' as const, label: 'מה הדבר הראשון שאנשים חושבים עליך?', ph: 'מה אומרים עליך...' },
                { key: 'open_song' as const, label: gSelf('אם היית צריך לבחור שיר כנושא החיים שלך — מה הוא היה?', 'אם היית צריכה לבחור שיר כנושא החיים שלך — מה הוא היה?'), ph: 'שם השיר ומי שר...' },
                { key: 'open_weird_habit' as const, label: 'מה ההרגל הכי מוזר שלך?', ph: gSelf('תתעז לשתף...', 'תתעזי לשתף...') },
                { key: 'open_childish' as const, label: gSelf('מה הדבר הכי ילדותי שאתה עדיין עושה היום?', 'מה הדבר הכי ילדותי שאת עדיין עושה היום?'), ph: '😄' },
                { key: 'open_food' as const, label: gSelf('מה האוכל שאתה יכול לאכול כל יום?', 'מה האוכל שאת יכולה לאכול כל יום?'), ph: gSelf('אוכל שאתה ממש אוהב...', 'אוכל שאת ממש אוהבת...') },
              ].map(({ key, label, ph }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-base font-medium text-[#0A0A0A]">{label}</label>
                  <Textarea
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="min-h-20 rounded-2xl border-[#E5E5E5] resize-none text-base"
                    maxLength={300}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#E5E5E5] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                onClick={back}
                className="flex-none border-[#E5E5E5] rounded-2xl px-5 h-14 text-base"
              >
                <ArrowRight className="w-4 h-4 me-1" />
                חזור
              </Button>
            )}
            <Button
              onClick={next}
              disabled={!canProceed() || isSaving}
              className="flex-1 bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-14 text-base font-bold disabled:opacity-40"
            >
              {isSaving ? (form.photos.length > 0 ? 'מעלה תמונות...' : 'שומר...') : stepIndex === TOTAL - 1 ? '🎉 סיום ההרשמה' : (
                <>
                  המשך
                  <ArrowLeft className="w-4 h-4 ms-1" />
                </>
              )}
            </Button>
          </div>
          {isOptionalStep && stepIndex < TOTAL - 1 && (
            <button
              onClick={next}
              className="w-full mt-2.5 text-center text-sm text-[#7C3AED] font-semibold py-1.5 hover:underline"
            >
              אפשר לדלג על השלב הזה ←
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
