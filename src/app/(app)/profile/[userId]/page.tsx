'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { fetchProfile } from '@/lib/api/profiles'
import { sendLike, removeLike, isLiked } from '@/lib/api/likes'
import { JewishAttributesBadges } from '@/components/profile/JewishAttributesBadges'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import { calcAge, formatHeight } from '@/lib/utils/age'
import {
  Shield, MapPin, Heart, Star, MessageCircle,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Languages, Home, Sparkles, CalendarHeart, Sun
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/shared/AuthProvider'
import type { DbProfile, DbPhoto } from '@/lib/types/database'

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

const MARITAL_STATUS: Record<string, string> = {
  single: 'רווק/ה',
  divorced: 'גרוש/ה',
  widowed: 'אלמן/ה',
}

const RELIGIOUS_LEVEL: Record<string, string> = {
  hiloni: '☀️ חילוני',
  hiloni_heart: '💙 יהודי בלב',
  masorti: '🕎 מסורתי',
  masorti_lite: '🍷 מסורתי לייט',
  dati_light: '📖 דתי לייט',
  dati: '✡️ דתי',
  haredi: '⚫ חרדי',
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

const LANGUAGES: Record<string, string> = {
  he: '🇮🇱 עברית', en: '🇺🇸 אנגלית', ar: '🌙 ערבית', ru: '🇷🇺 רוסית',
  es: '🇪🇸 ספרדית', fr: '🇫🇷 צרפתית', am: '🇪🇹 אמהרית', yi: '✡️ יידיש',
  fa: '🇮🇷 פרסית', pt: '🇧🇷 פורטוגזית', de: '🇩🇪 גרמנית', it: '🇮🇹 איטלקית',
  buh: '🇺🇿 בוכרית', ka: '🇬🇪 גרוזינית',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-[rgba(23,20,17,0.45)]" />}
      <h3 className="font-bold text-[#171411] text-sm">{children}</h3>
    </div>
  )
}

function ChipRow({ values, map }: { values: string[]; map: Record<string, string> }) {
  const labels = values.map(v => map[v]).filter(Boolean)
  if (!labels.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(label => (
        <span key={label} className="bg-[#EBE4D2] text-[#171411] text-xs px-3 py-1.5 rounded-full font-medium">
          {label}
        </span>
      ))}
    </div>
  )
}

