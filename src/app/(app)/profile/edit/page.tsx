'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAuth } from '@/components/shared/AuthProvider'
import { fetchProfile } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Camera, X, Check, Save } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DbPhoto } from '@/lib/types/database'

// ─── Helper Components ──────────────────────────────────────────────────────

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-[#0A0A0A] text-base mb-3">{children}</h3>
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-sm font-medium text-[#0A0A0A]">{children}</label>
      {optional && (
        <span className="text-xs bg-[#EDE9FE] text-[#7C3AED] px-2 py-0.5 rounded-full">אופציונלי</span>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface EditForm {
  first_name: string
  last_name: string
  birth_year: string
  gender: string
  marital_status: string
  height_cm: string
  city: string
  relationship_goal: string[]
  children_future: string
  seeking_status: string[]
  seeking_with_kids: string
  age_pref_min: number
  age_pref_max: number
  distance_pref_km: number
  religion: string[]
  residence_intent: string[]
  languages: string[]
  romantic_vision: string[]
  friday_night: string[]
  saturday_morning: string[]
  hobbies: string[]
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

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditForm>({
    first_name: '', last_name: '', birth_year: '', gender: '', marital_status: '',
    height_cm: '', city: '',
    relationship_goal: [], children_future: '', seeking_status: [],
    seeking_with_kids: '', age_pref_min: 22, age_pref_max: 45, distance_pref_km: 50,
    religion: [], residence_intent: [], languages: [],
    romantic_vision: [], friday_night: [], saturday_morning: [], hobbies: [], hobby_custom: '',
    open_bio: '', open_seeking: '', open_dealbreaker: '', open_work: '', open_quote: '',
    open_loves: '', open_strength: '', open_future_self: '', open_future_us: '',
    open_lie: '', open_movie: '', open_crazy: '', open_first_impression: '',
    open_song: '', open_weird_habit: '', open_childish: '', open_food: '',
  })

  const [existingPhotos, setExistingPhotos] = useState<DbPhoto[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    fetchProfile(user.id).then(data => {
      if (!data) return
      const p = data.profile
      const oq = p.open_questions ?? {}
      setForm({
        first_name: p.first_name ?? '',
        last_name: p.last_name ?? '',
        birth_year: p.birth_year ? String(p.birth_year) : '',
        gender: p.gender ?? '',
        marital_status: p.marital_status ?? '',
        height_cm: p.height_cm ? String(p.height_cm) : '',
        city: p.city ?? '',
        relationship_goal: p.relationship_goal ?? [],
        children_future: p.children_future ?? '',
        seeking_status: p.seeking_status ?? [],
        seeking_with_kids: p.seeking_with_kids ?? '',
        age_pref_min: p.age_pref_min ?? 22,
        age_pref_max: p.age_pref_max ?? 45,
        distance_pref_km: p.distance_pref_km ?? 50,
        religion: p.religious_level ? [p.religious_level] : [],
        residence_intent: p.residence_intent ?? [],
        languages: p.languages ?? [],
        romantic_vision: p.romantic_vision ?? [],
        friday_night: p.friday_night ?? [],
        saturday_morning: p.saturday_morning ?? [],
        hobbies: p.hobbies ?? [],
        hobby_custom: '',
        open_bio: oq.bio ?? p.bio ?? '',
        open_seeking: oq.seeking ?? '',
        open_dealbreaker: oq.dealbreaker ?? '',
        open_work: oq.work ?? '',
        open_quote: oq.quote ?? '',
        open_loves: oq.loves ?? '',
        open_strength: oq.strength ?? '',
        open_future_self: oq.future_self ?? '',
        open_future_us: oq.future_us ?? '',
        open_lie: oq.lie ?? '',
        open_movie: oq.movie ?? '',
        open_crazy: oq.crazy ?? '',
        open_first_impression: oq.first_impression ?? '',
        open_song: oq.song ?? '',
        open_weird_habit: oq.weird_habit ?? '',
        open_childish: oq.childish ?? '',
        open_food: oq.food ?? '',
      })
      setExistingPhotos(data.photos)
      setIsLoading(false)
    })
  }, [user?.id])

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const toggleMulti = (field: keyof EditForm, value: string) => {
    const arr = form[field] as string[]
    set(field, (arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]) as EditForm[typeof field])
  }

  const handleNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const total = existingPhotos.length - photosToDelete.length + newPhotos.length
    setNewPhotos(prev => [...prev, ...files].slice(0, Math.max(0, 10 - total)))
    e.target.value = ''
  }

  const markDeleteExisting = (id: string) => {
    setPhotosToDelete(prev => [...prev, id])
  }

  const removeNewPhoto = (i: number) => {
    setNewPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  const saveSection = async (section: 'personal' | 'seeking' | 'lifestyle' | 'about' | 'photos') => {
    if (!user?.id) return
    setSaving(true)
    try {
      if (section === 'photos') {
        const supabase = createClient()
        if (photosToDelete.length > 0) {
          await supabase.from('photos').delete().in('id', photosToDelete)
        }
        if (newPhotos.length > 0) {
          const visibleExisting = existingPhotos.filter(p => !photosToDelete.includes(p.id))
          const startIndex = visibleExisting.length
          const toInsert: { user_id: string; url: string; is_primary: boolean; order_index: number; media_type: string }[] = []

          for (let i = 0; i < newPhotos.length; i++) {
            const file = newPhotos[i]
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            const path = `${user.id}/${Date.now()}-${startIndex + i}.${ext}`
            const mediaType = file.type.startsWith('video') ? 'video'
              : file.type.startsWith('audio') ? 'audio' : 'image'
            const { data: uploaded, error: uploadErr } = await supabase.storage
              .from('profile-photos')
              .upload(path, file, { upsert: true })
            if (uploadErr) { console.error(uploadErr); continue }
            const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(uploaded.path)
            toInsert.push({ user_id: user.id, url: publicUrl, is_primary: startIndex + i === 0, order_index: startIndex + i, media_type: mediaType })
          }

          if (toInsert.length > 0) {
            await supabase.from('photos').insert(toInsert)
          }
        }

        const refreshed = await fetchProfile(user.id)
        if (refreshed) setExistingPhotos(refreshed.photos)
        setNewPhotos([])
        setPhotosToDelete([])
        toast.success('תמונות עודכנו')
        return
      }

      const hobbiesAll = [
        ...form.hobbies,
        ...(form.hobby_custom.trim() ? [form.hobby_custom.trim()] : []),
      ]

      const updates: Record<string, unknown> = {}

      if (section === 'personal') {
        Object.assign(updates, {
          first_name: form.first_name,
          last_name: form.last_name,
          display_name: `${form.first_name} ${form.last_name}`.trim(),
          birth_year: form.birth_year ? Number(form.birth_year) : null,
          gender: form.gender || null,
          seeking: form.gender === 'male' ? 'female' : form.gender === 'female' ? 'male' : 'both',
          marital_status: form.marital_status || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          city: form.city,
        })
      }

      if (section === 'seeking') {
        Object.assign(updates, {
          relationship_goal: form.relationship_goal,
          children_future: form.children_future,
          seeking_status: form.seeking_status,
          seeking_with_kids: form.seeking_with_kids,
          age_pref_min: form.age_pref_min,
          age_pref_max: form.age_pref_max,
          distance_pref_km: form.distance_pref_km,
        })
      }

      if (section === 'lifestyle') {
        Object.assign(updates, {
          religious_level: form.religion[0] ?? 'masorti',
          residence_intent: form.residence_intent,
          languages: form.languages,
          romantic_vision: form.romantic_vision,
          friday_night: form.friday_night,
          saturday_morning: form.saturday_morning,
          hobbies: hobbiesAll,
        })
      }

      if (section === 'about') {
        Object.assign(updates, {
          bio: form.open_bio,
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
        })
      }

      await updateProfile(updates as Parameters<typeof updateProfile>[0])
      toast.success('השינויים נשמרו ✓')
    } catch (err) {
      console.error(err)
      toast.error('שגיאה בשמירה. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  const SaveButton = ({ section }: { section: Parameters<typeof saveSection>[0] }) => (
    <Button
      onClick={() => saveSection(section)}
      disabled={saving}
      className="w-full bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-12 font-bold mt-6 disabled:opacity-40"
    >
      <Save className="w-4 h-4 me-2" />
      {saving ? 'שומר...' : 'שמור שינויים'}
    </Button>
  )

  if (isLoading) {
    return (
      <div>
        <AppHeader title="עריכת פרופיל" showBack />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl h-24 border border-[#E5E5E5] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const visibleExisting = existingPhotos.filter(p => !photosToDelete.includes(p.id))
  const totalPhotos = visibleExisting.length + newPhotos.length

  return (
    <div>
      <AppHeader title="עריכת פרופיל" showBack />
      <div className="max-w-2xl mx-auto p-4 md:p-6 pb-16">
        <Tabs defaultValue="personal">
          <TabsList className="w-full mb-6 bg-[#F5F5F5] rounded-2xl p-1 grid grid-cols-5">
            <TabsTrigger value="personal" className="rounded-xl text-xs">פרטים</TabsTrigger>
            <TabsTrigger value="seeking" className="rounded-xl text-xs">מחפש</TabsTrigger>
            <TabsTrigger value="lifestyle" className="rounded-xl text-xs">אורח חיים</TabsTrigger>
            <TabsTrigger value="about" className="rounded-xl text-xs">עליך</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-xl text-xs">תמונות</TabsTrigger>
          </TabsList>

          {/* ── Personal ── */}
          <TabsContent value="personal" className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-5">
              <SectionTitle>פרטים אישיים</SectionTitle>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>שם פרטי</FieldLabel>
                  <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="ישראל" className="h-12 rounded-2xl border-[#E5E5E5]" />
                </div>
                <div>
                  <FieldLabel>שם משפחה</FieldLabel>
                  <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="ישראלי" className="h-12 rounded-2xl border-[#E5E5E5]" />
                </div>
              </div>

              <div>
                <FieldLabel>שנת לידה</FieldLabel>
                <Input
                  type="number" value={form.birth_year}
                  onChange={e => set('birth_year', e.target.value)}
                  placeholder="1990" min={1944} max={2006}
                  className="h-12 rounded-2xl border-[#E5E5E5] text-center text-xl font-bold" dir="ltr"
                />
              </div>

              <div>
                <FieldLabel>מגדר</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'male', label: '👨 גבר' }, { value: 'female', label: '👩 אישה' }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => set('gender', opt.value)}
                      className={cn('h-14 rounded-2xl border-2 font-bold transition-all text-sm',
                        form.gender === opt.value ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>סטטוס</FieldLabel>
                <SingleSelectButtons
                  options={[
                    { value: 'single', label: 'רווק / רווקה' },
                    { value: 'divorced', label: 'גרוש / גרושה' },
                    { value: 'widowed', label: 'אלמן / אלמנה' },
                  ]}
                  selected={form.marital_status}
                  onSelect={v => set('marital_status', v)}
                />
              </div>

              <div>
                <FieldLabel optional>גובה (ס"מ)</FieldLabel>
                <Input
                  type="number" value={form.height_cm}
                  onChange={e => set('height_cm', e.target.value)}
                  placeholder="175" min={140} max={220}
                  className="h-12 rounded-2xl border-[#E5E5E5] text-center text-xl font-bold" dir="ltr"
                />
              </div>

              <div>
                <FieldLabel>עיר מגורים</FieldLabel>
                <Input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="תל אביב, ניו יורק..." className="h-12 rounded-2xl border-[#E5E5E5]" />
              </div>
            </div>
            <SaveButton section="personal" />
          </TabsContent>

          {/* ── Seeking ── */}
          <TabsContent value="seeking" className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-6">
              <div>
                <SectionTitle>מה אני מחפש?</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'marriage', label: '💍 חתונה וחמין בשבת' },
                    { value: 'serious_easy', label: '☕ קשר רציני בקצב רגוע וקליל' },
                    { value: 'chapter2', label: '🌱 פרק ב׳' },
                    { value: 'chemistry', label: '✨ כימיה טובה ומשם נראה' },
                    { value: 'dating', label: '😊 היכרות קלילה / דייטינג בכיף' },
                    { value: 'just_looking', label: '👀 רק בודק מה יש פה 😅' },
                  ]}
                  selected={form.relationship_goal}
                  onToggle={v => toggleMulti('relationship_goal', v)}
                />
              </div>

              <div>
                <SectionTitle>ילדים בעתיד</SectionTitle>
                <SingleSelectButtons
                  options={[
                    { value: 'want_must', label: '👨‍👩‍👧 רוצה משפחה וילדים — זה חובה' },
                    { value: 'want_sometime', label: '🌿 כן, אבל כל דבר בזמן שלו' },
                    { value: 'undecided', label: '🤷 עוד לא החלטתי' },
                    { value: 'dont_want', label: '✋ ילדים לא חלק מהתוכנית שלי' },
                    { value: 'have_maybe_more', label: '👶 יש לי ילדים — ואולי עוד בהמשך' },
                    { value: 'have_enough', label: '💛 יש לי ילדים, וזה מספיק לי' },
                  ]}
                  selected={form.children_future}
                  onSelect={v => set('children_future', v)}
                />
              </div>

              <div>
                <SectionTitle>סטטוס מועדף בשידוך</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'single', label: 'רווקה / רווק' },
                    { value: 'divorced', label: 'גרושה / גרוש' },
                    { value: 'widowed', label: 'אלמנה / אלמן' },
                  ]}
                  selected={form.seeking_status}
                  onToggle={v => toggleMulti('seeking_status', v)}
                />
              </div>

              <div>
                <SectionTitle>ילדים מקשר קודם?</SectionTitle>
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

              <div className="space-y-4">
                <SectionTitle>טווח גילאים</SectionTitle>
                <RangeSlider label="גיל מינימלי" value={form.age_pref_min} min={18} max={form.age_pref_max - 1}
                  onChange={v => set('age_pref_min', v)} suffix=" שנה" />
                <RangeSlider label="גיל מקסימלי" value={form.age_pref_max} min={form.age_pref_min + 1} max={80}
                  onChange={v => set('age_pref_max', v)} suffix=" שנה" />
                <RangeSlider label="מרחק מקסימלי" value={form.distance_pref_km} min={5} max={500}
                  onChange={v => set('distance_pref_km', v)} suffix=' ק"מ' />
              </div>
            </div>
            <SaveButton section="seeking" />
          </TabsContent>

          {/* ── Lifestyle ── */}
          <TabsContent value="lifestyle" className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-6">
              <div>
                <SectionTitle>דת ורמת דתיות</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'hiloni', label: '☀️ חילוני' },
                    { value: 'hiloni_heart', label: '💙 יהודי בלב, חילוני בלו״ז' },
                    { value: 'masorti', label: '🕎 מסורתי' },
                    { value: 'masorti_lite', label: '🍷 עושה קידוש ואז מדליק טלוויזיה' },
                    { value: 'dati_light', label: '📖 דתי לייט' },
                    { value: 'dati', label: '✡️ דתי על מלא' },
                  ]}
                  selected={form.religion}
                  onToggle={v => {
                    set('religion', form.religion.includes(v) ? form.religion.filter(x => x !== v) : [v])
                  }}
                />
              </div>

              <div>
                <SectionTitle>כוונות מגורים 🏡</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'israel_stay', label: '🇮🇱 בארץ ולא זז' },
                    { value: 'israel_maybe_reloc', label: '✈️ בארץ… אבל אהבה יכולה לשלוח לרילוקיישן' },
                    { value: 'abroad_return_soon', label: '🔄 בחו״ל, חוזר/ת בשנה-שנתיים' },
                    { value: 'abroad_return_later', label: '⏳ בחו״ל, חוזר/ת בעוד כמה שנים' },
                    { value: 'abroad_stay', label: '🌍 בחו״ל ונשאר' },
                    { value: 'flexible', label: '💕 תלוי בזוגיות' },
                  ]}
                  selected={form.residence_intent}
                  onToggle={v => toggleMulti('residence_intent', v)}
                />
              </div>

              <div>
                <SectionTitle>שפות</SectionTitle>
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

              <div>
                <SectionTitle>רומנטי בעיניי זה...</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'cuddle_movie', label: '🛋️ להתכרבל ולראות סרט בבית' },
                    { value: 'walk_talk', label: '🚶 טיול רגלי עם שיחה עמוקה' },
                    { value: 'long_hug', label: '🤗 חיבוק ארוך אחרי יום קשוח' },
                    { value: 'midday_msg', label: '💬 הודעה קטנה באמצע היום' },
                    { value: 'car_music', label: '🚗 נסיעה עם מוזיקה בפול וולום' },
                    { value: 'shared_laugh', label: '😂 צחוק משותף על שטות' },
                    { value: 'shawarma', label: '🌯 שווארמה ב-11 בלילה' },
                  ]}
                  selected={form.romantic_vision}
                  onToggle={v => toggleMulti('romantic_vision', v)}
                />
              </div>

              <div>
                <SectionTitle>שישי בערב אצלי זה...</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'family_kiddush', label: '🕯️ קידוש אצל ההורים — חובה חלה עם חריימה' },
                    { value: 'friends_dinner', label: '🥂 ארוחת שישי עם חברים' },
                    { value: 'takeaway_netflix', label: '🍕 טייק אוואי ונטפליקס' },
                  ]}
                  selected={form.friday_night}
                  onToggle={v => toggleMulti('friday_night', v)}
                />
              </div>

              <div>
                <SectionTitle>שבת בבוקר...</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'beach_matkot', label: '🏖️ ים, מטקות ואבטיח' },
                    { value: 'cafe', label: '☕ בית קפה ברגוע' },
                    { value: 'synagogue', label: '🕍 בית כנסת' },
                    { value: 'sleep_late', label: '😴 נוחר עד 12:00 ואז חמין' },
                  ]}
                  selected={form.saturday_morning}
                  onToggle={v => toggleMulti('saturday_morning', v)}
                />
              </div>

              <div>
                <SectionTitle>תחביבים</SectionTitle>
                <MultiSelectButtons
                  options={[
                    { value: 'soccer', label: '⚽ כדורגל' },
                    { value: 'sport', label: '🏃 ספורט / כושר / ריצה' },
                    { value: 'torah', label: '📜 שיעורי תורה' },
                    { value: 'cooking', label: '👨‍🍳 בישול' },
                    { value: 'nightlife', label: '🍽️ מסעדות, ברים' },
                    { value: 'series', label: '📺 סדרות / סרטים' },
                    { value: 'music', label: '🎵 מוזיקה' },
                    { value: 'reading', label: '📚 קריאה' },
                    { value: 'tech', label: '💻 טכנולוגיה / גיימינג' },
                    { value: 'art', label: '🎨 אמנות / צילום' },
                    { value: 'meditation', label: '🧘 מדיטציה / יוגה' },
                    { value: 'bbq', label: '🔥 על האש' },
                    { value: 'travel', label: '✈️ טיולים' },
                    { value: 'chill', label: '🌊 זורם עם החיים' },
                    { value: 'politics', label: '🗞️ פוליטיקה' },
                  ]}
                  selected={form.hobbies}
                  onToggle={v => toggleMulti('hobbies', v)}
                />
                <div className="mt-3 space-y-1.5">
                  <FieldLabel optional>תחביב שלא ברשימה</FieldLabel>
                  <Input value={form.hobby_custom} onChange={e => set('hobby_custom', e.target.value)}
                    placeholder="כתוב כאן..." className="h-11 rounded-2xl border-[#E5E5E5]" />
                </div>
              </div>
            </div>
            <SaveButton section="lifestyle" />
          </TabsContent>

          {/* ── About ── */}
          <TabsContent value="about" className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-5">
              <SectionTitle>קצת עליך</SectionTitle>

              {[
                { key: 'open_bio' as const, label: 'ספר על עצמך', ph: 'מי אתה, מה אתה אוהב...', required: true, max: 600 },
                { key: 'open_seeking' as const, label: 'מה אתה מחפש בזוגיות?', ph: 'בן/בת זוג אידיאלי/ת בעיניי...', max: 400 },
                { key: 'open_dealbreaker' as const, label: 'מה הדיל ברייקר שלך?', ph: 'דבר שלא תוותר עליו...', max: 300 },
                { key: 'open_work' as const, label: 'מה אתה עושה בחיים?', ph: 'עבודה / קריירה...', max: 300 },
                { key: 'open_quote' as const, label: 'משפט לחיים', ph: 'משפט שמנחה אותך...', max: 300 },
                { key: 'open_loves' as const, label: 'דברים שאני אוהב', ph: '3 דברים שאתה אוהב...', max: 300 },
                { key: 'open_strength' as const, label: 'החוזקה הכי גדולה שלי', ph: 'הכוח שלך...', max: 300 },
                { key: 'open_future_self' as const, label: 'איך אני רואה את העתיד שלי', ph: 'החלום / התוכנית...', max: 300 },
                { key: 'open_future_us' as const, label: 'איך אני רואה את העתיד שלנו', ph: 'מערכת יחסים מושלמת בעינייך...', max: 300 },
                { key: 'open_lie' as const, label: 'שקר שאני אוהב לספר', ph: '😄', max: 300 },
                { key: 'open_movie' as const, label: 'אם היו עושים עלייך סרט — איך היו קוראים לו?', ph: 'שם הסרט...', max: 300 },
                { key: 'open_crazy' as const, label: 'מה הדבר הכי לא הגיוני שעשית?', ph: 'כאן אפשר לפרוע...', max: 300 },
                { key: 'open_first_impression' as const, label: 'מה הדבר הראשון שאנשים חושבים עליך?', ph: 'מה אומרים עליך...', max: 300 },
                { key: 'open_song' as const, label: 'שיר שהוא נושא החיים שלך', ph: 'שם השיר ומי שר...', max: 300 },
                { key: 'open_weird_habit' as const, label: 'מה ההרגל הכי מוזר שלך?', ph: 'תתעז לשתף...', max: 300 },
                { key: 'open_childish' as const, label: 'מה הדבר הכי ילדותי שאתה עושה?', ph: '😄', max: 300 },
                { key: 'open_food' as const, label: 'מה האוכל שאתה יכול לאכול כל יום?', ph: 'אוכל שאתה ממש אוהב...', max: 300 },
              ].map(({ key, label, ph, required, max }) => (
                <div key={key} className="space-y-1.5">
                  <FieldLabel optional={!required}>{label}{required ? ' *' : ''}</FieldLabel>
                  <Textarea
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="min-h-20 rounded-2xl border-[#E5E5E5] resize-none text-sm"
                    maxLength={max}
                  />
                  <p className="text-xs text-[#A3A3A3] text-end">{form[key].length}/{max}</p>
                </div>
              ))}
            </div>
            <SaveButton section="about" />
          </TabsContent>

          {/* ── Photos ── */}
          <TabsContent value="photos" className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5]">
              <SectionTitle>תמונות ומדיה</SectionTitle>
              <p className="text-xs text-[#A3A3A3] mb-4">מינימום 3, עד 10 קבצים (תמונות, סרטון, שמע)</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Existing photos */}
                {visibleExisting.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#E5E5E5]">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => markDeleteExisting(photo.id)}
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

                {/* New photos preview */}
                {newPhotos.map((file, i) => (
                  <div key={`new-${i}`} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-[#0A0A0A]">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1 end-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/80 text-white text-xs text-center py-1">
                      חדשה
                    </div>
                  </div>
                ))}

                {/* Add button */}
                {totalPhotos < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                      totalPhotos < 3 ? 'border-[#0A0A0A] bg-gray-50' : 'border-[#E5E5E5] hover:border-[#0A0A0A]'
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
                onChange={handleNewPhotos}
              />

              <div className="bg-[#F5F5F5] rounded-2xl p-3 text-center">
                <p className="text-sm text-[#737373]">
                  {totalPhotos}/10 קבצים •{' '}
                  {totalPhotos < 3
                    ? <span className="text-red-500 font-medium">נדרשות עוד {3 - totalPhotos} תמונות</span>
                    : <span className="text-green-600 font-medium">✓ מינימום הושג</span>
                  }
                </p>
              </div>
            </div>
            <SaveButton section="photos" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
