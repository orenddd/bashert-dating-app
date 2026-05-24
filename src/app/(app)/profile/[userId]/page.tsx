'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  Shield, MapPin, Briefcase, GraduationCap, Heart, Star, MessageCircle,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/shared/AuthProvider'
import type { DbProfile, DbPhoto } from '@/lib/types/database'

export default function ProfilePage() {
  const { t, isRTL } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const userId = params.userId as string

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
          <Link href="/discover">חזור לגלה</Link>
        </Button>
      </div>
    )
  }

  const age = calcAge(profile.date_of_birth)
  const photoUrl = photos[photoIdx]?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/600/800`

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

  const details = [
    { icon: Briefcase, label: t.profile.occupation, value: profile.occupation },
    { icon: GraduationCap, label: t.profile.education, value: profile.education },
    { icon: MapPin, label: t.profile.location, value: `${profile.city}, ${profile.state}` },
  ].filter(d => d.value)

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-6">
      <div className="p-4 pt-3">
        <Button variant="ghost" asChild size="sm" className="rounded-2xl text-gray-600 hover:text-[#171411]">
          <Link href="/discover">
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
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className={cn('h-[3px] flex-1 rounded-full transition-all', i === photoIdx ? 'bg-white' : 'bg-white/40')}
              />
            ))}
          </div>
        )}
        {photos.length > 1 && photoIdx > 0 && (
          <button
            onClick={() => setPhotoIdx(i => i - 1)}
            className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {photos.length > 1 && photoIdx < photos.length - 1 && (
          <button
            onClick={() => setPhotoIdx(i => i + 1)}
            className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
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
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-3xl font-black text-[#171411] tracking-tight">
              {profile.first_name} {profile.last_name[0]}.
            </h1>
            <span className="text-2xl font-light text-[rgba(23,20,17,0.40)]">{age}</span>
            {profile.is_verified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400" />}
          </div>
          {profile.height_cm && (
            <p className="text-gray-400 text-sm mt-0.5">{formatHeight(profile.height_cm)}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            className={cn(
              'flex-1 rounded-2xl font-bold transition-all',
              liked
                ? 'bg-[#B8472A] text-white hover:bg-[#7A2E18]'
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
            className={cn(
              'w-12 h-12 rounded-2xl p-0 transition-all border-[rgba(23,20,17,0.15)]',
              superLiked ? 'bg-[#171411] text-[#F2EDDF] border-[#171411]' : 'text-[rgba(23,20,17,0.55)] hover:bg-[rgba(23,20,17,0.06)]'
            )}
            onClick={handleSuperLike}
            title={t.common.super_like}
          >
            <Star className={cn('w-5 h-5', superLiked ? 'fill-[#F2EDDF]' : '')} />
          </Button>
        </div>

        <div className="bg-[#EBE4D2] rounded-2xl p-4 border border-[rgba(23,20,17,0.06)]">
          <h3 className="font-bold text-[#171411] mb-3 text-sm">{t.religious.level_label}</h3>
          <JewishAttributesBadges profile={profile} />
        </div>

        {profile.bio && (
          <div>
            <h3 className="font-serif font-bold text-[#171411] mb-2">{t.profile.about}</h3>
            <p className="text-[rgba(23,20,17,0.70)] leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {details.length > 0 && (
          <div className="space-y-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#EBE4D2] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#171411]" />
                </div>
                <div>
                  <p className="text-xs text-[rgba(23,20,17,0.45)]">{label}</p>
                  <p className="font-medium text-[#171411] text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#EBE4D2] rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-[#171411] text-sm">{t.profile.details}</h3>
          {[
            {
              label: t.community.aliyah_label,
              value: (t.community as Record<string, string>)[`aliyah_${profile.aliyah_plan === 'already_made' ? 'done' : profile.aliyah_plan}`],
            },
            {
              label: t.children.status_label,
              value: (t.children as Record<string, string>)[profile.children_status],
            },
            {
              label: t.religious.synagogue_label,
              value: (t.religious as Record<string, string>)[`synagogue_${profile.synagogue_attendance}`],
            },
            {
              label: t.community.background_label,
              value: (t.community as Record<string, string>)[profile.community_background],
            },
          ]
            .filter(d => d.value)
            .map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm py-0.5">
                <span className="text-[rgba(23,20,17,0.50)]">{label}</span>
                <span className="font-medium text-[#171411] text-end">{value}</span>
              </div>
            ))}
        </div>
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
