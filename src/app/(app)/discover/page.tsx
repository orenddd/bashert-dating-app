'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { fetchDiscoverProfiles } from '@/lib/api/profiles'
import { sendLike, isLiked } from '@/lib/api/likes'
import { fetchSentRequestsMap, type SentStatusMap } from '@/lib/api/messages'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import { JewishAttributesBadges } from '@/components/profile/JewishAttributesBadges'
import { formatHeight } from '@/lib/utils/age'
import {
  Shield, MapPin, Heart, MessageCircle, X, SlidersHorizontal, Search,
  ChevronLeft, ChevronRight, RefreshCw, Languages, Home as HomeIcon,
  CalendarHeart, Sun, Sparkles, PartyPopper, Clock, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import type { SearchFilters } from '@/lib/types/forms'
import { useAuth } from '@/components/shared/AuthProvider'

// ─── Label maps ───────────────────────────────────────────────────────────────

const RELATIONSHIP_GOAL: Record<string, string> = {
  marriage: '💍 חתונה וחמין בשבת', serious_easy: '☕ קשר רציני בקצב קליל',
  chapter2: '🌱 פרק ב׳', chemistry: '✨ כימיה טובה ומשם נראה',
  dating: '😊 היכרות קלילה', just_looking: '👀 רק בודק/ת מה יש פה',
  serious: '❤️ רציני', friendship: '🤝 חברות', open: '🌊 פתוח/ה',
}
const CHILDREN_FUTURE: Record<string, string> = {
  want_must: '👨‍👩‍👧 רוצה ילדים — חובה', want_sometime: '🌿 כן, כל דבר בזמן שלו',
  undecided: '🤷 עוד לא החלטתי', dont_want: '✋ ילדים לא בתוכנית',
  have_maybe_more: '👶 יש ילדים, ואולי עוד', have_enough: '💛 יש ילדים, וזה מספיק',
}
const RESIDENCE_INTENT: Record<string, string> = {
  israel_stay: '🇮🇱 בארץ ולא זז', israel_maybe_reloc: '✈️ בארץ, פתוח/ה לרילוקיישן',
  abroad_return_soon: '🔄 בחו"ל, חוזר/ת בקרוב', abroad_return_later: '⏳ בחו"ל, חוזר/ת בעוד כמה שנים',
  abroad_stay: '🌍 בחו"ל ונשאר/ת', flexible: '💕 תלוי בזוגיות',
}
const MARITAL_STATUS: Record<string, string> = { single: 'רווק/ה', divorced: 'גרוש/ה', widowed: 'אלמן/ה' }
const RELIGIOUS_LEVEL: Record<string, string> = {
  hiloni: '☀️ חילוני', hiloni_heart: '💙 יהודי בלב', masorti: '🕎 מסורתי',
  masorti_lite: '🍷 מסורתי לייט', dati_light: '📖 דתי לייט', dati: '✡️ דתי', haredi: '⚫ חרדי',
}
const ROMANTIC_VISION: Record<string, string> = {
  cuddle_movie: '🛋️ להתכרבל ולראות סרט', walk_talk: '🚶 טיול עם שיחה עמוקה',
  long_hug: '🤗 חיבוק ארוך אחרי יום קשה', midday_msg: '💬 הודעה קטנה באמצע היום',
  car_music: '🚗 נסיעה עם מוזיקה בפול', shared_laugh: '😂 צחוק משותף על שטות',
  shawarma: '🌯 שווארמה ב-11 בלילה',
}
const FRIDAY_NIGHT: Record<string, string> = {
  family_kiddush: '🕯️ קידוש אצל ההורים', friends_dinner: '🥂 ארוחת שישי עם חברים',
  takeaway_netflix: '🍕 טייק אוואי ונטפליקס',
}
const SATURDAY_MORNING: Record<string, string> = {
  beach_matkot: '🏖️ ים ומטקות', cafe: '☕ בית קפה', synagogue: '🕍 בית כנסת', sleep_late: '😴 נוחר עד 12:00',
}
const HOBBY_LABELS: Record<string, string> = {
  soccer: '⚽ כדורגל', sport: '🏃 ספורט', torah: '📜 תורה', cooking: '👨‍🍳 בישול',
  nightlife: '🍽️ חיי לילה', series: '📺 סדרות', music: '🎵 מוסיקה', reading: '📚 קריאה',
  tech: '💻 טכנולוגיה', art: '🎨 אמנות', meditation: '🧘 מדיטציה', bbq: '🔥 על האש',
  travel: '✈️ טיולים', chill: '🌊 זורם', politics: '🗞️ פוליטיקה',
  kineret: '🏖️ חוף בטבריה ומטקות',
}
const LANGUAGES: Record<string, string> = {
  he: '🇮🇱 עברית', en: '🇺🇸 אנגלית', ar: '🌙 ערבית', ru: '🇷🇺 רוסית', es: '🇪🇸 ספרדית',
  fr: '🇫🇷 צרפתית', am: '🇪🇹 אמהרית', yi: '✡️ יידיש', fa: '🇮🇷 פרסית', pt: '🇧🇷 פורטוגזית',
  de: '🇩🇪 גרמנית', it: '🇮🇹 איטלקית', buh: '🇺🇿 בוכרית', ka: '🇬🇪 גרוזינית',
}

function getAge(p: DbProfile): number | null {
  if (p.birth_year) return new Date().getFullYear() - p.birth_year
  if (p.date_of_birth) {
    const b = new Date(p.date_of_birth)
    let a = new Date().getFullYear() - b.getFullYear()
    const m = new Date().getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < b.getDate())) a--
    return a
  }
  return null
}

