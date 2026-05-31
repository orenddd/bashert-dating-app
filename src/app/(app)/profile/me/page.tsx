'use client'

import { useEffect, useState } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'
import { fetchProfile } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/client'
import { formatHeight } from '@/lib/utils/age'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Settings, Camera, Crown, Eye, Heart, ExternalLink, MapPin } from 'lucide-react'
import Link from 'next/link'

function calcAgeFromYear(birthYear: number | null): string {
  if (!birthYear) return ''
  return `${new Date().getFullYear() - birthYear}`
}

export default function MyProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [photos, setPhotos] = useState<DbPhoto[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [matchesCount, setMatchesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // Profile + photos
        const data = await fetchProfile(user.id)
        if (data) {
          setProfile(data.profile)
          setPhotos(data.photos)
        }

        // Likes count (received)
        const { count: likes } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', user.id)
        setLikesCount(likes ?? 0)

        // Matches count
        const { count: matches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        setMatchesCount(matches ?? 0)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user?.id])

  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0]
  const photoUrl = primaryPhoto?.url ?? null
  const age = calcAgeFromYear(profile?.birth_year ?? null)

  // Profile completion
  const completionFields = [
    profile?.bio,
    profile?.city,
    profile?.birth_year,
    photos.length > 0,
    profile?.relationship_goal?.length,
    profile?.languages?.length,
  ].filter(Boolean).length
  const completionPct = Math.round((completionFields / 6) * 100)

  if (isLoading) {
    return (
      <div>
        <AppHeader title={t.nav.profile} />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl h-32 border border-[#E5E5E5] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <AppHeader title={t.nav.profile} />
        <div className="max-w-2xl mx-auto p-4 text-center py-20 text-[#737373]">
          לא נמצא פרופיל
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title={t.nav.profile} />
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">

        {/* Profile header card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E5E5E5]">
          <div className="relative h-48 bg-[#F5F5F5]">
            {photoUrl ? (
              <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl text-[#D4D4D4]">👤</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button className="absolute bottom-3 end-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white p-2 rounded-xl">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#0A0A0A]">
                    {profile.first_name}{age ? `, ${age}` : ''}
                  </h1>
                  {profile.is_verified && <Shield className="w-5 h-5 text-[#0A0A0A]" />}
                </div>
                {profile.height_cm && (
                  <p className="text-[#A3A3A3] text-sm">{formatHeight(profile.height_cm)}</p>
                )}
                {profile.city && (
                  <p className="text-[#A3A3A3] text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </p>
                )}
              </div>
              <Button asChild size="sm" className="bg-[#0A0A0A] text-white rounded-xl hover:bg-[#222]">
                <Link href="/profile/edit">
                  <Settings className="w-4 h-4 me-1" />
                  {t.profile.edit_profile}
                </Link>
              </Button>
            </div>

            {/* Public view button */}
            <div className="mb-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#E5E5E5] text-[#737373] rounded-xl hover:border-[#0A0A0A] hover:text-[#0A0A0A] gap-1.5"
              >
                <Link href={`/profile/${user?.id}?preview=true`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  ראה את הפרופיל שלי כפי שנראה לאחרים
                </Link>
              </Button>
            </div>

            {/* Subscription */}
            {profile.subscription_tier === 'free' ? (
              <Button asChild size="sm" variant="outline" className="gap-1.5 border-[#E5E5E5] text-[#0A0A0A] rounded-full hover:bg-[#F5F5F5]">
                <Link href="/settings">
                  <Crown className="w-3.5 h-3.5" />
                  שדרג למנוי
                </Link>
              </Button>
            ) : (
              <Badge className="bg-[#0A0A0A] text-white border-0">
                <Crown className="w-3 h-3 me-1" />
                {profile.subscription_tier === 'platinum' ? t.subscription.platinum_name : t.subscription.gold_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Profile strength */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#0A0A0A]">{t.profile.profile_strength}</h3>
            <span className="text-[#0A0A0A] font-bold">{completionPct}%</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2 mb-3">
            <div
              className="bg-[#0A0A0A] h-2 rounded-full transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-sm text-[#737373]">{t.profile.complete_profile}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Eye, value: profile.views_count, label: t.profile.views },
            { icon: Heart, value: likesCount, label: 'לייקים' },
            { icon: Heart, value: matchesCount, label: t.nav.matches },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-[#F5F5F5] rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 text-[#737373] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#0A0A0A]">{value}</p>
              <p className="text-xs text-[#A3A3A3]">{label}</p>
            </div>
          ))}
        </div>

        {/* Photos grid */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5]">
          <h3 className="font-bold text-[#0A0A0A] mb-4">{t.profile.photos}</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {photo.is_primary && (
                  <div className="absolute bottom-1 start-1 bg-[#0A0A0A] text-white text-xs px-1.5 py-0.5 rounded">
                    {t.profile.primary_photo}
                  </div>
                )}
              </div>
            ))}
            <button className="aspect-square rounded-2xl border-2 border-dashed border-[#E5E5E5] flex items-center justify-center hover:border-[#0A0A0A] transition-colors">
              <Camera className="w-6 h-6 text-[#D4D4D4]" />
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[#0A0A0A]">{t.profile.about}</h3>
            <Button asChild variant="ghost" size="sm" className="text-[#737373] text-xs">
              <Link href="/profile/edit">{t.common.edit}</Link>
            </Button>
          </div>
          <p className="text-[#737373] text-sm leading-relaxed">
            {profile.bio || 'הוסף תיאור עצמי כדי שאנשים יכירו אותך טוב יותר...'}
          </p>
        </div>

        {/* Languages & Interests */}
        {(profile.languages?.length > 0 || profile.hobbies?.length > 0) && (
          <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-4">
            {profile.languages?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#0A0A0A] mb-2 text-sm">שפות</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(lang => (
                    <span key={lang} className="bg-[#F5F5F5] text-[#0A0A0A] text-xs px-3 py-1 rounded-full">{lang}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.hobbies?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#0A0A0A] mb-2 text-sm">תחביבים</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map(h => (
                    <span key={h} className="bg-[#F5F5F5] text-[#0A0A0A] text-xs px-3 py-1 rounded-full">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
