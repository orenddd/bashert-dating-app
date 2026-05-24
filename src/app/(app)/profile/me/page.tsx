'use client'

import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'
import { MOCK_PROFILES, MOCK_PHOTOS, CURRENT_USER_ID } from '@/lib/data/mock-profiles'
import { JewishAttributesBadges } from '@/components/profile/JewishAttributesBadges'
import { calcAge, formatHeight } from '@/lib/utils/age'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Settings, Camera, Crown, Eye, Heart } from 'lucide-react'
import Link from 'next/link'

export default function MyProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const profile = MOCK_PROFILES[0]
  const photos = MOCK_PHOTOS.filter(p => p.user_id === CURRENT_USER_ID)
  const primaryPhoto = photos.find(p => p.is_primary)
  const photoUrl = primaryPhoto?.url ?? `https://picsum.photos/seed/${CURRENT_USER_ID}-1/400/500`
  const age = calcAge(profile.date_of_birth)

  const completionFields = [profile.bio, profile.occupation, profile.city, photos.length > 0].filter(Boolean).length
  const completionPct = Math.round((completionFields / 4) * 100)

  return (
    <div>
      <AppHeader title={t.nav.profile} />
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">

        {/* Profile header */}
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="relative h-48">
            <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button className="absolute bottom-3 end-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white p-2 rounded-xl">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#1a3a5c]">{profile.first_name}, {age}</h1>
                  {profile.is_verified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400" />}
                </div>
                {profile.height_cm && <p className="text-gray-400 text-sm">{formatHeight(profile.height_cm)}</p>}
              </div>
              <Button asChild size="sm" className="bg-[#1a3a5c] text-white rounded-xl">
                <Link href="/settings">
                  <Settings className="w-4 h-4 me-1" />
                  {t.profile.edit_profile}
                </Link>
              </Button>
            </div>

            {/* Subscription */}
            <div className="flex items-center gap-2 mb-4">
              {profile.subscription_tier === 'free' ? (
                <Button asChild size="sm" variant="outline" className="gap-1.5 border-[#c9a84c] text-[#c9a84c] rounded-full">
                  <Link href="/settings">
                    <Crown className="w-3.5 h-3.5" />
                    {t.common.upgrade}
                  </Link>
                </Button>
              ) : (
                <Badge className="bg-[#c9a84c] text-white border-0">
                  <Crown className="w-3 h-3 me-1" />
                  {profile.subscription_tier === 'platinum' ? t.subscription.platinum_name : t.subscription.gold_name}
                </Badge>
              )}
            </div>

            <JewishAttributesBadges profile={profile} />
          </div>
        </div>

        {/* Profile strength */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#1a3a5c]">{t.profile.profile_strength}</h3>
            <span className="text-[#c9a84c] font-bold">{completionPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-[#1a3a5c] to-[#c9a84c] h-2 rounded-full transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-sm text-gray-500">{t.profile.complete_profile}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Eye, value: profile.views_count, label: t.profile.views, color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Heart, value: '12', label: t.common.like + 'ים', color: 'text-rose-500', bg: 'bg-rose-50' },
            { icon: Heart, value: '5', label: t.nav.matches, color: 'text-[#c9a84c]', bg: 'bg-yellow-50' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
              <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Photos grid */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#1a3a5c] mb-4">{t.profile.photos}</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {photo.is_primary && (
                  <div className="absolute bottom-1 start-1 bg-[#c9a84c] text-white text-xs px-1.5 py-0.5 rounded">
                    {t.profile.primary_photo}
                  </div>
                )}
              </div>
            ))}
            <button className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-[#1a3a5c] transition-colors">
              <Camera className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[#1a3a5c]">{t.profile.about}</h3>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs">
              {t.common.edit}
            </Button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {profile.bio || 'הוסף תיאור עצמי כדי שאנשים יכירו אותך טוב יותר...'}
          </p>
        </div>
      </div>
    </div>
  )
}
