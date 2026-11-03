'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { fetchProfile, setProfileApproval, deleteUserAccount } from '@/lib/api/profiles'
import { sendLike, removeLike, isLiked } from '@/lib/api/likes'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import { calcAgeFromProfile, formatHeight } from '@/lib/utils/age'
import {
  MapPin, Heart, MessageCircle, ChevronLeft, ChevronRight, Cake, ArrowUpDown,
  Gem, Users, Plane, Check, X, CheckCircle2, Trash2, ShieldCheck, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { photoObjectPosition } from '@/lib/faceDetection'
import { useAuth } from '@/components/shared/AuthProvider'
import type { DbProfile, DbPhoto } from '@/lib/types/database'

// ─── Theme ──────────────────────────────────────────────────────────────────
// כחול רקע, נייבי לכרטיסים, זהב לכותרות — לפי עיצוב "סיפור"
const GOLD = '#F2C76A'
const BG = 'bg-[#2E4F91]'
const CARD = 'bg-[#16244F]'
const PILL = 'bg-[#1B2B5E]'
const MUTED = 'text-[#B8C4E6]'

// ─── Label Maps ─────────────────────────────────────────────────────────────

const RELATIONSHIP_GOAL: Record<string, string> = {
  marriage: '💍 חתונה וחמין בשבת',
  serious_easy: '☕ קשר רציני בקצב קליל',
  chapter2: '🌱 פרק ב׳',
  chemistry: '✨ כימיה טובה ומשם נראה',
  dating: '😊 היכרות קלילה',
  just_looking: '👀 רק בודק מה יש פה',
}

const CHILDREN_FUTURE: Record<string, string> = {
  want_must: '👨‍👩‍👧 רוצה ילדים — חובה',
  want_sometime: '🌿 כן, כל דבר בזמן שלו',
  undecided: '🤷 עוד לא החלטתי',
  dont_want: '✋ ילדים לא בתוכנית',
  have_maybe_more: '👶 יש ילדים, ואולי עוד',
  have_enough: '💛 יש ילדים, וזה מספיק',
}

const RESIDENCE_INTENT: Record<string, string> = {
  israel_stay: '🇮🇱 בארץ ולא זז',
  israel_maybe_reloc: '✈️ בארץ, פתוח לרילוקיישן',
  abroad_return_soon: '🔄 בחו"ל, חוזר/ת בשנה-שנתיים',
  abroad_return_later: '⏳ בחו"ל, חוזר/ת בעוד כמה שנים',
  abroad_stay: '🌍 בחו"ל ונשאר',
  flexible: '💕 תלוי בזוגיות',
}

const SEEKING_STATUS: Record<string, string> = {
  single: 'רווק/ה',
  divorced: 'גרוש/ה',
  widowed: 'אלמן/ה',
}

const SEEKING_WITH_KIDS: Record<string, string> = {
  yes: '✅ עם ילדים — בסדר גמור',
  no: '🚫 עדיף ללא ילדים',
  dont_mind: '💛 ילדים מקשר קודם — לא משנה לי',
}

// ערך-דגל ל"ללא הגבלת מרחק" (ראו setup-profile)
const DISTANCE_NO_LIMIT = 99999

// אותן רמות דתיות, בלי אימוג'י — לשורת המידע הבסיסי שליד הגובה והעיר
const RELIGIOUS_LEVEL_PLAIN: Record<string, string> = {
  hiloni: 'חילוני',
  hiloni_heart: 'יהודי בלב',
  masorti: 'מסורתי',
  masorti_lite: 'מסורתי לייט',
  dati_light: 'דתי לייט',
  dati: 'דתי',
  haredi: 'חרדי',
}

const ROMANTIC_VISION: Record<string, string> = {
  cuddle_movie: '🛋️ להתכרבל ולראות סרט',
  walk_talk: '🚶 טיול עם שיחה עמוקה',
  long_hug: '🤗 חיבוק ארוך אחרי יום קשה',
  midday_msg: '💬 הודעה קטנה באמצע היום',
  car_music: '🚗 נסיעה עם מוזיקה בפול',
  shared_laugh: '😂 צחוק משותף על שטות',
  shawarma: '🌯 שווארמה ב-11 בלילה',
}

const FRIDAY_NIGHT: Record<string, string> = {
  family_kiddush: '🕯️ קידוש אצל ההורים',
  friends_dinner: '🥂 ארוחת שישי עם חברים',
  takeaway_netflix: '🍕 טייק אוואי ונטפליקס',
}

const SATURDAY_MORNING: Record<string, string> = {
  beach_matkot: '🏖️ ים ומטקות',
  cafe: '☕ בית קפה',
  synagogue: '🕍 בית כנסת',
  sleep_late: '😴 נוחר עד 12:00',
}

const HOBBY_LABELS: Record<string, string> = {
  soccer: '⚽ כדורגל', sport: '🏃 ספורט', torah: '📜 תורה', cooking: '👨‍🍳 בישול',
  nightlife: '🍽️ חיי לילה', series: '📺 סדרות', music: '🎵 מוסיקה', reading: '📚 קריאה',
  tech: '💻 טכנולוגיה', art: '🎨 אמנות', meditation: '🧘 מדיטציה', bbq: '🔥 על האש',
  travel: '✈️ טיולים', chill: '🌊 זורם', politics: '🗞️ פוליטיקה',
  kineret: '🏖️ חוף בטבריה', matkot: '🏓 מטקות בים',
}

const LANGUAGES: Record<string, string> = {
  he: '🇮🇱 עברית', en: '🇺🇸 אנגלית', ar: '🌙 ערבית', ru: '🇷🇺 רוסית',
  es: '🇪🇸 ספרדית', fr: '🇫🇷 צרפתית', am: '🇪🇹 אמהרית', yi: '✡️ יידיש',
  fa: '🇮🇷 פרסית', pt: '🇧🇷 פורטוגזית', de: '🇩🇪 גרמנית', it: '🇮🇹 איטלקית',
  buh: '🇺🇿 בוכרית', ka: '🇬🇪 גרוזינית',
}


// ─── Helpers ────────────────────────────────────────────────────────────────

// התוויות במפות כוללות אימוג'י בהתחלה; העיצוב החדש נקי מהם
const plain = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim()

const labelsOf = (values: string[] | undefined, map: Record<string, string>) =>
  (values ?? []).map(v => map[v]).filter(Boolean).map(plain)

const MARITAL_BY_GENDER: Record<string, { f: string; m: string }> = {
  single: { f: 'רווקה', m: 'רווק' },
  divorced: { f: 'גרושה', m: 'גרוש' },
  widowed: { f: 'אלמנה', m: 'אלמן' },
}

const SHARED_RESIDENCE: Record<string, string> = {
  israel_stay: 'שניכם בארץ ולא זזים',
  israel_maybe_reloc: 'שניכם פתוחים לרילוקיישן',
  abroad_return_soon: 'שניכם בחו"ל וחוזרים בקרוב',
  abroad_return_later: 'שניכם בחו"ל וחוזרים בעוד כמה שנים',
  abroad_stay: 'שניכם בחו"ל ונשארים',
  flexible: 'שניכם גמישים וזה תלוי בזוגיות',
}

function joinHe(items: string[]) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ו${items[items.length - 1]}`
}

// מה משותף לצופה ולפרופיל שמוצג
function sharedWith(me: DbProfile | undefined, other: DbProfile): string[] {
  if (!me) return []
  const out: string[] = []
  const common = (a?: string[], b?: string[]) => (a ?? []).filter(x => (b ?? []).includes(x))

  const goals = common(me.relationship_goal, other.relationship_goal)
  if (goals[0]) out.push(`שניכם מחפשים ${plain(RELATIONSHIP_GOAL[goals[0]] ?? '')}`)

  const res = common(me.residence_intent, other.residence_intent)
  if (res[0] && SHARED_RESIDENCE[res[0]]) out.push(SHARED_RESIDENCE[res[0]])

  const hobbies = common(me.hobbies, other.hobbies).map(h => plain(HOBBY_LABELS[h] ?? h)).slice(0, 3)
  if (hobbies.length) out.push(`שניכם אוהבים ${joinHe(hobbies)}`)

  if (me.religious_level && me.religious_level === other.religious_level) {
    out.push(`שניכם ${RELIGIOUS_LEVEL_PLAIN[me.religious_level] ?? me.religious_level}`)
  }
  return out.slice(0, 4).filter(s => s.trim().length > 6)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-2xl mb-3" style={{ color: GOLD }}>{children}</h3>
}

function Pill({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        'text-base px-5 py-3 rounded-full font-medium border',
        highlight ? 'bg-[#F2C76A] text-[#16244F] border-transparent font-bold rounded-2xl'
          : `${PILL} text-white border-[#2E4380]`
      )}
    >
      {children}
    </span>
  )
}

