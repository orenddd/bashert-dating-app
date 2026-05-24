import type { DbConversation, DbMessage, DbMatch, DbMessageRequest } from '@/lib/types/database'
import { CURRENT_USER_ID } from './mock-profiles'

export const MOCK_MATCHES: DbMatch[] = [
  { id: 'match-001', user1_id: CURRENT_USER_ID, user2_id: 'user-001', created_at: '2024-09-01T10:00:00Z' },
  { id: 'match-002', user1_id: CURRENT_USER_ID, user2_id: 'user-003', created_at: '2024-09-05T10:00:00Z' },
  { id: 'match-003', user1_id: CURRENT_USER_ID, user2_id: 'user-005', created_at: '2024-09-10T10:00:00Z' },
]

export const MOCK_CONVERSATIONS: DbConversation[] = [
  {
    id: 'conv-001', match_id: 'match-001', request_id: null,
    participant1_id: CURRENT_USER_ID, participant2_id: 'user-001',
    last_message_at: '2024-09-15T18:30:00Z',
    last_message_preview: 'שבת שלום! מה קורה?',
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'conv-002', match_id: 'match-002', request_id: null,
    participant1_id: CURRENT_USER_ID, participant2_id: 'user-003',
    last_message_at: '2024-09-14T12:00:00Z',
    last_message_preview: 'Great meeting you here!',
    created_at: '2024-09-05T10:00:00Z',
  },
  {
    id: 'conv-003', match_id: 'match-003', request_id: null,
    participant1_id: CURRENT_USER_ID, participant2_id: 'user-005',
    last_message_at: '2024-09-13T09:00:00Z',
    last_message_preview: 'אפשר לדבר קצת?',
    created_at: '2024-09-10T10:00:00Z',
  },
]

export const MOCK_MESSAGES: DbMessage[] = [
  { id: 'msg-001', conversation_id: 'conv-001', sender_id: 'user-001', content: 'היי! ראיתי את הפרופיל שלך ואהבתי מאוד 😊', is_read: true, created_at: '2024-09-01T11:00:00Z' },
  { id: 'msg-002', conversation_id: 'conv-001', sender_id: CURRENT_USER_ID, content: 'תודה! גם הפרופיל שלך מרתק. איזה כיף שגם את בניו יורק!', is_read: true, created_at: '2024-09-01T11:30:00Z' },
  { id: 'msg-003', conversation_id: 'conv-001', sender_id: 'user-001', content: 'כן! גרה במנהטן כבר כמה שנים. ממה שראיתי אתה גם עובד בהייטק?', is_read: true, created_at: '2024-09-01T12:00:00Z' },
  { id: 'msg-004', conversation_id: 'conv-001', sender_id: CURRENT_USER_ID, content: 'נכון! אולי יום אחד נשב על קפה ונדבר יותר בנינו?', is_read: true, created_at: '2024-09-01T14:00:00Z' },
  { id: 'msg-005', conversation_id: 'conv-001', sender_id: 'user-001', content: 'בשמחה! אבל קודם ספר לי קצת על עצמך...', is_read: true, created_at: '2024-09-02T09:00:00Z' },
  { id: 'msg-006', conversation_id: 'conv-001', sender_id: CURRENT_USER_ID, content: 'בכיף. גדלתי בניו יורק, עושה סטארטאפ בתחום הפינטק...', is_read: true, created_at: '2024-09-05T10:00:00Z' },
  { id: 'msg-007', conversation_id: 'conv-001', sender_id: 'user-001', content: 'שבת שלום! מה קורה?', is_read: false, created_at: '2024-09-15T18:30:00Z' },

  { id: 'msg-008', conversation_id: 'conv-002', sender_id: CURRENT_USER_ID, content: 'Hey Noa! Your profile is amazing. Art director in Miami sounds like a dream!', is_read: true, created_at: '2024-09-05T15:00:00Z' },
  { id: 'msg-009', conversation_id: 'conv-002', sender_id: 'user-003', content: 'Thank you! And yes, Miami has incredible creative energy. Where are you based?', is_read: true, created_at: '2024-09-05T16:00:00Z' },
  { id: 'msg-010', conversation_id: 'conv-002', sender_id: 'user-003', content: 'Great meeting you here!', is_read: false, created_at: '2024-09-14T12:00:00Z' },

  { id: 'msg-011', conversation_id: 'conv-003', sender_id: 'user-005', content: 'שלום! ראיתי שאתה גם מתכנן עלייה? נשמח לדבר!', is_read: true, created_at: '2024-09-10T14:00:00Z' },
  { id: 'msg-012', conversation_id: 'conv-003', sender_id: CURRENT_USER_ID, content: 'אפשר לדבר קצת?', is_read: true, created_at: '2024-09-13T09:00:00Z' },
]

