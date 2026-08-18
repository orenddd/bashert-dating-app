import { convex } from '@/lib/convex/client'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { DbConversation, DbMessage, DbMessageRequest, DbProfile, DbPhoto } from '@/lib/types/database'

export interface ConversationItem {
  conv: DbConversation
  profile: DbProfile
  photo: DbPhoto | null
  unread: number
}

export async function fetchConversations(_userId?: string): Promise<ConversationItem[]> {
  return (await convex.query(api.messages.conversations, {})) as unknown as ConversationItem[]
}

export async function fetchConversation(conversationId: string): Promise<{
  conv: DbConversation; profile: DbProfile | null; photos: DbPhoto[]
} | null> {
  return (await convex.query(api.messages.conversation, {
    conversationId: conversationId as Id<'conversations'>,
  })) as unknown as { conv: DbConversation; profile: DbProfile | null; photos: DbPhoto[] } | null
}

export async function fetchMessages(conversationId: string): Promise<DbMessage[]> {
  return (await convex.query(api.messages.list, {
    conversationId: conversationId as Id<'conversations'>,
  })) as unknown as DbMessage[]
}

export async function sendMessage(
  conversationId: string,
  _senderId: string,
  content: string,
): Promise<DbMessage | null> {
  return (await convex.mutation(api.messages.send, {
    conversationId: conversationId as Id<'conversations'>,
    content,
  })) as unknown as DbMessage | null
}

export async function markMessagesRead(conversationId: string, _userId?: string): Promise<void> {
  await convex.mutation(api.messages.markRead, {
    conversationId: conversationId as Id<'conversations'>,
  })
}

export interface RequestItem {
  req: DbMessageRequest
  profile: DbProfile
  photo: DbPhoto | null
}

export async function fetchMessageRequests(_userId?: string): Promise<RequestItem[]> {
  return (await convex.query(api.messages.requestsReceived, {})) as unknown as RequestItem[]
}

export type SentRequestItem = RequestItem

export async function fetchSentRequests(_userId?: string): Promise<SentRequestItem[]> {
  return (await convex.query(api.messages.requestsSent, {})) as unknown as SentRequestItem[]
}

export async function sendMessageRequest(
  _fromUserId: string,
  toUserId: string,
  initialMessage: string,
): Promise<'ok' | 'already_pending' | 'error'> {
  try {
    return await convex.mutation(api.messages.sendRequest, {
      toUserId: toUserId as Id<'users'>,
      initialMessage,
    })
  } catch {
    return 'error'
  }
}

export type SentStatusMap = Record<string, { status: 'pending' | 'accepted' | 'declined'; conversation_id: string | null }>

export async function fetchSentRequestsMap(_userId?: string): Promise<SentStatusMap> {
  return (await convex.query(api.messages.sentStatusMap, {})) as SentStatusMap
}

export async function acceptMessageRequest(
  requestId: string,
  _userId?: string,
): Promise<DbConversation | null> {
  return (await convex.mutation(api.messages.acceptRequest, {
    requestId: requestId as Id<'message_requests'>,
  })) as unknown as DbConversation | null
}

export async function declineMessageRequest(requestId: string): Promise<void> {
  await convex.mutation(api.messages.declineRequest, {
    requestId: requestId as Id<'message_requests'>,
  })
}