// ─── Rotating themes — כל פרופיל מסודר/צבוע קצת אחר ──────────────────────────

interface Theme {
  accent: string        // צבע ההדגשה (כפתורים/מסגרות)
  soft: string          // רקע רך לצ׳יפים
  softText: string      // טקסט על הרקע הרך
  header: 'below' | 'dark'
}
const THEMES: Theme[] = [
  { accent: '#B8472A', soft: '#F7E9E4', softText: '#8A2E17', header: 'below' },
  { accent: '#3E3A8C', soft: '#E9E8F6', softText: '#2C2966', header: 'dark' },
  { accent: '#1F7A5A', soft: '#E1F2EB', softText: '#155C43', header: 'below' },
  { accent: '#9A5B00', soft: '#FBEFD6', softText: '#7A4800', header: 'dark' },
  { accent: '#0A0A0A', soft: '#EFEFEF', softText: '#0A0A0A', header: 'below' },
]

// ─── Small building blocks ─────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-[#A3A3A3]" />}
      <h3 className="font-bold text-[#171411] text-sm">{children}</h3>
    </div>
  )
}

function ChipRow({ values, map, theme }: { values: string[]; map: Record<string, string>; theme: Theme }) {
  const labels = values.map(v => map[v] ?? v).filter(Boolean)
  if (!labels.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(label => (
        <span key={label} className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: theme.soft, color: theme.softText }}>
          {label}
        </span>
      ))}
    </div>
  )
}