function OpenQuestion({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null
  return (
    <div className="bg-[#EBE4D2] rounded-2xl p-4">
      <p className="text-xs text-[rgba(23,20,17,0.45)] mb-1.5 font-medium">{label}</p>
      <p className="text-[#171411] text-sm leading-relaxed">{value}</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { t, isRTL } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  // בשלב זה ניתן לצפות רק בפרופיל האישי (תצוגה מקדימה). פרופילים אחרים חסומים.
  const isOwnProfile = !!user && userId === user.id
  useEffect(() => {
    if (user && !isOwnProfile) {
      router.replace('/home')
    }
  }, [user, isOwnProfile, router])

  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [photos, setPhotos] = useState<DbPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [liked, setLiked] = useState(false)
  const [superLiked, setSuperLiked] = useState(false)
  const [messagingOpen, setMessagingOpen] = useState(false)

  const BackArrow = isRTL ? ArrowRight : ArrowLeft

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
      <div className="max-w-2xl mx-auto pb-20 md:pb-6 animate-pulse">
        <div className="m-4 h-[420px] bg-[#EBE4D2] rounded-3xl" />
        <div className="px-5 pt-5 space-y-4">
          <div className="h-8 bg-[#EBE4D2] rounded w-1/2" />
          <div className="h-12 bg-[#EBE4D2] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">פרופיל לא נמצא</p>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/profile/me">חזור לפרופיל שלי</Link>
        </Button>
      </div>
    )
  }

  const age = calcAge(profile.date_of_birth)
  const photoUrl = photos[photoIdx]?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/600/800`
  const oq = profile.open_questions ?? {}

  const handleLike = async () => {
    if (!user) return
    if (liked) {
      await removeLike(user.id, profile.user_id)
      setLiked(false)
      setSuperLiked(false)
    } else {
      await sendLike(user.id, profile.user_id, false)
      setLiked(true)
      toast.success(`❤️ לייקת את ${profile.first_name}!`, { description: 'הם יקבלו התראה', duration: 2000 })
    }
  }

  const handleSuperLike = async () => {
    if (!user || superLiked) return
    await sendLike(user.id, profile.user_id, true)
    setLiked(true)
    setSuperLiked(true)
    toast('⭐ סופר לייק נשלח!', { description: `${profile.first_name} יקבל/תקבל התראה מיוחדת`, duration: 3000 })
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-6">
      {/* Back button */}
      <div className="p-4 pt-3">
        <Button variant="ghost" asChild size="sm" className="rounded-2xl text-gray-600 hover:text-[#171411]">
          <Link href="/profile/me">
            <BackArrow className="w-4 h-4 me-2" />
            {t.common.back}
          </Link>
        </Button>
      </div>

      {/* Photo gallery */}
      <div className="relative h-[420px] md:h-[520px] mx-4 rounded-3xl overflow-hidden bg-[#EBE4D2]">
        <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" />

        {photos.length > 1 && (
          <div className="absolute top-4 start-4 end-4 flex gap-1">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={cn('h-[3px] flex-1 rounded-full transition-all', i === photoIdx ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        )}
        {photos.length > 1 && photoIdx > 0 && (
          <button onClick={() => setPhotoIdx(i => i - 1)}
            className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {photos.length > 1 && photoIdx < photos.length - 1 && (
          <button onClick={() => setPhotoIdx(i => i + 1)}
            className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            {profile.is_online && (
              <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm border border-green-400/30 px-3 py-1 rounded-full w-fit">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-white font-medium">{t.profile.online}</span>
              </div>
            )}
            {profile.subscription_tier !== 'free' && (
              <Badge className="bg-[#2E5A7C] text-white border-0 text-xs w-fit">
                {profile.subscription_tier === 'platinum' ? '💎 Platinum' : '✨ Gold'}
              </Badge>
            )}
          </div>
          {profile.is_verified && (
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-300 fill-blue-300" />
              <span className="text-xs text-white font-medium">{t.profile.verified}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Name & basic info */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-3xl font-black text-[#171411] tracking-tight">
              {profile.first_name} {profile.last_name[0]}.
            </h1>
            <span className="text-2xl font-light text-[rgba(23,20,17,0.40)]">{age}</span>
            {profile.is_verified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400" />}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            {profile.height_cm && (
              <span className="text-[rgba(23,20,17,0.55)] text-sm">{formatHeight(profile.height_cm)}</span>
            )}
            {profile.marital_status && (
              <span className="text-[rgba(23,20,17,0.55)] text-sm">{MARITAL_STATUS[profile.marital_status]}</span>
            )}
            {profile.children_count > 0 && (
              <span className="text-[rgba(23,20,17,0.55)] text-sm">
                👶 {profile.children_count === 1 ? 'ילד אחד' : `${profile.children_count} ילדים`}
              </span>
            )}
            {profile.city && (
              <span className="text-[rgba(23,20,17,0.55)] text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.city}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            className={cn('flex-1 rounded-2xl font-bold transition-all',
              liked ? 'bg-[#B8472A] text-white hover:bg-[#7A2E18]'
                : 'bg-[#EBE4D2] text-[rgba(23,20,17,0.65)] hover:bg-[#B8472A] hover:text-white'
            )}
            onClick={handleLike}
          >
            <Heart className={cn('w-4 h-4 me-2', liked && 'fill-white')} />
            {liked ? '❤️ לייקת!' : t.common.like}
          </Button>
          <Button
            className="flex-1 bg-[#171411] hover:bg-[#2A2520] text-[#F2EDDF] rounded-2xl font-bold"
            onClick={() => setMessagingOpen(true)}
          >
            <MessageCircle className="w-4 h-4 me-2" />
            {t.common.message}
          </Button>
          <Button
            variant="outline"
            className={cn('w-12 h-12 rounded-2xl p-0 transition-all border-[rgba(23,20,17,0.15)]',
              superLiked ? 'bg-[#171411] text-[#F2EDDF] border-[#171411]' : 'text-[rgba(23,20,17,0.55)] hover:bg-[rgba(23,20,17,0.06)]'
            )}
            onClick={handleSuperLike} title={t.common.super_like}
          >
            <Star className={cn('w-5 h-5', superLiked ? 'fill-[#F2EDDF]' : '')} />
          </Button>
        </div>

        {/* Relationship goals */}
        {profile.relationship_goal?.length > 0 && (
          <div>
            <SectionTitle icon={CalendarHeart}>מחפש/ת</SectionTitle>
            <ChipRow values={profile.relationship_goal} map={RELATIONSHIP_GOAL} />
            {profile.children_future && (
              <div className="mt-2">
                <span className="bg-[#EBE4D2] text-[#171411] text-xs px-3 py-1.5 rounded-full font-medium">
                  {CHILDREN_FUTURE[profile.children_future]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {(oq.bio || profile.bio) && (
          <div>
            <SectionTitle>{t.profile.about}</SectionTitle>
            <p className="text-[rgba(23,20,17,0.70)] leading-relaxed text-sm">{oq.bio || profile.bio}</p>
          </div>
        )}

        {/* Key open questions */}
        {(oq.seeking || oq.dealbreaker || oq.work) && (
          <div className="space-y-3">
            <OpenQuestion label="מה אני מחפש/ת בזוגיות?" value={oq.seeking} />
            <OpenQuestion label="הדיל ברייקר שלי" value={oq.dealbreaker} />
            <OpenQuestion label="מה אני עושה בחיים?" value={oq.work} />
          </div>
        )}

        {/* Jewish attributes */}
        <div className="bg-[#EBE4D2] rounded-2xl p-4 border border-[rgba(23,20,17,0.06)]">
          <SectionTitle>{t.religious.level_label}</SectionTitle>
          {profile.religious_level && (
            <p className="text-sm font-medium text-[#171411] mb-2">{RELIGIOUS_LEVEL[profile.religious_level]}</p>
          )}
          <JewishAttributesBadges profile={profile} />
        </div>

        {/* Lifestyle: friday / saturday / romantic */}
        {(profile.friday_night?.length > 0 || profile.saturday_morning?.length > 0 || profile.romantic_vision?.length > 0) && (
          <div>
            <SectionTitle icon={Sun}>אורח חיים</SectionTitle>
            <div className="space-y-3">
              {profile.friday_night?.length > 0 && (
                <div>
                  <p className="text-xs text-[rgba(23,20,17,0.45)] mb-1.5">שישי בערב</p>
                  <ChipRow values={profile.friday_night} map={FRIDAY_NIGHT} />
                </div>
              )}
              {profile.saturday_morning?.length > 0 && (
                <div>
                  <p className="text-xs text-[rgba(23,20,17,0.45)] mb-1.5">שבת בבוקר</p>
                  <ChipRow values={profile.saturday_morning} map={SATURDAY_MORNING} />
                </div>
              )}
              {profile.romantic_vision?.length > 0 && (
                <div>
                  <p className="text-xs text-[rgba(23,20,17,0.45)] mb-1.5">רומנטי בעיניי</p>
                  <ChipRow values={profile.romantic_vision} map={ROMANTIC_VISION} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {profile.hobbies?.length > 0 && (
          <div>
            <SectionTitle icon={Sparkles}>תחביבים</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map(h => (
                <span key={h} className="bg-[#EBE4D2] text-[#171411] text-xs px-3 py-1.5 rounded-full font-medium">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Languages + Residence */}
        {(profile.languages?.length > 0 || profile.residence_intent?.length > 0) && (
          <div className="space-y-4">
            {profile.languages?.length > 0 && (
              <div>
                <SectionTitle icon={Languages}>שפות</SectionTitle>
                <ChipRow values={profile.languages} map={LANGUAGES} />
              </div>
            )}
            {profile.residence_intent?.length > 0 && (
              <div>
                <SectionTitle icon={Home}>כוונות מגורים</SectionTitle>
                <ChipRow values={profile.residence_intent} map={RESIDENCE_INTENT} />
              </div>
            )}
          </div>
        )}

        {/* More open questions */}
        {(oq.quote || oq.loves || oq.strength || oq.future_self || oq.future_us) && (
          <div className="space-y-3">
            <SectionTitle>עוד עליי</SectionTitle>
            <OpenQuestion label="משפט לחיים" value={oq.quote} />
            <OpenQuestion label="הנה כמה דברים שאני אוהב/ת" value={oq.loves} />
            <OpenQuestion label="החוזקה הכי גדולה שלי" value={oq.strength} />
            <OpenQuestion label="איך אני רואה את העתיד שלי" value={oq.future_self} />
            <OpenQuestion label="איך אני רואה את העתיד שלנו" value={oq.future_us} />
          </div>
        )}

        {/* Fun questions */}
        {(oq.lie || oq.movie || oq.crazy || oq.first_impression || oq.song || oq.weird_habit || oq.childish || oq.food) && (
          <div className="space-y-3">
            <SectionTitle>שאלות כיף 🎉</SectionTitle>
            <OpenQuestion label="שקר שאני אוהב/ת לספר" value={oq.lie} />
            <OpenQuestion label="אם היו עושים עליי סרט — שמו היה" value={oq.movie} />
            <OpenQuestion label="הדבר הכי לא הגיוני שעשיתי" value={oq.crazy} />
            <OpenQuestion label="מה הדבר הראשון שאנשים חושבים עליי?" value={oq.first_impression} />
            <OpenQuestion label="שיר שהוא נושא החיים שלי" value={oq.song} />
            <OpenQuestion label="ההרגל הכי מוזר שלי" value={oq.weird_habit} />
            <OpenQuestion label="הדבר הכי ילדותי שאני עדיין עושה" value={oq.childish} />
            <OpenQuestion label="אוכל שאני יכול/ה לאכול כל יום" value={oq.food} />
          </div>
        )}
      </div>

      <SendMessageDialog
        open={messagingOpen}
        onClose={() => setMessagingOpen(false)}
        profile={profile}
        photos={photos}
      />
    </div>
  )
}
