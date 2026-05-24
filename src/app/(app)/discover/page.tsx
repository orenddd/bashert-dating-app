'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchDiscoverProfiles } from '@/lib/api/profiles'
import { sendLike, removeLike, isLiked } from '@/lib/api/likes'
import { fetchSentRequestsMap, type SentStatusMap } from '@/lib/api/messages'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import { calcAge } from '@/lib/utils/age'
import { Shield, MapPin, SlidersHorizontal, Heart, MessageCircle, RefreshCw, X, Search, Clock, CheckCircle2 } from 'lucide-react'
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

const DEFAULT_FILTERS: Partial<SearchFilters> & { hide_messaged?: boolean } = {
  age_min: 18, age_max: 70,
  religious_levels: [],
  community_backgrounds: [],
  shomer_shabbat_only: false,
  verified_only: false,
  has_photos_only: false,
  hide_messaged: false,
}

const RELIGIOUS_LABELS: Record<string, string> = {
  hiloni: 'חילוני',
  masorti: 'מסורתי',
  dati_light: 'דתי-לייט',
  dati: 'דתי',
  haredi: 'חרדי',
}

const PHOTO_TONES: [string, string][] = [
  ['#D9CFC2', '#A89A88'],
  ['#B8C5D1', '#7E92A8'],
  ['#CFC4D6', '#9788A6'],
  ['#C8B89E', '#8A7657'],
  ['#E0CFC0', '#B59880'],
  ['#BFB098', '#8B7355'],
]

function PhotoBg({ idx, className }: { idx: number; className?: string }) {
  const [a, b] = PHOTO_TONES[idx % PHOTO_TONES.length]
  return (
    <div className={className} style={{ background: `linear-gradient(165deg, ${a} 0%, ${b} 100%)` }}>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 1.5px)', backgroundSize: '4px 4px' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,235,200,0.10) 0%, transparent 40%, rgba(0,0,0,0.20) 100%)' }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full opacity-30">
        <circle cx="50" cy="38" r="14" fill="rgba(0,0,0,0.45)" />
        <path d="M16,100 C18,72 32,58 50,58 C68,58 82,72 84,100 Z" fill="rgba(0,0,0,0.45)" />
      </svg>
    </div>
  )
}

