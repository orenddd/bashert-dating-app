'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchDiscoverProfiles } from '@/lib/api/profiles'
import { sendLike, removeLike, isLiked } from '@/lib/api/likes'
import { fetchSentRequestsMap, type SentStatusMap } from '@/lib/api/messages'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import { Shield, MapPin, SlidersHorizontal, Heart, MessageCircle, RefreshCw, X, Search, Clock, CheckCircle2, Ruler, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import type { SearchFilters } from '@/lib/types/forms'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAge(profile: DbProfile): string {
  if (profile.birth_year) return String(new Date().getFullYear() - profile.birth_year)
  if (profile.date_of_birth) {
    const birth = new Date(profile.date_of_birth)
    let age = new Date().getFullYear() - birth.getFullYear()
    const m = new Date().getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < birth.getDate())) age--
    return String(age)
  }
  return ''
}

const RELIGIOUS_LABELS: Record<string, string> = {
  hiloni: 'חילוני', masorti: 'מסורתי', dati_light: 'דתי-לייט', dati: 'דתי', haredi: 'חרדי',
}

const REL_GOAL_LABELS: Record<string, string> = {
  marriage: 'נישואים', serious: 'רציני', dating: 'היכרות', friendship: 'חברות',
  not_sure: 'עדיין לא יודע/ת', open: 'פתוח/ה',
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({
  profile, photos, idx, isLikedState, sentStatus, onLike, onMessage,
}: {
  profile: DbProfile; photos: DbPhoto[]; idx: number
  isLikedState: boolean; sentStatus: SentStatusMap[string] | undefined
  onLike: () => void; onMessage: () => void
}) {
  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0]
  const age = getAge(profile)
  const additionalPhotos = photos.filter(p => !p.is_primary && p.media_type === 'image').slice(0, 3)

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow">

      {/* תמונה ראשית */}
      <Link href={`/profile/${profile.user_id}`} className="block relative">
        <div className="relative aspect-[4/3] bg-[#F5F5F5]">
          {primaryPhoto ? (
            <img src={primaryPhoto.url} alt={profile.first_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl text-[#D4D4D4]">👤</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* שם + גיל */}
          <div className="absolute bottom-4 start-4 end-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white text-2xl font-bold">
                  {profile.first_name}{age ? `, ${age}` : ''}
                </h2>
                {profile.city && (
                  <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{profile.city}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {profile.is_online && (
                  <span className="flex items-center gap-1 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />מחובר/ת
                  </span>
                )}
                {profile.is_verified && (
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" />מאומת
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* תמונות נוספות */}
        {additionalPhotos.length > 0 && (
          <div className="grid gap-0.5 bg-[#E5E5E5]" style={{ gridTemplateColumns: `repeat(${additionalPhotos.length}, 1fr)` }}>
            {additionalPhotos.map((photo) => (
              <div key={photo.id} className="aspect-square">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </Link>

      {/* פרטים */}
      <div className="p-4 space-y-3">

        {/* תגיות מפתח */}
        <div className="flex flex-wrap gap-2">
          {profile.religious_level && (
            <span className="bg-[#F5F5F5] text-[#0A0A0A] text-xs font-medium px-3 py-1 rounded-full">
              {RELIGIOUS_LABELS[profile.religious_level] ?? profile.religious_level}
            </span>
          )}
          {profile.height_cm && (
            <span className="bg-[#F5F5F5] text-[#737373] text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <Ruler className="w-3 h-3" />{profile.height_cm} ס״מ
            </span>
          )}
          {profile.marital_status && profile.marital_status !== 'single' && (
            <span className="bg-[#F5F5F5] text-[#737373] text-xs px-3 py-1 rounded-full">
              {profile.marital_status === 'divorced' ? 'גרוש/ה' : 'אלמן/ה'}
            </span>
          )}
          {profile.relationship_goal?.slice(0, 1).map(g => (
            <span key={g} className="bg-[#0A0A0A] text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Target className="w-3 h-3" />{REL_GOAL_LABELS[g] ?? g}
            </span>
          ))}
        </div>

        {/* ביו */}
        {profile.bio && (
          <p className="text-[#0A0A0A] text-sm leading-relaxed line-clamp-3">{profile.bio}</p>
        )}

        {/* שאלה פתוחה — מה מחפש/ת */}
        {(profile.open_questions as Record<string, string>)?.seeking && (
          <div className="bg-[#F5F5F5] rounded-2xl p-3">
            <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wide mb-1">מחפש/ת</p>
            <p className="text-[#0A0A0A] text-sm leading-relaxed line-clamp-2">
              {(profile.open_questions as Record<string, string>).seeking}
            </p>
          </div>
        )}

        {/* שפות */}
        {profile.languages?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map(lang => (
              <span key={lang} className="text-[#737373] text-xs px-2.5 py-1 rounded-full border border-[#E5E5E5]">
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* תחביבים */}
        {profile.hobbies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.hobbies.slice(0, 5).map(h => (
              <span key={h} className="text-[#737373] text-xs px-2.5 py-1 rounded-full border border-[#E5E5E5]">
                {h}
              </span>
            ))}
            {profile.hobbies.length > 5 && (
              <span className="text-[#A3A3A3] text-xs px-2.5 py-1">+{profile.hobbies.length - 5}</span>
            )}
          </div>
        )}

        {/* כפתורי פעולה */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onLike}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium transition-all border',
              isLikedState
                ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
            )}
          >
            <Heart className={cn('w-4 h-4', isLikedState && 'fill-white')} />
            {isLikedState ? 'אהבתי ♥' : 'שלח לב'}
          </button>

          {!sentStatus ? (
            <button
              onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium bg-[#0A0A0A] text-white hover:bg-[#222] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              הודעה
            </button>
          ) : sentStatus.status === 'pending' ? (
            <button
              onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium border border-amber-300 text-amber-700 bg-amber-50"
            >
              <Clock className="w-4 h-4" />
              ממתין לאישור
            </button>
          ) : sentStatus.status === 'accepted' && sentStatus.conversation_id ? (
            <Link
              href={`/messages/${sentStatus.conversation_id}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium border border-emerald-300 text-emerald-700 bg-emerald-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              המשך שיחה
            </Link>
          ) : (
            <button
              onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium bg-[#0A0A0A] text-white hover:bg-[#222]"
            >
              <MessageCircle className="w-4 h-4" />
              הודעה
            </button>
          )}

          <Link
            href={`/profile/${profile.user_id}`}
            className="h-10 px-4 flex items-center justify-center rounded-2xl border border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A] hover:text-[#0A0A0A] text-sm transition-all"
          >
            פרופיל מלא ↗
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Partial<SearchFilters> & { hide_messaged?: boolean } = {
  age_min: 18, age_max: 70,
  religious_levels: [],
  community_backgrounds: [],
  shomer_shabbat_only: false,
  verified_only: false,
  has_photos_only: false,
  hide_messaged: false,
}

export default function DiscoverPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState<{ profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sentMap, setSentMap] = useState<SentStatusMap>({})
  const [messagingTarget, setMessagingTarget] = useState<{ profile: DbProfile; photos: DbPhoto[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<typeof DEFAULT_FILTERS>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<typeof DEFAULT_FILTERS>(DEFAULT_FILTERS)

  const loadProfiles = async (f: typeof DEFAULT_FILTERS) => {
    if (!user) return
    setLoading(true)
    const [data, map] = await Promise.all([
      fetchDiscoverProfiles(user.id, f),
      fetchSentRequestsMap(user.id),
    ])
    setSentMap(map)
    setItems(data)
    const likedSet = new Set<string>()
    await Promise.all(data.map(async ({ profile }) => {
      const already = await isLiked(user.id, profile.user_id)
      if (already) likedSet.add(profile.user_id)
    }))
    setLiked(likedSet)
    setLoading(false)
  }

  useEffect(() => {
    loadProfiles(appliedFilters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, appliedFilters])

  const applyFilters = () => { setAppliedFilters(filters); setFilterOpen(false) }
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setFilterOpen(false) }

  const displayItems = appliedFilters.hide_messaged
    ? items.filter(({ profile }) => { const s = sentMap[profile.user_id]; return !s || s.status === 'declined' })
    : items

  const activeFilterCount = [
    appliedFilters.shomer_shabbat_only,
    appliedFilters.verified_only,
    (appliedFilters.religious_levels?.length ?? 0) > 0,
    (appliedFilters.community_backgrounds?.length ?? 0) > 0,
    appliedFilters.hide_messaged,
  ].filter(Boolean).length

  const handleLike = async (profile: DbProfile) => {
    if (!user) return
    const isNowLiked = !liked.has(profile.user_id)
    setLiked(prev => { const s = new Set(prev); isNowLiked ? s.add(profile.user_id) : s.delete(profile.user_id); return s })
    if (isNowLiked) {
      await sendLike(user.id, profile.user_id)
      toast.success(`שלחת לב ל-${profile.first_name} ❤️`, { duration: 1800 })
    } else {
      await removeLike(user.id, profile.user_id)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">גלה פרופילים</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {loading ? 'טוען...' : `${displayItems.length} פרופילים`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadProfiles(appliedFilters)}
            className="border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(true)}
            className="relative gap-1.5 border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl"
          >
            <SlidersHorizontal className="w-4 h-4" />
            מסננים
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-[#0A0A0A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

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
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-[#A3A3A3]">מ-</span>
                    <Select value={String(filters.age_min)} onValueChange={v => setFilters(f => ({ ...f, age_min: Number(v) }))}>
                      <SelectTrigger className="h-9 rounded-xl border-[#E5E5E5]"><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from({ length: 53 }, (_, i) => i + 18).map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <span className="text-[#D4D4D4] pt-5">—</span>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-[#A3A3A3]">עד</span>
                    <Select value={String(filters.age_max)} onValueChange={v => setFilters(f => ({ ...f, age_max: Number(v) }))}>
                      <SelectTrigger className="h-9 rounded-xl border-[#E5E5E5]"><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from({ length: 53 }, (_, i) => i + 18).map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-[#0A0A0A] mb-2 block">רמה דתית</Label>
                <div className="flex flex-wrap gap-2">
                  {(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'] as const).map(r => {
                    const selected = filters.religious_levels?.includes(r)
                    const labels = { hiloni: 'חילוני', masorti: 'מסורתי', dati_light: 'דתי-לייט', dati: 'דתי', haredi: 'חרדי' }
                    return (
                      <button key={r} onClick={() => setFilters(f => ({ ...f, religious_levels: selected ? (f.religious_levels ?? []).filter(x => x !== r) : [...(f.religious_levels ?? []), r] }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'}`}>
                        {labels[r]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-[#0A0A0A] mb-2 block">רקע קהילתי</Label>
                <div className="flex flex-wrap gap-2">
                  {(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed'] as const).map(c => {
                    const selected = filters.community_backgrounds?.includes(c)
                    const labels = { ashkenazi: 'אשכנזי', sephardic: 'ספרדי', mizrahi: 'מזרחי', yemenite: 'תימני', mixed: 'מעורב' }
                    return (
                      <button key={c} onClick={() => setFilters(f => ({ ...f, community_backgrounds: selected ? (f.community_backgrounds ?? []).filter(x => x !== c) : [...(f.community_backgrounds ?? []), c] }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'}`}>
                        {labels[c]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3 bg-[#F5F5F5] rounded-2xl p-4">
                {[
                  { key: 'shomer_shabbat_only' as const, label: 'שומר/ת שבת בלבד' },
                  { key: 'verified_only' as const, label: 'מאומתים בלבד' },
                  { key: 'hide_messaged' as const, label: 'הסתר שהודעתי כבר' },
                ].map(({ key, label }, i, arr) => (
                  <div key={key}>
                    <div className="flex items-center justify-between" dir="ltr">
                      <Switch checked={!!filters[key]} onCheckedChange={v => setFilters(f => ({ ...f, [key]: v }))} />
                      <Label className="text-sm text-[#0A0A0A]">{label}</Label>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-[#E5E5E5] mt-3" />}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-2xl border-[#E5E5E5]">
                  <X className="w-4 h-4 me-1.5" />נקה
                </Button>
                <Button onClick={applyFilters} className="flex-1 bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl">
                  <Search className="w-4 h-4 me-1.5" />הצג תוצאות
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-[#F5F5F5]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
                <div className="h-3 bg-[#F5F5F5] rounded w-full" />
                <div className="h-3 bg-[#F5F5F5] rounded w-2/3" />
                <div className="h-10 bg-[#F5F5F5] rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-[#0A0A0A] font-bold text-lg">לא נמצאו פרופילים</p>
          <p className="text-[#737373] text-sm mt-2">נסה לשנות את הסינון</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-2xl border-[#E5E5E5]">
            נקה מסננים
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map(({ profile, photos }, i) => (
            <ProfileCard
              key={profile.user_id}
              profile={profile}
              photos={photos}
              idx={i}
              isLikedState={liked.has(profile.user_id)}
              sentStatus={sentMap[profile.user_id]}
              onLike={() => handleLike(profile)}
              onMessage={() => setMessagingTarget({ profile, photos })}
            />
          ))}

          <div className="text-center pt-4 pb-8">
            <Button variant="outline" onClick={() => loadProfiles(appliedFilters)}
              className="gap-2 border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl">
              <RefreshCw className="w-4 h-4" />רענן פרופילים
            </Button>
          </div>
        </div>
      )}

      {messagingTarget && (
        <SendMessageDialog
          open={true}
          onClose={() => setMessagingTarget(null)}
          profile={messagingTarget.profile}
          photos={messagingTarget.photos}
        />
      )}
    </div>
  )
}