function Pills({ labels }: { labels: string[] }) {
  if (!labels.length) return null
  return (
    <div className="flex flex-wrap gap-2.5">
      {labels.map(l => <Pill key={l}>{l}</Pill>)}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className={cn(CARD, 'rounded-2xl p-3.5 border border-[#2E4380]/60')}>
      <div className={cn('flex items-center gap-2 text-sm mb-1.5', MUTED)}>
        <Icon className="w-4 h-4 text-[#F2C76A] shrink-0" />
        {label}
      </div>
      <p className="font-bold text-white text-lg leading-snug">{value}</p>
    </div>
  )
}

// מדיה משובצת בין סקשנים בגוף הפרופיל
function InlinePhoto({ photo, name }: { photo?: DbPhoto; name: string }) {
  if (!photo) return null
  return (
    <div className="rounded-3xl overflow-hidden bg-[#16244F] aspect-[4/5] border border-[#2E4380]/60">
      {photo.media_type === 'video' ? (
        <video src={photo.url} controls playsInline className="w-full h-full object-cover bg-black" />
      ) : photo.media_type === 'audio' ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
          <span className="text-5xl">🎙️</span>
          <audio src={photo.url} controls className="w-full max-w-xs" />
        </div>
      ) : (
        <img src={photo.url} alt={name} className="w-full h-full object-cover" style={{ objectPosition: photoObjectPosition(photo) }} />
      )}
    </div>
  )
}