function OpenQuestion({ label, value, theme }: { label: string; value?: string; theme: Theme }) {
  if (!value?.trim()) return null
  return (
    <div className="rounded-2xl p-4" style={{ background: theme.soft }}>
      <p className="text-xs mb-1.5 font-medium" style={{ color: theme.softText, opacity: 0.75 }}>{label}</p>
      <p className="text-[#171411] text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function Media({ photo, name, className }: { photo?: DbPhoto; name: string; className?: string }) {
  if (!photo) {
    return <div className={cn('w-full h-full flex items-center justify-center text-7xl text-[#D4D4D4] bg-[#EBE4D2]', className)}>👤</div>
  }
  if (photo.media_type === 'video') {
    return <video src={photo.url} controls playsInline className={cn('w-full h-full object-cover bg-black', className)} />
  }
  if (photo.media_type === 'audio') {
    return (
      <div className={cn('w-full h-full flex flex-col items-center justify-center gap-3 bg-[#EBE4D2] p-6', className)}>
        <span className="text-5xl">🎙️</span>
        <audio src={photo.url} controls className="w-full max-w-xs" />
      </div>
    )
  }
  return <img src={photo.url} alt={name} className={cn('w-full h-full object-cover', className)} />
}

// ─── Full one-at-a-time profile ────────────────────────────────────────────────

function FullProfile({ profile, photos, theme }: { profile: DbProfile; photos: DbPhoto[]; theme: Theme }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  useEffect(() => { setPhotoIdx(0) }, [profile.user_id])

  const age = getAge(profile)
  const oq = profile.open_questions ?? {}
  const media = photos.length ? photos : []
  const current = media[photoIdx]

  const NameBlock = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <h1 className="font-serif text-[28px] font-black text-[#171411] tracking-tight leading-none">
        {profile.first_name}{profile.last_name ? ` ${profile.last_name[0]}.` : ''}
      </h1>
      {age != null && <span className="text-2xl font-light text-[#A3A3A3]">{age}</span>}
      {profile.is_verified && <Shield className="w-5 h-5" style={{ color: theme.accent }} />}
    </div>
  )
  const MetaRow = (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
      {profile.height_cm && <span className="text-[#737373] text-sm">{formatHeight(profile.height_cm)}</span>}
      {profile.marital_status && <span className="text-[#737373] text-sm">{MARITAL_STATUS[profile.marital_status]}</span>}
      {profile.children_count > 0 && (
        <span className="text-[#737373] text-sm">👶 {profile.children_count === 1 ? 'ילד אחד' : `${profile.children_count} ילדים`}</span>
      )}
      {profile.city && (
        <span className="text-[#737373] text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-3xl border border-[#EBEBEB] overflow-hidden shadow-sm">
      {/* Photo / header */}
      <div className="relative">
        <div className={cn('bg-[#EBE4D2] relative', theme.header === 'below' ? 'aspect-[4/3]' : 'aspect-[3/4]')}>
          <Media photo={current} name={profile.first_name} />

          {theme.header !== 'below' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          )}

          {/* progress dots */}
          {media.length > 1 && (
            <div className="absolute top-3 start-4 end-4 flex gap-1">
              {media.map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className={cn('h-[3px] flex-1 rounded-full transition-all', i === photoIdx ? 'bg-white' : 'bg-white/40')} />
              ))}
            </div>
          )}
          {media.length > 1 && photoIdx > 0 && (
            <button onClick={() => setPhotoIdx(i => i - 1)}
              className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {media.length > 1 && photoIdx < media.length - 1 && (
            <button onClick={() => setPhotoIdx(i => i + 1)}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* badges */}
          <div className="absolute bottom-3 start-4 end-4 flex items-end justify-between">
            <div className="flex flex-col gap-1.5">
              {profile.is_online && (
                <span className="flex items-center gap-1.5 bg-green-500/25 backdrop-blur-sm border border-green-400/40 text-white text-xs px-3 py-1 rounded-full w-fit">
                  <span className="w-2 h-2 bg-green-400 rounded-full" /> מחובר/ת
                </span>
              )}
            </div>
            {profile.is_verified && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> מאומת/ת
              </span>
            )}
          </div>

        </div>

        {theme.header === 'dark' && (
          <div className="px-5 py-4 text-white" style={{ background: theme.accent }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="font-serif text-[26px] font-black tracking-tight leading-none">
                {profile.first_name}{profile.last_name ? ` ${profile.last_name[0]}.` : ''}
              </h1>
              {age != null && <span className="text-2xl font-light text-white/70">{age}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-white/80">
              {profile.height_cm && <span className="text-sm">{formatHeight(profile.height_cm)}</span>}
              {profile.marital_status && <span className="text-sm">{MARITAL_STATUS[profile.marital_status]}</span>}
              {profile.city && <span className="text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-6 space-y-5 pt-5">
        {theme.header === 'below' && <div>{NameBlock}{MetaRow}</div>}

        {/* goals */}
        {profile.relationship_goal?.length > 0 && (
          <div>
            <SectionTitle icon={CalendarHeart}>מחפש/ת</SectionTitle>
            <ChipRow values={profile.relationship_goal} map={RELATIONSHIP_GOAL} theme={theme} />
            {profile.children_future && (
              <div className="mt-2">
                <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: theme.soft, color: theme.softText }}>
                  {CHILDREN_FUTURE[profile.children_future]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* bio */}
        {(oq.bio || profile.bio) && (
          <div>
            <SectionTitle>קצת עליי</SectionTitle>
            <p className="text-[#404040] leading-relaxed text-sm whitespace-pre-wrap">{oq.bio || profile.bio}</p>
          </div>
        )}

        {/* key open qs */}
        {(oq.seeking || oq.dealbreaker || oq.work) && (
          <div className="space-y-3">
            <OpenQuestion label="מה אני מחפש/ת בזוגיות?" value={oq.seeking} theme={theme} />
            <OpenQuestion label="הדיל ברייקר שלי" value={oq.dealbreaker} theme={theme} />
            <OpenQuestion label="מה אני עושה בחיים?" value={oq.work} theme={theme} />
          </div>
        )}

        {/* jewish attributes */}
        <div className="rounded-2xl p-4 border" style={{ background: theme.soft, borderColor: 'rgba(0,0,0,0.05)' }}>
          <SectionTitle>רמת דתיות</SectionTitle>
          {profile.religious_level && (
            <p className="text-sm font-medium text-[#171411] mb-2">{RELIGIOUS_LEVEL[profile.religious_level] ?? profile.religious_level}</p>
          )}
          <JewishAttributesBadges profile={profile} />
        </div>

        {/* lifestyle */}
        {(profile.friday_night?.length > 0 || profile.saturday_morning?.length > 0 || profile.romantic_vision?.length > 0) && (
          <div>
            <SectionTitle icon={Sun}>אורח חיים</SectionTitle>
            <div className="space-y-3">
              {profile.friday_night?.length > 0 && (
                <div><p className="text-xs text-[#A3A3A3] mb-1.5">שישי בערב</p><ChipRow values={profile.friday_night} map={FRIDAY_NIGHT} theme={theme} /></div>
              )}
              {profile.saturday_morning?.length > 0 && (
                <div><p className="text-xs text-[#A3A3A3] mb-1.5">שבת בבוקר</p><ChipRow values={profile.saturday_morning} map={SATURDAY_MORNING} theme={theme} /></div>
              )}
              {profile.romantic_vision?.length > 0 && (
                <div><p className="text-xs text-[#A3A3A3] mb-1.5">רומנטי בעיניי</p><ChipRow values={profile.romantic_vision} map={ROMANTIC_VISION} theme={theme} /></div>
              )}
            </div>
          </div>
        )}

        {/* hobbies */}
        {profile.hobbies?.length > 0 && (
          <div>
            <SectionTitle icon={Sparkles}>תחביבים</SectionTitle>
            <ChipRow values={profile.hobbies} map={HOBBY_LABELS} theme={theme} />
          </div>
        )}

        {/* languages + residence */}
        {(profile.languages?.length > 0 || profile.residence_intent?.length > 0) && (
          <div className="space-y-4">
            {profile.languages?.length > 0 && (
              <div><SectionTitle icon={Languages}>שפות</SectionTitle><ChipRow values={profile.languages} map={LANGUAGES} theme={theme} /></div>
            )}
            {profile.residence_intent?.length > 0 && (
              <div><SectionTitle icon={HomeIcon}>כוונות מגורים</SectionTitle><ChipRow values={profile.residence_intent} map={RESIDENCE_INTENT} theme={theme} /></div>
            )}
          </div>
        )}

        {/* more open qs */}
        {(oq.quote || oq.loves || oq.strength || oq.future_self || oq.future_us) && (
          <div className="space-y-3">
            <SectionTitle>עוד עליי</SectionTitle>
            <OpenQuestion label="משפט לחיים" value={oq.quote} theme={theme} />
            <OpenQuestion label="דברים שאני אוהב/ת" value={oq.loves} theme={theme} />
            <OpenQuestion label="החוזקה הכי גדולה שלי" value={oq.strength} theme={theme} />
            <OpenQuestion label="איך אני רואה את העתיד שלי" value={oq.future_self} theme={theme} />
            <OpenQuestion label="איך אני רואה את העתיד שלנו" value={oq.future_us} theme={theme} />
          </div>
        )}

        {/* fun qs */}
        {(oq.lie || oq.movie || oq.crazy || oq.first_impression || oq.song || oq.weird_habit || oq.childish || oq.food) && (
          <div className="space-y-3">
            <SectionTitle>שאלות כיף 🎉</SectionTitle>
            <OpenQuestion label="שקר שאני אוהב/ת לספר" value={oq.lie} theme={theme} />
            <OpenQuestion label="אם היו עושים עליי סרט — שמו היה" value={oq.movie} theme={theme} />
            <OpenQuestion label="הדבר הכי לא הגיוני שעשיתי" value={oq.crazy} theme={theme} />
            <OpenQuestion label="הדבר הראשון שאנשים חושבים עליי" value={oq.first_impression} theme={theme} />
            <OpenQuestion label="שיר שהוא נושא החיים שלי" value={oq.song} theme={theme} />
            <OpenQuestion label="ההרגל הכי מוזר שלי" value={oq.weird_habit} theme={theme} />
            <OpenQuestion label="הדבר הכי ילדותי שאני עדיין עושה" value={oq.childish} theme={theme} />
            <OpenQuestion label="אוכל שאני יכול/ה לאכול כל יום" value={oq.food} theme={theme} />
          </div>
        )}

        <Link href={`/profile/${profile.user_id}`}
          className="block text-center text-xs text-[#A3A3A3] hover:text-[#171411] transition-colors pt-1">
          פתח/י את הפרופיל המלא ↗
        </Link>
      </div>
    </div>
  )
}

// ─── Filters ────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Partial<SearchFilters> = {
  age_min: 18, age_max: 70, religious_levels: [], community_backgrounds: [],
  shomer_shabbat_only: false, verified_only: false, has_photos_only: false,
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<{ profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sentMap, setSentMap] = useState<SentStatusMap>({})
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Partial<SearchFilters>>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Partial<SearchFilters>>(DEFAULT_FILTERS)

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const dialogModeRef = useRef<'like' | 'message'>('message')
  const advancedRef = useRef(false)

  const loadProfiles = useCallback(async (f: Partial<SearchFilters>) => {
    if (!user) return
    setLoading(true)
    const [data, map] = await Promise.all([fetchDiscoverProfiles(user.id, f), fetchSentRequestsMap(user.id)])
    setSentMap(map)
    setItems(data)
    setIndex(0)
    const likedSet = new Set<string>()
    await Promise.all(data.map(async ({ profile }) => { if (await isLiked(user.id, profile.user_id)) likedSet.add(profile.user_id) }))
    setLiked(likedSet)
    setLoading(false)
  }, [user])

  useEffect(() => { loadProfiles(appliedFilters) }, [loadProfiles, appliedFilters])

  const applyFilters = () => { setAppliedFilters(filters); setFilterOpen(false) }
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setFilterOpen(false) }

  const activeFilterCount = [
    appliedFilters.shomer_shabbat_only, appliedFilters.verified_only,
    (appliedFilters.religious_levels?.length ?? 0) > 0,
    (appliedFilters.community_backgrounds?.length ?? 0) > 0,
  ].filter(Boolean).length

  const current = items[index]
  const theme = THEMES[index % THEMES.length]

  const goNext = () => {
    if (advancedRef.current) return
    advancedRef.current = true
    setDialogOpen(false)
    // scroll to top for the next profile
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    setIndex(i => i + 1)
  }

  const handleDislike = () => {
    advancedRef.current = false
    goNext()
  }

  const handleLike = async () => {
    if (!user || !current) return
    if (!liked.has(current.profile.user_id)) {
      setLiked(prev => new Set(prev).add(current.profile.user_id))
      await sendLike(user.id, current.profile.user_id)
      toast.success(`שלחת לב ל${current.profile.first_name} ❤️`, { duration: 1600 })
    }
    // פותח את הצ׳אט לכתיבת הודעה (מצב "אהבתי" — מתקדם לפרופיל הבא בסגירה)
    advancedRef.current = false
    dialogModeRef.current = 'like'
    setDialogOpen(true)
  }

  const handleMessage = () => {
    if (!current) return
    advancedRef.current = false
    dialogModeRef.current = 'message'
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    // "אהבתי" מתקדם גם אם לא נשלחה הודעה; "שלח הודעה" נשאר אם בוטל
    if (dialogModeRef.current === 'like') goNext()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">גילוי</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {loading ? 'טוען...' : items.length ? `פרופיל ${Math.min(index + 1, items.length)} מתוך ${items.length}` : 'אין פרופילים כרגע'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadProfiles(appliedFilters)}
            className="border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)}
            className="relative gap-1.5 border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl">
            <SlidersHorizontal className="w-4 h-4" />מסננים
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-[#0A0A0A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#EBEBEB] overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-[#F0F0F0]" />
          <div className="p-5 space-y-3">
            <div className="h-6 bg-[#F0F0F0] rounded w-1/3" />
            <div className="h-3 bg-[#F0F0F0] rounded" />
            <div className="h-3 bg-[#F0F0F0] rounded w-2/3" />
          </div>
        </div>
      ) : !items.length ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-[#0A0A0A] font-bold text-lg">לא נמצאו פרופילים</p>
          <p className="text-[#737373] text-sm mt-2 max-w-xs mx-auto">
            כרגע אין פרופילים מאושרים שתואמים אותך. נסה/י לשנות את הסינון או לחזור מאוחר יותר.
          </p>
          <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-2xl border-[#E5E5E5]">נקה מסננים</Button>
        </div>
      ) : !current ? (
        <div className="text-center py-24">
          <PartyPopper className="w-12 h-12 mx-auto text-[#B8472A] mb-4" />
          <p className="text-[#0A0A0A] font-bold text-lg">עברת על כל הפרופילים 🎉</p>
          <p className="text-[#737373] text-sm mt-2">בדוק/י שוב מאוחר יותר — כל הזמן מצטרפים חדשים.</p>
          <Button onClick={() => loadProfiles(appliedFilters)} className="mt-5 rounded-2xl bg-[#0A0A0A] hover:bg-[#222] text-white gap-2">
            <RefreshCw className="w-4 h-4" />התחל/י מחדש
          </Button>
        </div>
      ) : (
        <FullProfile key={current.profile.user_id} profile={current.profile} photos={current.photos} theme={theme} />
      )}

      {/* Bottom action bar */}
      {!loading && current && (
        <div className="fixed bottom-0 left-0 right-0 md:ms-64 bg-white/95 backdrop-blur-sm border-t border-[#E5E5E5] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-30">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={handleDislike}
              className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5E5] text-[#737373] hover:border-[#B8472A] hover:text-[#B8472A] font-bold flex items-center justify-center gap-2 transition-all">
              <X className="w-5 h-5" />לא אהבתי
            </button>
            <button onClick={handleLike}
              className={cn('flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-white',
                liked.has(current.profile.user_id) ? 'bg-[#B8472A]' : 'bg-[#E24C6B] hover:bg-[#C93A57]')}>
              <Heart className={cn('w-5 h-5', liked.has(current.profile.user_id) && 'fill-white')} />
              אהבתי
            </button>
            <button onClick={handleMessage}
              className="flex-1 h-14 rounded-2xl bg-[#0A0A0A] hover:bg-[#222] text-white font-bold flex items-center justify-center gap-2 transition-all">
              {sentMap[current.profile.user_id]?.status === 'accepted' && sentMap[current.profile.user_id]?.conversation_id ? (
                <><CheckCircle2 className="w-5 h-5" />שיחה</>
              ) : sentMap[current.profile.user_id]?.status === 'pending' ? (
                <><Clock className="w-5 h-5" />נשלח</>
              ) : (
                <><MessageCircle className="w-5 h-5" />שלח הודעה</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Message compose dialog */}
      {current && (
        <SendMessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSent={goNext}
          profile={current.profile}
          photos={current.photos}
        />
      )}

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-center text-base font-bold text-[#0A0A0A]">סינון פרופילים</SheetTitle>
            </SheetHeader>
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-semibold text-[#0A0A0A] mb-2 block">טווח גיל</Label>
                <div className="flex items-center gap-3" dir="ltr">
                  {(['age_min', 'age_max'] as const).map((key, ki) => (
                    <div key={key} className="flex-1 space-y-1">
                      <span className="text-xs text-[#A3A3A3]">{ki === 0 ? 'מ-' : 'עד'}</span>
                      <Select value={String(filters[key])} onValueChange={v => setFilters(f => ({ ...f, [key]: Number(v) }))}>
                        <SelectTrigger className="h-9 rounded-xl border-[#E5E5E5]"><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({ length: 53 }, (_, i) => i + 18).map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              {[
                { label: 'רמה דתית', key: 'religious_levels' as const, opts: ['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'], labels: { hiloni: 'חילוני', masorti: 'מסורתי', dati_light: 'דתי-לייט', dati: 'דתי', haredi: 'חרדי' } },
                { label: 'רקע קהילתי', key: 'community_backgrounds' as const, opts: ['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed'], labels: { ashkenazi: 'אשכנזי', sephardic: 'ספרדי', mizrahi: 'מזרחי', yemenite: 'תימני', mixed: 'מעורב' } },
              ].map(({ label, key, opts, labels }) => (
                <div key={key}>
                  <Label className="text-sm font-semibold text-[#0A0A0A] mb-2 block">{label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {opts.map(o => {
                      const sel = (filters[key] as string[] | undefined)?.includes(o)
                      return (
                        <button key={o} onClick={() => setFilters(f => ({ ...f, [key]: sel ? (f[key] as string[]).filter(x => x !== o) : [...(f[key] as string[] || []), o] }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${sel ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'}`}>
                          {(labels as unknown as Record<string, string>)[o]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="space-y-3 bg-[#F5F5F5] rounded-2xl p-4">
                {[{ k: 'shomer_shabbat_only', l: 'שומר/ת שבת בלבד' }, { k: 'verified_only', l: 'מאומתים בלבד' }].map(({ k, l }, i, arr) => (
                  <div key={k}>
                    <div className="flex items-center justify-between" dir="ltr">
                      <Switch checked={!!(filters as Record<string, unknown>)[k]} onCheckedChange={v => setFilters(f => ({ ...f, [k]: v }))} />
                      <Label className="text-sm text-[#0A0A0A]">{l}</Label>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-[#E5E5E5] mt-3" />}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-2xl border-[#E5E5E5]"><X className="w-4 h-4 me-1.5" />נקה</Button>
                <Button onClick={applyFilters} className="flex-1 bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl"><Search className="w-4 h-4 me-1.5" />הצג תוצאות</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
