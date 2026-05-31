'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchDiscoverProfiles } from '@/lib/api/profiles'
import { sendLike, removeLike, isLiked } from '@/lib/api/likes'
import { fetchSentRequestsMap, type SentStatusMap } from '@/lib/api/messages'
import { SendMessageDialog } from '@/components/profile/SendMessageDialog'
import {
  Shield, MapPin, SlidersHorizontal, Heart, MessageCircle,
  RefreshCw, X, Search, Clock, CheckCircle2,
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
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAge(p: DbProfile): string {
  if (p.birth_year) return String(new Date().getFullYear() - p.birth_year)
  if (p.date_of_birth) {
    const b = new Date(p.date_of_birth)
    let a = new Date().getFullYear() - b.getFullYear()
    const m = new Date().getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < b.getDate())) a--
    return String(a)
  }
  return ''
}

const REL_LABELS: Record<string, string> = {
  hiloni: 'חילוני', masorti: 'מסורתי', dati_light: 'דתי-לייט', dati: 'דתי', haredi: 'חרדי',
}
const GOAL_LABELS: Record<string, string> = {
  marriage: '💍 נישואים', serious: '❤️ רציני', dating: '☕ היכרות',
  friendship: '🤝 חברות', not_sure: '🤷 עדיין לא יודע/ת', open: '🌊 פתוח/ה',
}

// ─── Shared action bar ────────────────────────────────────────────────────────

function Actions({
  profile, isLikedState, sentStatus, onLike, onMessage, compact = false,
}: {
  profile: DbProfile; isLikedState: boolean
  sentStatus: SentStatusMap[string] | undefined
  onLike: () => void; onMessage: () => void; compact?: boolean
}) {
  return (
    <div className={cn('flex gap-2', compact ? 'mt-2' : 'mt-3')}>
      <button
        onClick={onLike}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 rounded-2xl text-sm font-medium transition-all border',
          compact ? 'h-9' : 'h-10',
          isLikedState
            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
            : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#0A0A0A]'
        )}
      >
        <Heart className={cn(compact ? 'w-3.5 h-3.5' : 'w-4 h-4', isLikedState && 'fill-white')} />
        {isLikedState ? '♥ אהבתי' : 'לב'}
      </button>

      {!sentStatus ? (
        <button onClick={onMessage}
          className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-2xl text-sm font-medium bg-[#0A0A0A] text-white hover:bg-[#222] transition-colors', compact ? 'h-9' : 'h-10')}>
          <MessageCircle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />הודעה
        </button>
      ) : sentStatus.status === 'pending' ? (
        <button onClick={onMessage}
          className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-2xl text-sm font-medium border border-amber-300 text-amber-700 bg-amber-50', compact ? 'h-9' : 'h-10')}>
          <Clock className="w-3.5 h-3.5" />ממתין
        </button>
      ) : sentStatus.status === 'accepted' && sentStatus.conversation_id ? (
        <Link href={`/messages/${sentStatus.conversation_id}`}
          className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-2xl text-sm font-medium border border-emerald-300 text-emerald-700 bg-emerald-50', compact ? 'h-9' : 'h-10')}>
          <CheckCircle2 className="w-3.5 h-3.5" />שיחה
        </Link>
      ) : (
        <button onClick={onMessage}
          className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-2xl text-sm font-medium bg-[#0A0A0A] text-white hover:bg-[#222]', compact ? 'h-9' : 'h-10')}>
          <MessageCircle className="w-3.5 h-3.5" />הודעה
        </button>
      )}

      <Link href={`/profile/${profile.user_id}`}
        className={cn('flex items-center justify-center rounded-2xl border border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A] hover:text-[#0A0A0A] text-xs transition-all px-3', compact ? 'h-9' : 'h-10')}>
        ↗
      </Link>
    </div>
  )
}