function OpenQuestion({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null
  return (
    <div className={cn(PILL, 'rounded-3xl p-5')}>
      <p className={cn('text-sm mb-2', MUTED)}>{label}</p>
      <p className="text-white text-lg leading-relaxed">{value}</p>
    </div>
  )
}

function FunQuestion({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null
  return (
    <div className="bg-[#F2C76A] rounded-3xl p-5 text-[#16244F]">
      <p className="text-sm font-bold mb-2">שאלת כיף · {label}</p>
      <p className="text-3xl font-black leading-tight">{value}</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const APPROVAL_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'ממתין לאישור', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'מאושר', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'נדחה', className: 'bg-red-100 text-red-700' },
}

export default function ProfilePage() {
  const { isRTL } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const isOwnProfile = !!user && userId === user.id
  const isAdmin = (user?.profile as unknown as Record<string, unknown>)?.is_admin === true
  const me = user?.profile as unknown as DbProfile | undefined

  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [photos, setPhotos] = useState<DbPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [messagingOpen, setMessagingOpen] = useState(false)
  const [adminBusy, setAdminBusy] = useState(false)

  const BackChevron = isRTL ? ChevronRight : ChevronLeft

  useEffect(() => {
    fetchProfile(userId).then(data => {
      if (data) {
        setProfile(data.profile)
        setPhotos(data.photos)
      }
      setLoading(false)
    })
  }, [userId])

  useEffect(() => {
    if (!user || !userId) return
    isLiked(user.id, userId).then(setLiked)
  }, [user, userId])

  if (loading) {
    return (
      <div className={cn(BG, 'min-h-screen animate-pulse')}>
        <div className="max-w-2xl mx-auto">
          <div className="h-16 bg-[#0A1233]" />
          <div className="m-4 aspect-[4/5] bg-[#16244F] rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#171411] mb-4">פרופיל לא נמצא</p>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/profile/me">חזור לפרופיל שלי</Link>
        </Button>
      </div>
    )
  }

  const female = profile.gender === 'female'
  const g = (f: string, m: string) => (female ? f : m)

  const age = calcAgeFromProfile(profile)
  const firstPhoto = photos[0]
  const photoUrl = firstPhoto?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/600/800`
  const oq = profile.open_questions ?? {}
  const restPhotos = photos.slice(1)
  const shared = isOwnProfile ? [] : sharedWith(me, profile)

  const marital = profile.marital_status ? MARITAL_BY_GENDER[profile.marital_status]?.[female ? 'f' : 'm'] : undefined
  const religious = profile.religious_level ? (RELIGIOUS_LEVEL_PLAIN[profile.religious_level] ?? profile.religious_level) : undefined
  const residenceLabels = labelsOf(profile.residence_intent, RESIDENCE_INTENT)
  const goalLabels = labelsOf(profile.relationship_goal, RELATIONSHIP_GOAL)
  const hobbyLabels = (profile.hobbies ?? []).map(h => plain(HOBBY_LABELS[h] ?? h))
  const languageLabels = labelsOf(profile.languages, LANGUAGES)
  const fridayLabels = labelsOf(profile.friday_night, FRIDAY_NIGHT)
  const saturdayLabels = labelsOf(profile.saturday_morning, SATURDAY_MORNING)
  const romanticLabels = labelsOf(profile.romantic_vision, ROMANTIC_VISION)

  const partnerPrefs = [
    ...(profile.seeking_status ?? []).length
      ? [(profile.seeking_status ?? []).map(s => SEEKING_STATUS[s]).filter(Boolean).join(' / ')]
      : [],
    ...(profile.age_pref_min > 0 && profile.age_pref_max > 0 ? [`גילאי ${profile.age_pref_min}–${profile.age_pref_max}`] : []),
    ...(profile.seeking_with_kids && SEEKING_WITH_KIDS[profile.seeking_with_kids] ? [plain(SEEKING_WITH_KIDS[profile.seeking_with_kids])] : []),
    ...(profile.distance_pref_km > 0
      ? [profile.distance_pref_km >= DISTANCE_NO_LIMIT ? 'מכל העולם' : `עד ${profile.distance_pref_km} ק"מ ממני`]
      : []),
  ].filter(Boolean)

  const handleLike = async () => {
    if (!user) return
    if (liked) {
      await removeLike(user.id, profile.user_id)
      setLiked(false)
    } else {
      await sendLike(user.id, profile.user_id, false)
      setLiked(true)
      toast.success(`❤️ לייקת את ${profile.first_name}!`, { description: 'הם יקבלו התראה', duration: 2000 })
    }
  }

  const handleAdminApproval = async (status: 'approved' | 'rejected') => {
    setAdminBusy(true)
    const ok = await setProfileApproval(profile.user_id, status)
    setAdminBusy(false)
    if (ok) {
      setProfile(prev => prev ? { ...prev, approval_status: status } : prev)
      toast.success(status === 'approved' ? '✅ הפרופיל אושר' : 'הפרופיל נדחה')
    } else {
      toast.error('שגיאה בעדכון סטטוס האישור')
    }
  }

  const handleAdminDelete = async () => {
    const name = `${profile.first_name} ${profile.last_name}`.trim()
    if (!window.confirm(`למחוק לצמיתות את המשתמש ${name}? כל הנתונים, ההודעות והתמונות יימחקו. אין דרך לשחזר.`)) return
    setAdminBusy(true)
    const res = await deleteUserAccount(profile.user_id)
    setAdminBusy(false)
    if (res.ok) {
      toast.success('המשתמש נמחק לצמיתות')
      router.replace('/admin')
    } else {
      toast.error(res.error ?? 'שגיאה במחיקת המשתמש')
    }
  }

  const funQuestions: [string, string | undefined][] = [
    ['שקר שאני אוהב/ת לספר', oq.lie],
    ['אם היו עושים עליי סרט — שמו היה', oq.movie],
    ['הדבר הכי לא הגיוני שעשיתי', oq.crazy],
    ['מה הדבר הראשון שאנשים חושבים עליי?', oq.first_impression],
    ['שיר שהוא נושא החיים שלי', oq.song],
    ['ההרגל הכי מוזר שלי', oq.weird_habit],
    ['הדבר הכי ילדותי שאני עדיין עושה', oq.childish],
    ['אוכל שאני יכול/ה לאכול כל יום', oq.food],
  ]

  const bio = oq.bio || profile.bio
  const hasMoreAbout = oq.seeking || oq.dealbreaker || oq.work || oq.loves || oq.strength || oq.future_self || oq.future_us

  return (
    <div className={cn(BG, 'min-h-screen text-white', isOwnProfile ? 'pb-20 md:pb-6' : 'pb-64')}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A1233] border-b-2 border-[#2E4380]/70">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={isOwnProfile ? '/profile/me' : '/discover'}
            aria-label="חזרה"
            className="w-14 h-14 rounded-full bg-[#16244F] border-2 border-[#2E4380] flex items-center justify-center shrink-0"
          >
            <BackChevron className="w-6 h-6 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-3xl font-black truncate" style={{ color: GOLD }}>{profile.first_name}</h1>
              {age != null && <span className="text-3xl font-bold text-white">{age}</span>}
            </div>
            {profile.is_online && (
              <p className={cn('flex items-center gap-2 text-base', MUTED)}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                {g('מחוברת עכשיו', 'מחובר עכשיו')}
              </p>
            )}
          </div>
          <img src="/icon-192.png" alt="" className="w-14 h-14 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-6">
        {/* Admin bar */}
        {isAdmin && !isOwnProfile && (
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-3 flex items-center gap-2 flex-wrap text-[#171411]">
            <div className="flex items-center gap-2 me-auto">
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-sm font-bold">ניהול</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                APPROVAL_LABELS[profile.approval_status]?.className ?? 'bg-gray-100 text-gray-600')}>
                {APPROVAL_LABELS[profile.approval_status]?.label ?? profile.approval_status}
              </span>
            </div>
            {profile.approval_status !== 'approved' && (
              <button
                onClick={() => handleAdminApproval('approved')}
                disabled={adminBusy}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />אשר
              </button>
            )}
            {profile.approval_status !== 'rejected' && (
              <button
                onClick={() => handleAdminApproval('rejected')}
                disabled={adminBusy}
                className="h-9 px-4 rounded-xl border border-[#E5E5E5] text-[#B8472A] hover:bg-red-50 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <X className="w-4 h-4" />דחה
              </button>
            )}
            <button
              onClick={handleAdminDelete}
              disabled={adminBusy}
              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />מחק משתמש
            </button>
          </div>
        )}

        {/* Main photo */}
        <div className="rounded-3xl overflow-hidden bg-[#16244F] aspect-[4/5] border border-[#2E4380]/60">
          <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" style={{ objectPosition: photoObjectPosition(firstPhoto) }} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {age != null && <Stat icon={Cake} label="גיל" value={String(age)} />}
          {profile.height_cm && <Stat icon={ArrowUpDown} label="גובה" value={formatHeight(profile.height_cm)} />}
          {profile.city && <Stat icon={MapPin} label="מיקום" value={profile.city} />}
          {marital && <Stat icon={Gem} label="סטטוס" value={marital} />}
          {profile.children_count > 0 && (
            <Stat icon={Users} label="ילדים" value={profile.children_count === 1 ? 'ילד אחד' : `${profile.children_count} ילדים`} />
          )}
          {religious && <Stat icon={BookOpen} label="דתיות" value={religious} />}
          {residenceLabels[0] && <Stat icon={Plane} label="כוונות מגורים" value={residenceLabels[0]} />}
        </div>

        {/* Shared */}
        {shared.length > 0 && (
          <div className={cn(CARD, 'rounded-3xl p-5 border-2 border-[#F2C76A]')}>
            <div className="flex items-center gap-2.5 mb-4">
              <Heart className="w-5 h-5 fill-[#F2C76A] text-[#F2C76A]" />
              <h3 className="font-bold text-xl" style={{ color: GOLD }}>מה משותף לכם</h3>
            </div>
            <ul className="space-y-3">
              {shared.map(s => (
                <li key={s} className="flex items-center gap-3 text-lg">
                  <Check className="w-5 h-5 text-[#F2C76A] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div>
            <SectionTitle>קצת עליי</SectionTitle>
            <p className={cn('text-xl leading-loose', MUTED)}>{bio}</p>
          </div>
        )}

        {/* Looking for */}
        {(goalLabels.length > 0 || profile.children_future) && (
          <div>
            <SectionTitle>{g('מה אני מחפשת', 'מה אני מחפש')}</SectionTitle>
            <div className="flex flex-wrap gap-2.5">
              {goalLabels.map((l, i) => <Pill key={l} highlight={i === 0}>{l}</Pill>)}
            </div>
            {profile.children_future && CHILDREN_FUTURE[profile.children_future] && (
              <p className={cn('text-lg mt-4', MUTED)}>
                ילדים בעתיד: {plain(CHILDREN_FUTURE[profile.children_future])}
              </p>
            )}
          </div>
        )}

        <InlinePhoto photo={restPhotos[0]} name={profile.first_name} />

        {/* Quote */}
        {oq.quote?.trim() && (
          <div className={cn(CARD, 'rounded-3xl p-7 text-center')}>
            <p className={cn('text-base font-bold mb-4', MUTED)}>משפט לחיים</p>
            <p className="text-3xl font-black leading-snug" style={{ color: GOLD }}>”{oq.quote}”</p>
            {!isOwnProfile && (
              <button
                onClick={() => setMessagingOpen(true)}
                className="mt-6 inline-flex items-center gap-3 px-7 h-14 rounded-full border-2 border-[#2E4380] text-white font-bold text-lg"
              >
                <MessageCircle className="w-5 h-5" />
                להגיב על זה
              </button>
            )}
          </div>
        )}

        {/* Shabbat */}
        {(fridayLabels.length > 0 || saturdayLabels.length > 0) && (
          <div>
            <SectionTitle>השבת שלי</SectionTitle>
            <div className="space-y-4">
              {fridayLabels.length > 0 && (
                <div className="flex gap-6 items-baseline">
                  <span className={cn('text-lg w-28 shrink-0', MUTED)}>שישי בערב</span>
                  <span className="text-xl">{fridayLabels.join(' · ')}</span>
                </div>
              )}
              {saturdayLabels.length > 0 && (
                <div className="flex gap-6 items-baseline">
                  <span className={cn('text-lg w-28 shrink-0', MUTED)}>שבת בבוקר</span>
                  <span className="text-xl">{saturdayLabels.join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Romantic */}
        {romanticLabels.length > 0 && (
          <div>
            <SectionTitle>רומנטי בעיניי</SectionTitle>
            <Pills labels={romanticLabels} />
          </div>
        )}

        <InlinePhoto photo={restPhotos[1]} name={profile.first_name} />

        {/* More about */}
        {hasMoreAbout && (
          <div className="space-y-3">
            <SectionTitle>עוד עליי</SectionTitle>
            <OpenQuestion label="מה אני מחפש/ת בזוגיות?" value={oq.seeking} />
            <OpenQuestion label="הדיל ברייקר שלי" value={oq.dealbreaker} />
            <OpenQuestion label="מה אני עושה בחיים?" value={oq.work} />
            <OpenQuestion label="כמה דברים שאני אוהב/ת" value={oq.loves} />
            <OpenQuestion label="החוזקה הכי גדולה שלי" value={oq.strength} />
            <OpenQuestion label="איך אני רואה את העתיד שלי" value={oq.future_self} />
            <OpenQuestion label="איך אני רואה את העתיד שלנו" value={oq.future_us} />
          </div>
        )}

        {/* Hobbies */}
        {hobbyLabels.length > 0 && (
          <div>
            <SectionTitle>תחביבים</SectionTitle>
            <Pills labels={hobbyLabels} />
          </div>
        )}

        {/* Languages */}
        {languageLabels.length > 0 && (
          <div>
            <SectionTitle>שפות</SectionTitle>
            <p className={cn('text-xl leading-loose', MUTED)}>{languageLabels.join(' · ')}</p>
          </div>
        )}

        {/* Residence */}
        {residenceLabels.length > 0 && (
          <div>
            <SectionTitle>כוונות מגורים</SectionTitle>
            <p className={cn('text-xl leading-loose', MUTED)}>{residenceLabels.join(' · ')}</p>
          </div>
        )}

        {/* Partner preferences */}
        {partnerPrefs.length > 0 && (
          <div className={cn(CARD, 'rounded-3xl p-5 border border-[#2E4380]/60')}>
            <h3 className="font-bold text-xl mb-4" style={{ color: GOLD }}>
              {g('מה אני מחפשת בבן הזוג', 'מה אני מחפש בבת הזוג')}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {partnerPrefs.map(p => (
                <span key={p} className="bg-[#233470] text-white text-base px-4 py-2.5 rounded-xl">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Fun questions */}
        {funQuestions.some(([, v]) => v?.trim()) && (
          <div className="space-y-3">
            {funQuestions.map(([label, value]) => <FunQuestion key={label} label={label} value={value} />)}
          </div>
        )}

        {restPhotos.slice(2).map(p => <InlinePhoto key={p.id} photo={p} name={profile.first_name} />)}
      </div>

      {/* Action bar — קבוע בתחתית, "הגעת לסוף הפרופיל" */}
      {!isOwnProfile && (
        <div className="fixed bottom-0 inset-x-0 md:ms-64 z-50 bg-[#0A1233] border-t-2 border-[#2E4380]/70">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
            <p className={cn('text-center text-base mb-3', MUTED)}>הגעת לסוף הפרופיל של {profile.first_name}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/discover')}
                className="h-14 rounded-full border-2 border-[#2E4380] text-white font-bold text-lg flex items-center justify-center gap-2.5"
              >
                <X className="w-5 h-5" />
                דלג
              </button>
              <button
                onClick={handleLike}
                className={cn(
                  'h-14 rounded-full border-2 border-[#F2C76A] font-bold text-lg flex items-center justify-center gap-2.5',
                  liked ? 'bg-[#F2C76A] text-[#16244F]' : 'bg-[#16244F]'
                )}
                style={liked ? undefined : { color: GOLD }}
              >
                <Heart className={cn('w-5 h-5', liked ? 'fill-[#16244F]' : 'fill-[#F2C76A]')} />
                {liked ? 'אהבת' : 'אהבתי'}
              </button>
            </div>
            <button
              onClick={() => setMessagingOpen(true)}
              className="mt-3 w-full h-16 rounded-full bg-[#F2C76A] text-[#16244F] font-black text-xl flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              שלח הודעה יא גבר!
            </button>
          </div>
        </div>
      )}

      <SendMessageDialog
        open={messagingOpen}
        onClose={() => setMessagingOpen(false)}
        profile={profile}
        photos={photos}
      />
    </div>
  )
}
