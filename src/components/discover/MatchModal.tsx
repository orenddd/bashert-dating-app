'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import { Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  open: boolean
  onClose: () => void
  matchedProfile: DbProfile | null
  matchedPhotos: DbPhoto[]
}

export function MatchModal({ open, onClose, matchedProfile, matchedPhotos }: Props) {
  const { t } = useTranslation()
  if (!matchedProfile) return null

  const photo = matchedPhotos.find(p => p.is_primary)?.url ?? `https://picsum.photos/seed/${matchedProfile.user_id}-1/200/200`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center border-0 bg-gradient-to-b from-[#1a3a5c] to-[#122840] text-white rounded-3xl overflow-hidden">
        {/* Firework decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#c9a84c] animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${0.8 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="relative pt-6 pb-2">
          <Heart className="w-12 h-12 text-[#e8566c] fill-[#e8566c] mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-black mb-1">{t.discover.its_a_match}</h2>
          <p className="text-white/70 mb-6">{t.discover.match_subtitle}</p>

          {/* Profile photos */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={`https://picsum.photos/seed/current-user-1/120/120`}
                alt="You"
                className="w-24 h-24 rounded-full object-cover border-4 border-[#e8566c]"
              />
              <img
                src={photo}
                alt={matchedProfile.first_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#c9a84c] absolute top-0 -end-12"
              />
            </div>
          </div>

          <p className="text-white/80 text-sm mb-6">
            אתה ו{matchedProfile.first_name} אוהבים אחד את השני
          </p>

          <div className="space-y-3 px-4">
            <Button
              asChild
              className="w-full bg-[#e8566c] hover:bg-[#c93a52] text-white rounded-2xl font-bold"
              onClick={onClose}
            >
              <Link href="/messages">
                <MessageCircle className="w-4 h-4 me-2" />
                {t.discover.send_message}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-white/70 hover:text-white hover:bg-white/10 rounded-2xl"
              onClick={onClose}
            >
              {t.discover.keep_swiping}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