// ─── Variant 1: Magazine — tall portrait, info overlay ────────────────────────
function CardMagazine({ profile, photos, isLikedState, sentStatus, onLike, onMessage }: CardProps) {
  const primary = photos.find(p => p.is_primary) ?? photos[0]
  const age = getAge(profile)
  const goal = profile.relationship_goal?.[0]

  return (
    <Link href={`/profile/${profile.user_id}`} className="block relative rounded-3xl overflow-hidden group cursor-pointer">
      <div className="aspect-[3/4] bg-[#F5F5F5]">
        {primary
          ? <img src={primary.url} alt={profile.first_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-8xl text-[#D4D4D4]">👤</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* top badges */}
      <div className="absolute top-4 start-4 end-4 flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          {profile.is_verified && (
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full w-fit">
              <Shield className="w-3 h-3" /> מאומת
            </span>
          )}
          {profile.is_online && (
            <span className="flex items-center gap-1 bg-green-500/80 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 bg-white rounded-full" /> מחובר/ת
            </span>
          )}
        </div>
        {goal && (
          <span className="bg-white/20 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full">
            {GOAL_LABELS[goal] ?? goal}
          </span>
        )}
      </div>

      {/* bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-5">
        <h2 className="text-white text-3xl font-black leading-tight">{profile.first_name}{age ? `, ${age}` : ''}</h2>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {profile.city && (
            <span className="text-white/75 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>
          )}
          {profile.religious_level && (
            <span className="text-white/75 text-sm">{REL_LABELS[profile.religious_level]}</span>
          )}
        </div>
        {profile.bio && (
          <p className="text-white/70 text-sm mt-2 line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* action pills — minimal */}
        <div className="flex gap-2 mt-3" onClick={e => e.preventDefault()}>
          <button onClick={onLike}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isLikedState ? 'bg-white text-[#0A0A0A]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30')}>
            <Heart className={cn('w-3.5 h-3.5', isLikedState && 'fill-[#0A0A0A]')} />
            {isLikedState ? 'אהבתי' : 'לב'}
          </button>
          {!sentStatus ? (
            <button onClick={onMessage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#0A0A0A] hover:bg-white/90 transition-all">
              <MessageCircle className="w-3.5 h-3.5" />הודעה
            </button>
          ) : sentStatus.status === 'accepted' && sentStatus.conversation_id ? (
            <Link href={`/messages/${sentStatus.conversation_id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-emerald-500 text-white"
              onClick={e => e.stopPropagation()}>
              <CheckCircle2 className="w-3.5 h-3.5" />שיחה
            </Link>
          ) : (
            <button onClick={onMessage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-amber-500/80 backdrop-blur-md text-white">
              <Clock className="w-3.5 h-3.5" />ממתין
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Variant 2: Split — photo left, info right ────────────────────────────────
function CardSplit({ profile, photos, isLikedState, sentStatus, onLike, onMessage }: CardProps) {
  const primary = photos.find(p => p.is_primary) ?? photos[0]
  const age = getAge(profile)
  const seekingText = (profile.open_questions as Record<string, string>)?.seeking

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
      <div className="flex">
        {/* Photo */}
        <Link href={`/profile/${profile.user_id}`} className="w-36 flex-shrink-0 relative">
          <div className="h-full min-h-[220px] bg-[#F5F5F5]">
            {primary
              ? <img src={primary.url} alt={profile.first_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-5xl text-[#D4D4D4]">👤</div>
            }
          </div>
          {profile.is_online && (
            <div className="absolute top-2 end-2 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
          <div>
            <Link href={`/profile/${profile.user_id}`}>
              <h2 className="text-[#0A0A0A] font-bold text-lg leading-tight hover:underline">
                {profile.first_name}{age ? `, ${age}` : ''}
              </h2>
            </Link>
            {profile.city && (
              <p className="text-[#A3A3A3] text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{profile.city}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.religious_level && (
              <span className="bg-[#F5F5F5] text-[#0A0A0A] text-[11px] font-medium px-2 py-0.5 rounded-full">
                {REL_LABELS[profile.religious_level]}
              </span>
            )}
            {profile.height_cm && (
              <span className="bg-[#F5F5F5] text-[#737373] text-[11px] px-2 py-0.5 rounded-full">
                {profile.height_cm} ס״מ
              </span>
            )}
            {profile.marital_status && profile.marital_status !== 'single' && (
              <span className="bg-[#F5F5F5] text-[#737373] text-[11px] px-2 py-0.5 rounded-full">
                {profile.marital_status === 'divorced' ? 'גרוש/ה' : 'אלמן/ה'}
              </span>
            )}
          </div>

          {profile.relationship_goal?.slice(0, 1).map(g => (
            <p key={g} className="text-[#0A0A0A] text-xs font-medium">
              {GOAL_LABELS[g] ?? g}
            </p>
          ))}

          {seekingText ? (
            <p className="text-[#737373] text-xs leading-relaxed line-clamp-3 flex-1">{seekingText}</p>
          ) : profile.bio ? (
            <p className="text-[#737373] text-xs leading-relaxed line-clamp-3 flex-1">{profile.bio}</p>
          ) : null}

          {profile.is_verified && (
            <span className="flex items-center gap-1 text-[11px] text-[#0A0A0A] font-medium w-fit">
              <Shield className="w-3 h-3" /> מאומת
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Actions profile={profile} isLikedState={isLikedState} sentStatus={sentStatus}
          onLike={onLike} onMessage={onMessage} compact />
      </div>
    </div>
  )
}

// ─── Variant 3: Quote — landscape photo + big bio quote ───────────────────────
function CardQuote({ profile, photos, isLikedState, sentStatus, onLike, onMessage }: CardProps) {
  const primary = photos.find(p => p.is_primary) ?? photos[0]
  const age = getAge(profile)
  const bio = profile.bio || (profile.open_questions as Record<string, string>)?.seeking

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
      {/* Landscape photo */}
      <Link href={`/profile/${profile.user_id}`} className="block relative">
        <div className="aspect-video bg-[#F5F5F5]">
          {primary
            ? <img src={primary.url} alt={profile.first_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl text-[#D4D4D4]">👤</div>
          }
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-end p-5">
            <div>
              <h2 className="text-white text-2xl font-black">{profile.first_name}{age ? `, ${age}` : ''}</h2>
              <div className="flex gap-3 mt-1">
                {profile.city && <span className="text-white/70 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>}
                {profile.is_online && <span className="text-green-400 text-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />מחובר/ת</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5 space-y-4">
        {/* Big quote */}
        {bio && (
          <div className="relative">
            <span className="text-5xl text-[#E5E5E5] font-serif absolute -top-2 -start-1 leading-none">"</span>
            <p className="text-[#0A0A0A] text-base font-medium leading-relaxed ps-6 line-clamp-3 italic">
              {bio}
            </p>
          </div>
        )}

        {/* Chips row */}
        <div className="flex flex-wrap gap-2">
          {profile.religious_level && (
            <span className="border border-[#E5E5E5] text-[#0A0A0A] text-xs px-3 py-1 rounded-full">
              {REL_LABELS[profile.religious_level]}
            </span>
          )}
          {profile.relationship_goal?.slice(0, 1).map(g => (
            <span key={g} className="border border-[#0A0A0A] text-[#0A0A0A] text-xs px-3 py-1 rounded-full font-medium">
              {GOAL_LABELS[g] ?? g}
            </span>
          ))}
          {profile.languages?.slice(0, 2).map(l => (
            <span key={l} className="border border-[#E5E5E5] text-[#737373] text-xs px-3 py-1 rounded-full">{l}</span>
          ))}
          {profile.is_verified && (
            <span className="flex items-center gap-1 border border-[#E5E5E5] text-xs px-3 py-1 rounded-full text-[#0A0A0A]">
              <Shield className="w-3 h-3" />מאומת
            </span>
          )}
        </div>

        <Actions profile={profile} isLikedState={isLikedState} sentStatus={sentStatus}
          onLike={onLike} onMessage={onMessage} />
      </div>
    </div>
  )
}

// ─── Variant 4: Mosaic — multi-photo grid ─────────────────────────────────────
function CardMosaic({ profile, photos, isLikedState, sentStatus, onLike, onMessage }: CardProps) {
  const primary = photos.find(p => p.is_primary) ?? photos[0]
  const extras = photos.filter(p => p !== primary && p.media_type === 'image').slice(0, 2)
  const age = getAge(profile)
  const goal = profile.relationship_goal?.[0]

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
      {/* Photo mosaic */}
      <Link href={`/profile/${profile.user_id}`} className="block">
        {extras.length >= 2 ? (
          <div className="grid grid-cols-3 gap-0.5 bg-[#E5E5E5]">
            <div className="col-span-2 aspect-square">
              {primary
                ? <img src={primary.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center text-5xl text-[#D4D4D4]">👤</div>
              }
            </div>
            <div className="grid grid-rows-2 gap-0.5">
              {extras.map(ph => (
                <img key={ph.id} src={ph.url} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] bg-[#F5F5F5]">
            {primary
              ? <img src={primary.url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl text-[#D4D4D4]">👤</div>
            }
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/profile/${profile.user_id}`}>
              <h2 className="text-[#0A0A0A] text-xl font-bold hover:underline">
                {profile.first_name}{age ? `, ${age}` : ''}
              </h2>
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {profile.city && (
                <span className="text-[#A3A3A3] text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{profile.city}
                </span>
              )}
              {profile.is_online && <span className="text-green-500 text-xs">● מחובר/ת</span>}
              {profile.is_verified && <span className="text-[#0A0A0A] text-xs flex items-center gap-1"><Shield className="w-3 h-3" />מאומת</span>}
            </div>
          </div>
          {goal && (
            <span className="bg-[#0A0A0A] text-white text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
              {GOAL_LABELS[goal] ?? goal}
            </span>
          )}
        </div>

        {/* 2-column info grid */}
        <div className="grid grid-cols-2 gap-2">
          {profile.religious_level && (
            <div className="bg-[#F5F5F5] rounded-2xl p-3">
              <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wide">דת</p>
              <p className="text-[#0A0A0A] text-sm font-medium mt-0.5">{REL_LABELS[profile.religious_level]}</p>
            </div>
          )}
          {profile.height_cm && (
            <div className="bg-[#F5F5F5] rounded-2xl p-3">
              <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wide">גובה</p>
              <p className="text-[#0A0A0A] text-sm font-medium mt-0.5">{profile.height_cm} ס״מ</p>
            </div>
          )}
        </div>

        {profile.hobbies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.hobbies.slice(0, 4).map(h => (
              <span key={h} className="bg-[#F5F5F5] text-[#737373] text-xs px-2.5 py-1 rounded-full">{h}</span>
            ))}
            {profile.hobbies.length > 4 && (
              <span className="text-[#A3A3A3] text-xs self-center">+{profile.hobbies.length - 4}</span>
            )}
          </div>
        )}

        <Actions profile={profile} isLikedState={isLikedState} sentStatus={sentStatus}
          onLike={onLike} onMessage={onMessage} />
      </div>
    </div>
  )
}

