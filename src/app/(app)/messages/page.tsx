'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import {
  fetchConversations,
  fetchMessageRequests,
  fetchSentRequests,
  acceptMessageRequest,
  declineMessageRequest,
  type ConversationItem,
  type RequestItem,
  type SentRequestItem,
} from '@/lib/api/messages'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle, Check, X, Clock } from 'lucide-react'
import type { DbConversation } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/components/shared/AuthProvider'

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchConversations(user.id),
      fetchMessageRequests(user.id),
      fetchSentRequests(user.id),
    ]).then(([convs, reqs, sent]) => {
      setConversations(convs)
      setRequests(reqs)
      setSentRequests(sent)
      setLoading(false)
    })
  }, [user])

  const handleAccept = async (requestId: string) => {
    if (!user) return
    const newConv = await acceptMessageRequest(requestId, user.id)
    if (newConv) {
      const req = requests.find(r => r.req.id === requestId)
      if (req) {
        const newItem: ConversationItem = {
          conv: newConv as DbConversation,
          profile: req.profile,
          photo: req.photo,
          unread: 1,
        }
        setConversations(prev => {
          const exists = prev.some(c => c.conv.id === newConv.id)
          return exists ? prev : [newItem, ...prev]
        })
      }
    }
    setRequests(prev => prev.filter(r => r.req.id !== requestId))
    toast.success(t.messages.accept)
  }

  const handleDecline = async (requestId: string) => {
    await declineMessageRequest(requestId)
    setRequests(prev => prev.filter(r => r.req.id !== requestId))
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return t.messages.today
    if (d.toDateString() === yesterday.toDateString()) return t.messages.yesterday
    return d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <AppHeader title={t.messages.title} />
      <div className="p-4 md:p-6">
        <Tabs defaultValue="conversations">
          <TabsList className="mb-6 bg-[#EBE4D2] rounded-lg p-1">
            <TabsTrigger value="conversations" className="rounded-lg">{t.messages.conversations}</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg relative">
              {t.messages.requests}
              {requests.length > 0 && (
                <span className="ms-1.5 w-5 h-5 bg-[#B8472A] text-white text-xs rounded-full inline-flex items-center justify-center font-bold">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            {loading ? (
              <div className="space-y-2 max-w-2xl">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-[#EBE4D2] rounded-2xl animate-pulse" />)}
              </div>
            ) : conversations.length === 0 && sentRequests.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle className="w-16 h-16 text-[rgba(23,20,17,0.12)] mx-auto mb-4" />
                <p className="text-[rgba(23,20,17,0.45)] font-medium">{t.messages.no_conversations}</p>
                <p className="text-[rgba(23,20,17,0.30)] text-sm mt-2">{t.messages.no_conversations_sub}</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {conversations.map(({ conv, profile, photo, unread }) => {
                  const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/80/80`
                  const initials = `${profile.first_name[0]}${profile.last_name[0]}`
                  return (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="flex items-center gap-4 p-4 bg-[#FBF6E8] rounded-2xl border border-[rgba(23,20,17,0.08)] hover:border-[rgba(23,20,17,0.20)] hover:shadow-sm transition-all"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={photoUrl} />
                          <AvatarFallback className="bg-[#171411] text-[#F2EDDF] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        {profile.is_online && <div className="absolute bottom-0 end-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn('font-semibold text-[#171411] truncate', unread > 0 && 'font-bold')}>
                            {profile.first_name} {profile.last_name[0]}.
                          </p>
                          <span className="text-xs text-[rgba(23,20,17,0.40)] flex-shrink-0 ms-2">{formatDate(conv.last_message_at)}</span>
                        </div>
                        <p className={cn('text-sm truncate', unread > 0 ? 'text-[#171411] font-medium' : 'text-[rgba(23,20,17,0.50)]')}>
                          {conv.last_message_preview}
                        </p>
                      </div>
                      {unread > 0 && (
                        <div className="flex-shrink-0 w-5 h-5 bg-[#B8472A] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{unread}</span>
                        </div>
                      )}
                    </Link>
                  )
                })}

                {sentRequests.map(({ req, profile, photo }) => {
                  const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/80/80`
                  const initials = `${profile.first_name[0]}${profile.last_name[0]}`
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-4 p-4 bg-[#FBF6E8] rounded-2xl border border-dashed border-[rgba(23,20,17,0.15)] opacity-75"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={photoUrl} />
                          <AvatarFallback className="bg-[#171411] text-[#F2EDDF] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[#171411] truncate">
                            {profile.first_name} {profile.last_name[0]}.
                          </p>
                          <span className="text-xs text-[rgba(23,20,17,0.40)] flex-shrink-0 ms-2">{formatDate(req.created_at)}</span>
                        </div>
                        <p className="text-sm truncate text-[rgba(23,20,17,0.50)]">{req.initial_message}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[rgba(23,20,17,0.40)] bg-[#EBE4D2] rounded-full px-2.5 py-1">
                        <Clock className="w-3 h-3" />
                        ממתין
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {loading ? (
              <div className="space-y-3 max-w-2xl">
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 bg-[#EBE4D2] rounded-2xl animate-pulse" />)}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle className="w-16 h-16 text-[rgba(23,20,17,0.12)] mx-auto mb-4" />
                <p className="text-[rgba(23,20,17,0.45)] font-medium">{t.messages.no_requests}</p>
                <p className="text-[rgba(23,20,17,0.30)] text-sm mt-2">{t.messages.no_requests_sub}</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {requests.map(({ req, profile, photo }) => {
                  const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/80/80`
                  const initials = `${profile.first_name[0]}${profile.last_name[0]}`
                  return (
                    <div key={req.id} className="bg-[#FBF6E8] rounded-2xl border border-[rgba(23,20,17,0.08)] p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${profile.user_id}`} className="flex-shrink-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={photoUrl} />
                            <AvatarFallback className="bg-[#171411] text-[#F2EDDF] font-bold">{initials}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${profile.user_id}`}>
                            <p className="font-semibold text-[#171411] hover:underline">{profile.first_name} {profile.last_name[0]}.</p>
                          </Link>
                          <p className="text-xs text-[rgba(23,20,17,0.45)]">{t.messages.message_request_label}</p>
                        </div>
                        <span className="text-xs text-[rgba(23,20,17,0.40)] flex-shrink-0">{formatDate(req.created_at)}</span>
                      </div>
                      <div className="bg-[#EBE4D2] rounded-xl p-3 border border-[rgba(23,20,17,0.06)]">
                        <p className="text-sm text-[#171411] leading-relaxed">{req.initial_message}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-[#171411] hover:bg-[#2A2520] text-[#F2EDDF] rounded-lg font-semibold" onClick={() => handleAccept(req.id)}>
                          <Check className="w-3.5 h-3.5 me-1.5" />{t.messages.accept}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[rgba(23,20,17,0.55)] hover:text-[#B8472A] hover:border-[#B8472A]/40 border-[rgba(23,20,17,0.15)]" onClick={() => handleDecline(req.id)}>
                          <X className="w-3.5 h-3.5 me-1.5" />{t.messages.decline_req}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
