import { createClient } from '@/lib/supabase/client'
import type { DbConversation, DbMessage, DbMessageRequest, DbProfile, DbPhoto } from '@/lib/types/database'

type R<T> = { data: T | null; error: { message: string } | null }

export interface ConversationItem {
  conv: DbConversation
  profile: DbProfile
  photo: DbPhoto | null
  unread: number
}

export async function fetchConversations(userId: string): Promise<ConversationItem[]> {
  const supabase = createClient()

  const { data: convs } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false }) as unknown as R<DbConversation[]>

  if (!convs?.length) return []

  const otherIds = convs.map(c => c.participant1_id === userId ? c.participant2_id : c.participant1_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', otherIds) as unknown as R<DbProfile[]>
  const { data: photos } = await supabase.from('photos').select('*').in('user_id', otherIds).eq('is_primary', true) as unknown as R<DbPhoto[]>

  const { data: unreadMsgs } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convs.map(c => c.id))
    .eq('is_read', false)
    .neq('sender_id', userId) as unknown as R<{ conversation_id: string }[]>

  return convs
    .map(conv => {
      const otherId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id
      const profile = (profiles ?? []).find(p => p.user_id === otherId)
      if (!profile) return null
      const photo = (photos ?? []).find(ph => ph.user_id === otherId) ?? null
      const unread = (unreadMsgs ?? []).filter(m => m.conversation_id === conv.id).length
      return { conv, profile, photo, unread }
    })
    .filter(Boolean) as ConversationItem[]
}

export async function fetchMessages(conversationId: string): Promise<DbMessage[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true }) as unknown as R<DbMessage[]>
  return data ?? []
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<DbMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content, is_read: false } as never)
    .select()
    .single() as unknown as R<DbMessage>

  if (error || !data) return null

  await (supabase.from('conversations').update({ last_message_at: data.created_at, last_message_preview: content.slice(0, 100) } as never) as unknown as { eq: (col: string, val: string) => Promise<void> })
    .eq('id', conversationId)

  return data
}

export async function markMessagesRead(conversationId: string, userId: string): Promise<void> {
  const supabase = createClient()
  await (supabase.from('messages').update({ is_read: true } as never) as unknown as {
    eq: (col: string, val: string) => { neq: (col: string, val: string) => { eq: (col: string, val: boolean) => Promise<void> } }
  })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false)
}

export interface RequestItem {
  req: DbMessageRequest
  profile: DbProfile
  photo: DbPhoto | null
}

export async function fetchMessageRequests(userId: string): Promise<RequestItem[]> {
  const supabase = createClient()
  const { data: reqs } = await supabase
    .from('message_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as unknown as R<DbMessageRequest[]>

  if (!reqs?.length) return []

  const fromIds = reqs.map(r => r.from_user_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', fromIds) as unknown as R<DbProfile[]>
  const { data: photos } = await supabase.from('photos').select('*').in('user_id', fromIds).eq('is_primary', true) as unknown as R<DbPhoto[]>

  return reqs
    .map(req => {
      const profile = (profiles ?? []).find(p => p.user_id === req.from_user_id)
      if (!profile) return null
      const photo = (photos ?? []).find(ph => ph.user_id === req.from_user_id) ?? null
      return { req, profile, photo }
    })
    .filter(Boolean) as RequestItem[]
}

export async function sendMessageRequest(
  fromUserId: string,
  toUserId: string,
  initialMessage: string,
): Promise<'ok' | 'already_pending' | 'error'> {
  const supabase = createClient()

  // Check for existing request
  const { data: existing } = await supabase
    .from('message_requests')
    .select('id, status')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .maybeSingle() as unknown as R<{ id: string; status: string }>

  if (existing) {
    if (existing.status === 'pending') return 'already_pending'
    if (existing.status === 'accepted') return 'ok'
    // declined → re-open with new message
    const { error } = await supabase
      .from('message_requests')
      .update({ status: 'pending', initial_message: initialMessage } as never)
      .eq('id', existing.id) as unknown as R<null>
    return error ? 'error' : 'ok'
  }

  const { error } = await supabase
    .from('message_requests')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId, initial_message: initialMessage, status: 'pending' } as never) as unknown as R<null>
  return error ? 'error' : 'ok'
}

// Map of to_user_id → { status, conversation_id } for all requests sent by userId
export type SentStatusMap = Record<string, { status: 'pending' | 'accepted' | 'declined'; conversation_id: string | null }>

export async function fetchSentRequestsMap(userId: string): Promise<SentStatusMap> {
  const supabase = createClient()
  const { data } = await supabase
    .from('message_requests')
    .select('to_user_id, status, conversation_id')
    .eq('from_user_id', userId) as unknown as R<{ to_user_id: string; status: string; conversation_id: string | null }[]>

  const map: SentStatusMap = {}
  for (const r of data ?? []) {
    map[r.to_user_id] = {
      status: r.status as 'pending' | 'accepted' | 'declined',
      conversation_id: r.conversation_id,
    }
  }
  return map
}

export async function acceptMessageRequest(requestId: string, userId: string): Promise<DbConversation | null> {
  const supabase = createClient()
  const { data: req } = await supabase
    .from('message_requests')
    .select('*')
    .eq('id', requestId)
    .single() as unknown as R<DbMessageRequest>

  if (!req) return null

  const { data: conv } = await supabase
    .from('conversations')
    .insert({
      request_id: requestId,
      participant1_id: req.from_user_id,
      participant2_id: userId,
      last_message_at: new Date().toISOString(),
      last_message_preview: req.initial_message.slice(0, 100),
    } as never)
    .select()
    .single() as unknown as R<DbConversation>

  if (conv) {
    await supabase
      .from('messages')
      .insert({ conversation_id: conv.id, sender_id: req.from_user_id, content: req.initial_message, is_read: false } as never)

    await (supabase.from('message_requests').update({ status: 'accepted', conversation_id: conv.id } as never) as unknown as {
      eq: (col: string, val: string) => Promise<void>
    }).eq('id', requestId)
  }

  return conv ?? null
}

export async function declineMessageRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  await (supabase.from('message_requests').update({ status: 'declined' } as never) as unknown as {
    eq: (col: string, val: string) => Promise<void>
  }).eq('id', requestId)
}

export interface SentRequestItem {
  req: DbMessageRequest
  profile: DbProfile
  photo: DbPhoto | null
}

export async function fetchSentRequests(userId: string): Promise<SentRequestItem[]> {
  const supabase = createClient()
  const { data: reqs } = await supabase
    .from('message_requests')
    .select('*')
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as unknown as R<DbMessageRequest[]>

  if (!reqs?.length) return []

  const toIds = reqs.map(r => r.to_user_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', toIds) as unknown as R<DbProfile[]>
  const { data: photos } = await supabase.from('photos').select('*').in('user_id', toIds).eq('is_primary', true) as unknown as R<DbPhoto[]>

  return reqs
    .map(req => {
      const profile = (profiles ?? []).find(p => p.user_id === req.to_user_id)
      if (!profile) return null
      const photo = (photos ?? []).find(ph => ph.user_id === req.to_user_id) ?? null
      return { req, profile, photo }
    })
    .filter(Boolean) as SentRequestItem[]
}
