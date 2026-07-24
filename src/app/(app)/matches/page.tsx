'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import { fetchLikesReceived, fetchLikesSent, sendLike } from '@/lib/api/likes'
import { calcAge } from '@/lib/utils/age'
import { photoObjectPosition } from '@/lib/faceDetection'
import { Shield, MessageCircle, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import type { DbProfile, DbPhoto, DbLike } from '@/lib/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/shared/AuthProvider'

export default function LikesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [received, setReceived] = useState<{ like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [sent, setSent] = useState<{ like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [likedBack, setLikedBack] = useState<Set<string>>(new Set())
  const [messagingTarget, setMessagingTarget] = useState<{ profile: DbProfile; photos: DbPhoto[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([fetchLikesReceived(user.id), fetchLikesSent(user.id)]).then(([r, s]) => {
      setReceived(r)
      setSent(s)
      setLoading(false)
    })
  }, [user])

  const handleLikeBack = async (profile: DbProfile) => {
    if (!user) return
    await sendLike(user.id, profile.user_id)
    setLikedBack(prev => new Set(prev).add(profile.user_id))
    toast.success(`שלחת לב ל-${profile.first_name}!`)
  }

  const renderReceivedCard = ({ like, profile, photos }: { like: DbLike; profile: DbProfile; photos: DbPhoto[] }) => {
    const photo = photos.find(p => p.is_primary) ?? photos[0]
    const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/400/500`
    const age = calcAge(profile.date_of_birth)
    const hasLikedBack = likedBack.has(profile.user_id)

    return (
      <div key={like.id} className="bg-[#FBF6E8] rounded-2xl overflow-hidden border border-[rgba(23,20,17,0.08)] hover:shadow-md transition-shadow">
        <div className="relative aspect-[3/4]">
          <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" style={{ objectPosition: photoObjectPosition(photo) }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          {profile.is_online && <div className="absolute top-3 end-3 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
          {profile.is_verified && (
            <div className="absolute top-3 start-3">
              <Shield className="w-4 h-4 text-[#2E5A7C] fill-[#2E5A7C] drop-shadow" />
            </div>
          )}
          {like.is_super_like && (
            <div className="absolute top-3 inset-x-3 flex justify-center pointer-events-none">
              <div className="bg-[#B8472A] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-white" />
                {t.likes.super_liked_you}
              </div>
            </div>
          )}
          <Link href={`/profile/${profile.user_id}`} className="absolute bottom-0 start-0 end-0 p-3 text-white">
            <p className="font-serif font-bold text-lg leading-tight">{profile.first_name}, {age}</p>
            <p className="text-xs text-white/70 mt-0.5">{profile.city}</p>
          </Link>
        </div>
        <div className="p-3 space-y-2">
          {hasLikedBack ? (
            <div className="flex gap-2">
              <Button asChild size="sm" className="flex-1 bg-[#171411] hover:bg-[#2A2520] text-[#F2EDDF] rounded-xl text-xs">
                <Link href="/messages">
                  <MessageCircle className="w-3 h-3 me-1" />
                  {t.common.message}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs border-[rgba(23,20,17,0.15)]">
                <Link href={`/profile/${profile.user_id}`}>{t.common.view_profile}</Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-[#B8472A] hover:bg-[#7A2E18] text-white rounded-xl text-xs font-bold"
                onClick={() => handleLikeBack(profile)}
              >
                <Heart className="w-3 h-3 me-1 fill-white" />
                {t.likes.like_back}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs text-[#171411] border-[rgba(23,20,17,0.15)] hover:border-[rgba(23,20,17,0.30)]"
                onClick={() => setMessagingTarget({ profile, photos })}
              >
                <MessageCircle className="w-3 h-3 me-1" />
                {t.common.message}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSentCard = ({ like, profile, photos }: { like: DbLike; profile: DbProfile; photos: DbPhoto[] }) => {
    const photo = photos.find(p => p.is_primary) ?? photos[0]
    const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/400/500`
    const age = calcAge(profile.date_of_birth)

    return (
      <Link key={like.id} href={`/profile/${profile.user_id}`}>
        <div className="bg-[#FBF6E8] rounded-2xl overflow-hidden border border-[rgba(23,20,17,0.08)] hover:shadow-md transition-shadow">
          <div className="relative aspect-[3/4]">
            <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover" style={{ objectPosition: photoObjectPosition(photo) }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            {profile.is_online && <div className="absolute top-3 end-3 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
            {like.is_super_like && (
              <div className="absolute top-3 start-3">
                <Star className="w-5 h-5 text-[#B8472A] fill-[#B8472A] drop-shadow" />
              </div>
            )}
            <div className="absolute bottom-0 start-0 end-0 p-3 text-white">
              <p className="font-serif font-bold text-lg leading-tight">{profile.first_name}, {age}</p>
              <p className="text-xs text-white/70 mt-0.5">{profile.city}</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <AppHeader title={t.likes.title} />
      <div className="p-4 md:p-6">
        <Tabs defaultValue="received">
          <TabsList className="mb-6 bg-[#EBE4D2] rounded-xl p-1">
            <TabsTrigger value="received" className="rounded-lg gap-2 data-[state=active]:bg-[#171411] data-[state=active]:text-[#F2EDDF]">
              {t.likes.liked_me}
              {received.length > 0 && (
                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-[#B8472A] text-white">
                  {received.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg data-[state=active]:bg-[#171411] data-[state=active]:text-[#F2EDDF]">
              {t.likes.i_liked}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#EBE4D2] rounded-2xl animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : received.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-[rgba(23,20,17,0.12)] mx-auto mb-4" />
                <p className="text-[rgba(23,20,17,0.45)] font-medium">{t.likes.no_likes}</p>
                <p className="text-[rgba(23,20,17,0.30)] text-sm mt-2">{t.likes.no_likes_sub}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {received.map(renderReceivedCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#EBE4D2] rounded-2xl animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : sent.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-[rgba(23,20,17,0.12)] mx-auto mb-4" />
                <p className="text-[rgba(23,20,17,0.45)] font-medium">{t.likes.no_sent}</p>
              </div>
            ) : (
              <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4')}>
                {sent.map(renderSentCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
