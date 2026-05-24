'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { fetchMessages, sendMessage, markMessagesRead } from '@/lib/api/messages'
import { fetchProfile } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/client'
import type { DbMessage, DbProfile, DbPhoto } from '@/lib/types/database'
import { Send, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/shared/AuthProvider'

export default function ChatPage() {
  const { t, isRTL } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const conversationId = params.id as string
  const [messages, setMessages] = useState<DbMessage[]>([])
  const [otherProfile, setOtherProfile] = useState<DbProfile | null>(null)
  const [otherPhoto, setOtherPhoto] = useState<DbPhoto | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const BackArrow = isRTL ? ArrowRight : ArrowLeft
  const supabase = createClient()

  const loadConversation = useCallback(async () => {
    if (!user) return
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single() as unknown as { data: import('@/lib/types/database').DbConversation | null; error: unknown }

    if (!conv) { setLoading(false); return }

    const otherId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
    const [msgs, profileData] = await Promise.all([
      fetchMessages(conversationId),
      fetchProfile(otherId),
    ])

    setMessages(msgs)
    if (profileData) {
      setOtherProfile(profileData.profile)
      setOtherPhoto(profileData.photos.find(p => p.is_primary) ?? profileData.photos[0] ?? null)
    }
    setLoading(false)
    markMessagesRead(conversationId, user.id)
  }, [user, conversationId, supabase])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DbMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !user) return
    const content = input.trim()
    setInput('')
    const msg = await sendMessage(conversationId, user.id, content)
    if (msg) setMessages(prev => [...prev, msg])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts: string) => {
    const d = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return t.messages.today
    if (d.toDateString() === yesterday.toDateString()) return t.messages.yesterday
    return d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-[#F2EDDF] border-b border-[rgba(23,20,17,0.08)] px-4 py-3 h-16 animate-pulse" />
        <div className="flex-1 bg-[#EBE4D2]" />
      </div>
    )
  }

  if (!otherProfile) {
    return <div className="p-8 text-center text-gray-400">שיחה לא נמצאה</div>
  }

  const photoUrl = otherPhoto?.url ?? `https://picsum.photos/seed/${otherProfile.user_id}-1/80/80`
  const initials = `${otherProfile.first_name[0]}${otherProfile.last_name[0]}`
  let lastDate = ''

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-[#F2EDDF] border-b border-[rgba(23,20,17,0.08)] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/messages"><BackArrow className="w-5 h-5" /></Link>
        </Button>
        <Link href={`/profile/${otherProfile.user_id}`} className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={photoUrl} />
              <AvatarFallback className="bg-[#1a3a5c] text-white text-sm">{initials}</AvatarFallback>
            </Avatar>
            {otherProfile.is_online && (
              <div className="absolute bottom-0 end-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <p className="font-semibold text-[#171411]">{otherProfile.first_name}</p>
            <p className="text-xs text-gray-400">
              {otherProfile.is_online ? t.profile.online : t.profile.last_seen}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div dir="ltr" className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#EBE4D2]">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">{t.messages.no_messages}</p>
            <p className="text-gray-300 text-xs">{t.messages.no_messages_sub}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          const dateLabel = formatDate(msg.created_at)
          const showDate = dateLabel !== lastDate
          lastDate = dateLabel
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">{dateLabel}</span>
                </div>
              )}
              <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div
                  dir="auto"
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                    isMe
                      ? 'bg-[#171411] text-[#F2EDDF] rounded-br-sm'
                      : 'bg-[#FBF6E8] text-[#171411] border border-[rgba(23,20,17,0.08)] rounded-bl-sm shadow-sm'
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={cn('text-xs mt-1 text-right', isMe ? 'text-white/50' : 'text-gray-400')}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-[#F2EDDF] border-t border-[rgba(23,20,17,0.08)] p-4">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.messages.type_message}
            className="min-h-[44px] max-h-28 resize-none rounded-2xl flex-1 text-sm"
            rows={1}
          />
          <Button
            onClick={send}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-2xl bg-[#B8472A] hover:bg-[#7A2E18] text-white flex-shrink-0 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