// ─── Variant 5: Minimal — text-first, small circle photo ─────────────────────
function CardMinimal({ profile, photos, isLikedState, sentStatus, onLike, onMessage }: CardProps) {
  const primary = photos.find(p => p.is_primary) ?? photos[0]
  const age = getAge(profile)
  const seekingText = (profile.open_questions as Record<string, string>)?.seeking
  const extraPhotos = photos.filter(p => p.media_type === 'image').slice(1, 4)

  return (
    <div className="bg-[#0A0A0A] rounded-3xl overflow-hidden text-white">
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center gap-4">
          <Link href={`/profile/${profile.user_id}`} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#222]">
              {primary
                ? <img src={primary.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              }
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${profile.user_id}`}>
              <h2 className="text-white text-xl font-bold hover:text-white/80">
                {profile.first_name}{age ? `, ${age}` : ''}
              </h2>
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.city && (
                <span className="text-white/50 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>
              )}
              {profile.is_online && <span className="text-green-400 text-xs">● מחובר/ת</span>}
            </div>
          </div>
          {profile.is_verified && <Shield className="w-4 h-4 text-white/50 flex-shrink-0" />}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {profile.religious_level && (
            <span className="border border-white/20 text-white/70 text-xs px-3 py-1 rounded-full">
              {REL_LABELS[profile.religious_level]}
            </span>
          )}
          {profile.height_cm && (
            <span className="border border-white/20 text-white/70 text-xs px-3 py-1 rounded-full">
              {profile.height_cm} ס״מ
            </span>
          )}
          {profile.relationship_goal?.slice(0, 1).map(g => (
            <span key={g} className="border border-white/40 text-white text-xs px-3 py-1 rounded-full font-medium">
              {GOAL_LABELS[g] ?? g}
            </span>
          ))}
          {profile.languages?.slice(0, 2).map(l => (
            <span key={l} className="border border-white/20 text-white/60 text-xs px-3 py-1 rounded-full">{l}</span>
          ))}
        </div>

        {/* Seeking text or bio */}
        {(seekingText || profile.bio) && (
          <p className="text-white/75 text-sm leading-relaxed line-clamp-3">
            {seekingText || profile.bio}
          </p>
        )}

        {/* Extra photos strip */}
        {extraPhotos.length > 0 && (
          <div className="flex gap-2">
            {extraPhotos.map(ph => (
              <div key={ph.id} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={ph.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Actions — inverted for dark bg */}
        <div className="flex gap-2">
          <button onClick={onLike}
            className={cn('flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium transition-all',
              isLikedState ? 'bg-white text-[#0A0A0A]' : 'border border-white/25 text-white hover:border-white/60')}>
            <Heart className={cn('w-4 h-4', isLikedState && 'fill-[#0A0A0A]')} />
            {isLikedState ? '♥ אהבתי' : 'לב'}
          </button>
          {!sentStatus ? (
            <button onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium bg-white text-[#0A0A0A] hover:bg-white/90">
              <MessageCircle className="w-4 h-4" />הודעה
            </button>
          ) : sentStatus.status === 'accepted' && sentStatus.conversation_id ? (
            <Link href={`/messages/${sentStatus.conversation_id}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium bg-emerald-500 text-white">
              <CheckCircle2 className="w-4 h-4" />שיחה
            </Link>
          ) : (
            <button onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl text-sm font-medium border border-white/25 text-white">
              <Clock className="w-4 h-4" />ממתין
            </button>
          )}
          <Link href={`/profile/${profile.user_id}`}
            className="h-10 px-3 flex items-center justify-center rounded-2xl border border-white/25 text-white/60 hover:text-white text-xs transition-all">
            ↗
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Card router ──────────────────────────────────────────────────────────────

interface CardProps {
  profile: DbProfile; photos: DbPhoto[]; idx: number
  isLikedState: boolean; sentStatus: SentStatusMap[string] | undefined
  onLike: () => void; onMessage: () => void
}

const VARIANTS = [CardMagazine, CardSplit, CardQuote, CardMosaic, CardMinimal]

function ProfileCard(props: CardProps) {
  const Variant = VARIANTS[props.idx % VARIANTS.length]
  return <Variant {...props} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Partial<SearchFilters> & { hide_messaged?: boolean } = {
  age_min: 18, age_max: 70, religious_levels: [], community_backgrounds: [],
  shomer_shabbat_only: false, verified_only: false, has_photos_only: false, hide_messaged: false,
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
    const [data, map] = await Promise.all([fetchDiscoverProfiles(user.id, f), fetchSentRequestsMap(user.id)])
    setSentMap(map)
    setItems(data)
    const likedSet = new Set<string>()
    await Promise.all(data.map(async ({ profile }) => { if (await isLiked(user.id, profile.user_id)) likedSet.add(profile.user_id) }))
    setLiked(likedSet)
    setLoading(false)
  }

  useEffect(() => { loadProfiles(appliedFilters) }, [user, appliedFilters]) // eslint-disable-line

  const applyFilters = () => { setAppliedFilters(filters); setFilterOpen(false) }
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setFilterOpen(false) }

  const displayItems = appliedFilters.hide_messaged
    ? items.filter(({ profile }) => { const s = sentMap[profile.user_id]; return !s || s.status === 'declined' })
    : items

  const activeFilterCount = [
    appliedFilters.shomer_shabbat_only, appliedFilters.verified_only,
    (appliedFilters.religious_levels?.length ?? 0) > 0,
    (appliedFilters.community_backgrounds?.length ?? 0) > 0,
    appliedFilters.hide_messaged,
  ].filter(Boolean).length

  const handleLike = async (profile: DbProfile) => {
    if (!user) return
    const isNow = !liked.has(profile.user_id)
    setLiked(prev => { const s = new Set(prev); isNow ? s.add(profile.user_id) : s.delete(profile.user_id); return s })
    if (isNow) { await sendLike(user.id, profile.user_id); toast.success(`שלחת לב ל-${profile.first_name} ❤️`, { duration: 1800 }) }
    else await removeLike(user.id, profile.user_id)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">גלה</h1>
          <p className="text-sm text-[#737373] mt-0.5">{loading ? 'טוען...' : `${displayItems.length} פרופילים`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadProfiles(appliedFilters)}
            className="border-[#E5E5E5] text-[#737373] hover:text-[#0A0A0A] rounded-xl">
            <RefreshCw className="w-4 h-4" />
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
                          {(labels as Record<string, string>)[o]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="space-y-3 bg-[#F5F5F5] rounded-2xl p-4">
                {[{ k: 'shomer_shabbat_only', l: 'שומר/ת שבת בלבד' }, { k: 'verified_only', l: 'מאומתים בלבד' }, { k: 'hide_messaged', l: 'הסתר שהודעתי כבר' }].map(({ k, l }, i, arr) => (
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

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden animate-pulse">
              <div className={i % 2 === 0 ? 'aspect-[4/3]' : 'aspect-[3/4]'} style={{ background: '#F5F5F5' }} />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
                <div className="h-3 bg-[#F5F5F5] rounded" />
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
          <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-2xl border-[#E5E5E5]">נקה מסננים</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map(({ profile, photos }, i) => (
            <ProfileCard key={profile.user_id} profile={profile} photos={photos} idx={i}
              isLikedState={liked.has(profile.user_id)} sentStatus={sentMap[profile.user_id]}
              onLike={() => handleLike(profile)} onMessage={() => setMessagingTarget({ profile, photos })} />
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
        <SendMessageDialog open onClose={() => setMessagingTarget(null)}
          profile={messagingTarget.profile} photos={messagingTarget.photos} />
      )}
    </div>
  )
}
