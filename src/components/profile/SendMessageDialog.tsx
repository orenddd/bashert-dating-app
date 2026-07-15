'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import { sendMessageRequest } from '@/lib/api/messages'
import { Send, MapPin } from 'lucide-react'
import { calcAge } from '@/lib/utils/age'
import { useAuth } from '@/components/shared/AuthProvider'

interface Props {
  open: boolean
  onClose: () => void
  profile: DbProfile
  photos: DbPhoto[]
  onSent?: () => void
}

export function SendMessageDialog({ open, onClose, profile, photos, onSent }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0]
  const photoUrl = primaryPhoto?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/80/80`
  const initials = `${profile.first_name[0]}${profile.last_name[0]}`
  const age = calcAge(profile.date_of_birth)

  const handleSend = async () => {
    if (!message.trim() || !user) return
    setSending(true)
    const result = await sendMessageRequest(user.id, profile.user_id, message.trim())
    if (result === 'ok') {
      toast.success(t.messages.request_sent)
      setMessage('')
      onClose()
      onSent?.()
    } else if (result === 'already_pending') {
      toast.info('כבר שלחת בקשת הודעה שממתינה לאישור')
      onClose()
      onSent?.()
    } else {
      toast.error('שגיאה בשליחת ההודעה. נסה שנית.')
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl gap-4">
        <DialogHeader>
          <DialogTitle className="text-center text-[#171411]">
            {t.messages.write_first_message}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-1">
          <Avatar className="w-14 h-14 flex-shrink-0">
            <AvatarImage src={photoUrl} />
            <AvatarFallback className="bg-[#171411] text-[#F2EDDF] font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-[#171411]">{profile.first_name}, {age}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              {profile.city}{profile.state ? `, ${profile.state}` : ''}
            </div>
          </div>
        </div>

        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.messages.first_message_placeholder}
          className="rounded-2xl min-h-[120px] resize-none text-sm"
          autoFocus
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-end -mt-2">{message.length}/500</p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl">
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 bg-[#B8472A] hover:bg-[#7A2E18] text-white rounded-2xl font-bold"
          >
            <Send className="w-4 h-4 me-2" />
            {t.messages.send_request}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