function MessageButton({
  sentStatus,
  onMessage,
}: {
  sentStatus: SentStatusMap[string] | undefined
  onMessage: () => void
}) {
  if (!sentStatus) {
    return (
      <button
        onClick={onMessage}
        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium bg-[#171411] text-[#F2EDDF] hover:bg-[#2A2520] transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>הודעה</span>
      </button>
    )
  }
  if (sentStatus.status === 'pending') {
    return (
      <button
        onClick={onMessage}
        title="לחץ לשלוח הודעה נוספת"
        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>ממתין</span>
      </button>
    )
  }
  if (sentStatus.status === 'accepted' && sentStatus.conversation_id) {
    return (
      <Link
        href={`/messages/${sentStatus.conversation_id}`}
        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>שיחה</span>
      </Link>
    )
  }
  // declined → allow re-send
  return (
    <button
      onClick={onMessage}
      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium bg-[#171411] text-[#F2EDDF] hover:bg-[#2A2520] transition-colors"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span>הודעה</span>
    </button>
  )
}

function ProfileCard({
  profile,
  photos,
  idx,
  isLikedState,
  sentStatus,
  onLike,
  onMessage,
  featured = false,
}: {
  profile: DbProfile
  photos: DbPhoto[]
  idx: number
  isLikedState: boolean
  sentStatus: SentStatusMap[string] | undefined
  onLike: () => void
  onMessage: () => void
  featured?: boolean
}) {
  const age = calcAge(profile.date_of_birth)
  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0]

  return (
    <div className={cn(
      'group bg-[#FBF6E8] rounded-2xl overflow-hidden border border-[rgba(23,20,17,0.08)] transition-all hover:shadow-lg hover:shadow-[rgba(23,20,17,0.08)] hover:-translate-y-0.5',
      featured && 'md:col-span-2 md:flex'
    )}>
      <div className={cn(
        'relative overflow-hidden',
        featured ? 'md:w-64 md:flex-shrink-0 aspect-[3/4] md:aspect-auto' : 'aspect-[3/4]'
      )}>
        {primaryPhoto ? (
          <img src={primaryPhoto.url} alt={profile.first_name} className="w-full h-full object-cover" />
        ) : (
          <PhotoBg idx={idx} className="absolute inset-0" />
        )}

        <div className="absolute top-3 start-3 flex items-center gap-1 bg-[rgba(23,20,17,0.55)] backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
          <MapPin className="w-2.5 h-2.5" />
          <span className="text-[10px] font-medium tracking-wide">{profile.city}</span>
        </div>

        {profile.is_online && (
          <div className="absolute top-3 end-3 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        )}
        {sentStatus?.status === 'pending' && (
          <div className="absolute top-3 end-3 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5" /> ממתין
          </div>
        )}
        {sentStatus?.status === 'accepted' && (
          <div className="absolute top-3 end-3 flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" /> שיחה פעילה
          </div>
        )}
        {profile.subscription_tier !== 'free' && !sentStatus && (
          <div className="absolute bottom-3 start-3 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: profile.subscription_tier === 'platinum' ? 'rgba(46,90,124,0.85)' : 'rgba(184,71,42,0.85)', color: '#fff' }}>
            {profile.subscription_tier === 'platinum' ? 'Platinum' : 'Gold'}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-3 text-white">
          <div className="font-serif font-bold text-xl leading-tight">{profile.first_name}, {age}</div>
          {profile.occupation && <div className="text-xs text-white/80 mt-0.5 font-medium tracking-wide">{profile.occupation}</div>}
        </div>
      </div>

      <div className={cn('p-4 flex flex-col gap-3', featured && 'md:flex-1')}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#EBE4D2] text-[rgba(23,20,17,0.65)]">
            {RELIGIOUS_LABELS[profile.religious_level] ?? profile.religious_level}
          </span>
          {profile.is_verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2E5A7C]">
              <Shield className="w-3 h-3 fill-[#2E5A7C]" />
              מאומת
            </span>
          )}
        </div>

        {profile.bio && (
          <p className={cn('font-serif text-[#171411] leading-snug', featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2')}>
            {profile.bio}
          </p>
        )}

        <div className="flex gap-2 mt-auto">
          <button
            onClick={onLike}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-all border',
              isLikedState
                ? 'bg-[#B8472A] border-[#B8472A] text-white'
                : 'bg-transparent border-[rgba(23,20,17,0.15)] text-[#B8472A] hover:border-[#B8472A] hover:bg-[#F2D9CE]'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isLikedState && 'fill-white')} />
            <span>{isLikedState ? 'אהבתי' : 'לב'}</span>
          </button>
          <MessageButton sentStatus={sentStatus} onMessage={onMessage} />
          <Link
            href={`/profile/${profile.user_id}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(23,20,17,0.12)] text-[rgba(23,20,17,0.45)] hover:border-[rgba(23,20,17,0.30)] hover:text-[#171411] transition-all text-xs font-mono"
          >
            ↗
          </Link>
        </div>
      </div>
    </div>
  )
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
      const isAlreadyLiked = await isLiked(user.id, profile.user_id)
      if (isAlreadyLiked) likedSet.add(profile.user_id)
    }))
    setLiked(likedSet)
    setLoading(false)
  }

  useEffect(() => {
    loadProfiles(appliedFilters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, appliedFilters])

  const applyFilters = () => {
    setAppliedFilters(filters)
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setFilterOpen(false)
  }

  // Client-side filter for hide_messaged
  const displayItems = appliedFilters.hide_messaged
    ? items.filter(({ profile }) => {
        const s = sentMap[profile.user_id]
        return !s || s.status === 'declined'
      })
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
    setLiked(prev => {
      const s = new Set(prev)
      if (isNowLiked) s.add(profile.user_id); else s.delete(profile.user_id)
      return s
    })
    if (isNowLiked) {
      await sendLike(user.id, profile.user_id)
      toast.success(`שלחת לב ל-${profile.first_name}`, { duration: 1800 })
    } else {
      await removeLike(user.id, profile.user_id)
    }
  }

  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-[rgba(23,20,17,0.10)]">
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#B8472A] mb-1">{today}</p>
          <h1 className="font-serif text-3xl font-black text-[#171411] leading-none tracking-tight">גילוי</h1>
          <p className="text-sm text-[rgba(23,20,17,0.50)] mt-1 font-sans">
            {loading ? 'טוען פרופילים...' : `${displayItems.length} פרופילים`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className="relative gap-1.5 border-[rgba(23,20,17,0.15)] text-[rgba(23,20,17,0.65)] hover:text-[#171411] hover:border-[rgba(23,20,17,0.30)] bg-transparent rounded-xl"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          מסננים
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-[#B8472A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-4 pb-6">
            <div className="max-w-lg mx-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center text-base font-bold text-[#171411]">סינון פרופילים</SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* גיל */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">טווח גיל</Label>
                  <div className="flex items-center gap-3" dir="ltr">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">מ-</span>
                      <Select value={String(filters.age_min)} onValueChange={v => setFilters(f => ({ ...f, age_min: Number(v) }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 53 }, (_, i) => i + 18).map(age => (
                            <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-gray-300 pt-5">—</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">עד</span>
                      <Select value={String(filters.age_max)} onValueChange={v => setFilters(f => ({ ...f, age_max: Number(v) }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 53 }, (_, i) => i + 18).map(age => (
                            <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* רמה דתית */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">רמה דתית</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'] as const).map(r => {
                      const selected = filters.religious_levels?.includes(r)
                      const labels = { hiloni: 'חילוני', masorti: 'מסורתי', dati_light: 'דתי-לייט', dati: 'דתי', haredi: 'חרדי' }
                      return (
                        <button
                          key={r}
                          onClick={() => setFilters(f => ({
                            ...f,
                            religious_levels: selected
                              ? (f.religious_levels ?? []).filter(x => x !== r)
                              : [...(f.religious_levels ?? []), r]
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#171411] text-white border-[#171411]' : 'border-[rgba(23,20,17,0.15)] text-[#171411] hover:border-[rgba(23,20,17,0.4)]'}`}
                        >
                          {labels[r]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* רקע קהילתי */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">רקע קהילתי</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed'] as const).map(c => {
                      const selected = filters.community_backgrounds?.includes(c)
                      const labels = { ashkenazi: 'אשכנזי', sephardic: 'ספרדי', mizrahi: 'מזרחי', yemenite: 'תימני', mixed: 'מעורב' }
                      return (
                        <button
                          key={c}
                          onClick={() => setFilters(f => ({
                            ...f,
                            community_backgrounds: selected
                              ? (f.community_backgrounds ?? []).filter(x => x !== c)
                              : [...(f.community_backgrounds ?? []), c]
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#B8472A] text-white border-[#B8472A]' : 'border-[rgba(23,20,17,0.15)] text-[#171411] hover:border-[rgba(23,20,17,0.4)]'}`}
                        >
                          {labels[c]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* מתגים */}
                <div className="space-y-3 bg-[#F7F2E8] rounded-2xl p-4">
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={filters.shomer_shabbat_only} onCheckedChange={v => setFilters(f => ({ ...f, shomer_shabbat_only: v }))} />
                    <Label className="text-sm text-[#171411] cursor-pointer">שומר/ת שבת בלבד</Label>
                  </div>
                  <div className="h-px bg-[rgba(23,20,17,0.08)]" />
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={filters.verified_only} onCheckedChange={v => setFilters(f => ({ ...f, verified_only: v }))} />
                    <Label className="text-sm text-[#171411] cursor-pointer">מאומתים בלבד</Label>
                  </div>
                  <div className="h-px bg-[rgba(23,20,17,0.08)]" />
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={!!filters.hide_messaged} onCheckedChange={v => setFilters(f => ({ ...f, hide_messaged: v }))} />
                    <Label className="text-sm text-[#171411] cursor-pointer">הסתר שהודעתי כבר</Label>
                  </div>
                </div>

                {/* כפתורים */}
                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-2xl border-[rgba(23,20,17,0.15)]">
                    <X className="w-4 h-4 me-1.5" /> נקה
                  </Button>
                  <Button onClick={applyFilters} className="flex-1 bg-[#171411] hover:bg-[#2A2520] text-white rounded-2xl">
                    <Search className="w-4 h-4 me-1.5" /> הצג תוצאות
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn('bg-[#EBE4D2] rounded-2xl animate-pulse', i === 0 ? 'md:col-span-2' : '')}>
              <div className="aspect-[3/4]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-[#D9D0C0] rounded w-2/3" />
                <div className="h-3 bg-[#D9D0C0] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[rgba(23,20,17,0.45)] font-medium">לא נמצאו פרופילים</p>
          <p className="text-[rgba(23,20,17,0.30)] text-sm mt-2">נסה לשנות את הסינון</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              featured={i === 0}
            />
          ))}
        </div>
      )}

      {!loading && displayItems.length > 0 && (
        <div className="text-center mt-10">
          <Button
            variant="outline"
            className="gap-2 border-[rgba(23,20,17,0.15)] text-[rgba(23,20,17,0.55)] hover:text-[#171411] bg-transparent rounded-xl"
            onClick={() => loadProfiles(appliedFilters)}
          >
            <RefreshCw className="w-4 h-4" />
            רענן פרופילים
          </Button>
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