export const MOCK_MESSAGE_REQUESTS: DbMessageRequest[] = [
  {
    id: 'req-001',
    from_user_id: 'user-004',
    to_user_id: CURRENT_USER_ID,
    initial_message: 'היי! ראיתי את הפרופיל שלך ואשמח להכיר. נראה שיש לנו הרבה מהמשותף!',
    status: 'pending',
    conversation_id: null,
    created_at: '2024-09-18T10:00:00Z',
  },
  {
    id: 'req-002',
    from_user_id: 'user-014',
    to_user_id: CURRENT_USER_ID,
    initial_message: 'Hey! Your profile really stood out. I love that you\'re balancing tech and culture. Would love to chat!',
    status: 'pending',
    conversation_id: null,
    created_at: '2024-09-19T14:30:00Z',
  },
  {
    id: 'req-003',
    from_user_id: 'user-019',
    to_user_id: CURRENT_USER_ID,
    initial_message: 'שלום! ראיתי שאתה מתעניין בעלייה. גם אני חושבת על זה ברצינות. מרוצה להכיר!',
    status: 'pending',
    conversation_id: null,
    created_at: '2024-09-20T09:15:00Z',
  },
  {
    id: 'req-s-001',
    from_user_id: CURRENT_USER_ID,
    to_user_id: 'user-009',
    initial_message: 'היי רינה! ראיתי שאת רדיולוגית בהיוסטון. מרשים מאוד. אשמח להכיר אותך!',
    status: 'pending',
    conversation_id: null,
    created_at: '2024-09-16T11:00:00Z',
  },
]

export function mockGetConversations(userId: string): DbConversation[] {
  return MOCK_CONVERSATIONS.filter(
    c => c.participant1_id === userId || c.participant2_id === userId
  ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
}

export function mockGetMessages(conversationId: string): DbMessage[] {
  return MOCK_MESSAGES
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function mockGetMatches(userId: string): DbMatch[] {
  return MOCK_MATCHES.filter(m => m.user1_id === userId || m.user2_id === userId)
}

export function mockGetRequestsReceived(userId: string): DbMessageRequest[] {
  return MOCK_MESSAGE_REQUESTS
    .filter(r => r.to_user_id === userId && r.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function mockGetRequestsSent(userId: string): DbMessageRequest[] {
  return MOCK_MESSAGE_REQUESTS
    .filter(r => r.from_user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

let nextConvId = 10
let nextMsgId = 100

export function mockSendMessageRequest(fromUserId: string, toUserId: string, message: string): DbMessageRequest {
  const existing = MOCK_MESSAGE_REQUESTS.find(
    r => r.from_user_id === fromUserId && r.to_user_id === toUserId
  )
  if (existing) return existing

  const req: DbMessageRequest = {
    id: `req-${Date.now()}`,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    initial_message: message,
    status: 'pending',
    conversation_id: null,
    created_at: new Date().toISOString(),
  }
  MOCK_MESSAGE_REQUESTS.push(req)
  return req
}

export function mockAcceptRequest(requestId: string): DbConversation | null {
  const req = MOCK_MESSAGE_REQUESTS.find(r => r.id === requestId)
  if (!req) return null

  req.status = 'accepted'

  const existingConv = MOCK_CONVERSATIONS.find(
    c =>
      (c.participant1_id === req.from_user_id && c.participant2_id === req.to_user_id) ||
      (c.participant1_id === req.to_user_id && c.participant2_id === req.from_user_id)
  )
  if (existingConv) {
    req.conversation_id = existingConv.id
    return existingConv
  }

  const newConv: DbConversation = {
    id: `conv-req-${++nextConvId}`,
    match_id: null,
    request_id: requestId,
    participant1_id: req.to_user_id,
    participant2_id: req.from_user_id,
    last_message_at: req.created_at,
    last_message_preview: req.initial_message.slice(0, 60),
    created_at: req.created_at,
  }

  const firstMsg: DbMessage = {
    id: `msg-req-${++nextMsgId}`,
    conversation_id: newConv.id,
    sender_id: req.from_user_id,
    content: req.initial_message,
    is_read: false,
    created_at: req.created_at,
  }

  MOCK_CONVERSATIONS.push(newConv)
  MOCK_MESSAGES.push(firstMsg)
  req.conversation_id = newConv.id

  return newConv
}

export function mockSendMessage(conversationId: string, senderId: string, content: string): DbMessage {
  const msg: DbMessage = {
    id: `msg-${++nextMsgId}`,
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    is_read: false,
    created_at: new Date().toISOString(),
  }
  MOCK_MESSAGES.push(msg)
  const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId)
  if (conv) {
    conv.last_message_at = msg.created_at
    conv.last_message_preview = content.slice(0, 60)
  }
  return msg
}

export function mockDeclineRequest(requestId: string) {
  const req = MOCK_MESSAGE_REQUESTS.find(r => r.id === requestId)
  if (req) req.status = 'declined'
}
