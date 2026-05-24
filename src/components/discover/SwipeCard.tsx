'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import { JewishAttributesBadges } from '@/components/profile/JewishAttributesBadges'
import { calcAge } from '@/lib/utils/age'
import { MapPin, Shield, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  profile: DbProfile
  photos: DbPhoto[]
  onLike: () => void
  onPass: () => void
  onSuperLike: () => void
  isTop: boolean
}

export function SwipeCard({ profile, photos, onLike, onPass, onSuperLike, isTop }: Props) {
  const { t, isRTL } = useTranslation()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const age = calcAge(profile.date_of_birth)
  const photoUrl = photos[photoIdx]?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/600/800`

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTop) return
    startX.current = e.clientX
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setDragX(e.clientX - startX.current)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    commitSwipe()
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTop) return
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setDragX(e.touches[0].clientX - startX.current)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    commitSwipe()
  }

  const commitSwipe = () => {
    if (dragX > 100) { onLike(); setDragX(0) }
    else if (dragX < -100) { onPass(); setDragX(0) }
    else setDragX(0)
  }

  const rotate = dragX * 0.04
  const likeOpacity = Math.min(Math.max(dragX / 80, 0), 1)
  const passOpacity = Math.min(Math.max(-dragX / 80, 0), 1)

  const prevPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setPhotoIdx(i => Math.max(0, i - 1))
  }

  const nextPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setPhotoIdx(i => Math.min(photos.length - 1, i + 1))
  }

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-3xl overflow-hidden shadow-2xl select-none',
        isTop ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        !isDragging && 'transition-transform duration-300'
      )}
      style={{
        transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
        zIndex: isTop ? 10 : 5,
        scale: isTop ? '1' : '0.97',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo */}
      <img
        src={photoUrl}
        alt={profile.display_name}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {/* Like overlay */}
      {likeOpacity > 0.05 && (
        <div
          className="absolute top-10 start-6 bg-green-500 text-white font-black text-2xl px-5 py-2 rounded-2xl border-4 border-green-400 rotate-[-12deg]"
          style={{ opacity: likeOpacity }}
        >
          LIKE ❤️
        </div>
      )}

      {/* Pass overlay */}
      {passOpacity > 0.05 && (
        <div
          className="absolute top-10 end-6 bg-red-500 text-white font-black text-2xl px-5 py-2 rounded-2xl border-4 border-red-400 rotate-[12deg]"
          style={{ opacity: passOpacity }}
        >
          NOPE ✕
        </div>
      )}

      {/* Photo progress bars */}
      {photos.length > 1 && (
        <div className="absolute top-4 start-0 end-0 flex gap-1 px-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className={cn('h-[3px] flex-1 rounded-full transition-all', i === photoIdx ? 'bg-white' : 'bg-white/35')}
            />
          ))}
        </div>
      )}

      {/* Photo nav tap zones */}
      {photos.length > 1 && isTop && (
        <>
          <button
            className="absolute start-0 top-0 bottom-[40%] w-1/3 z-10"
            onClick={prevPhoto}
            onTouchEnd={prevPhoto}
            aria-label="Previous photo"
          />
          <button
            className="absolute end-0 top-0 bottom-[40%] w-1/3 z-10"
            onClick={nextPhoto}
            onTouchEnd={nextPhoto}
            aria-label="Next photo"
          />
        </>
      )}

      {/* Arrow hints on larger screens */}
      {photos.length > 1 && photoIdx > 0 && (
        <ChevronLeft className="absolute start-2 top-1/3 w-8 h-8 text-white/60 pointer-events-none" />
      )}
      {photos.length > 1 && photoIdx < photos.length - 1 && (
        <ChevronRight className="absolute end-2 top-1/3 w-8 h-8 text-white/60 pointer-events-none" />
      )}

      {/* Info button → profile */}
      {isTop && (
        <Link
          href={`/profile/${profile.user_id}`}
          className="absolute top-4 end-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
          onClick={e => e.stopPropagation()}
        >
          <Info className="w-4 h-4" />
        </Link>
      )}

      {/* Info */}
      <div className="absolute bottom-0 start-0 end-0 p-5 text-white">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold drop-shadow">{profile.first_name}, {age}</h2>
              {profile.is_verified && <Shield className="w-5 h-5 text-blue-300 fill-blue-300 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {profile.city}, {profile.state}
            </div>
          </div>
          {profile.is_online && (
            <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm border border-green-400/30 px-3 py-1 rounded-full flex-shrink-0">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-green-300">Online</span>
            </div>
          )}
        </div>
        <JewishAttributesBadges profile={profile} compact />
        {profile.bio && (
          <p className="mt-2 text-white/75 text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}
      </div>
    </div>
  )
}
