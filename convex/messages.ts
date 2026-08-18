import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { withId, requireUserId, currentUserId, getProfile, photosForUsers } from './helpers'

async function conversationsOf(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'conversations'>[]> {
  const as1 = await ctx.db.query('conversations').withIndex('by_participant1', (q) => q.eq('participant1_id', userId)).take(300)
  const as2 = await ctx.db.query('conversations').withIndex('by_participant2', (q) => q.eq('participant2_id', userId)).take(300)
  return [...as1, ...as2].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
}

export const conversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const convs = await conversationsOf(ctx, userId)
    const otherIds = convs.map((c) => (c.participant1_id === userId ? c.participant2_id : c.participant1_id))
    const photos = await photosForUsers(ctx, otherIds)

    const out = []
    for (const conv of convs) {
      const otherId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id
      const profile = await getProfile(ctx, otherId)
      if (!profile) continue
      const unreadRows = await ctx.db
        .query('messages')
        .withIndex('by_conversation_and_read', (q) => q.eq('conversation_id', conv._id).eq('is_read', false))
        .take(200)
      out.push({
        conv: withId(conv),
        profile: withId(profile),
        photo: photos.find((p) => p.user_id === otherId && p.is_primary) ?? photos.find((p) => p.user_id === otherId) ?? null,
        unread: unreadRows.filter((m) => m.sender_id !== userId).length,
      })
    }
    return out
  },
})

// שיחה בודדת + הפרופיל של הצד השני (רק למשתתפים)
export const conversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx)
    if (!userId) return null
    const conv = await ctx.db.get('conversations', args.conversationId)
    if (!conv) return null
    if (conv.participant1_id !== userId && conv.participant2_id !== userId) return null
    const otherId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id
    const profile = await getProfile(ctx, otherId)
    const photos = await photosForUsers(ctx, [otherId])
    return {
      conv: withId(conv),
      profile: profile ? withId(profile) : null,
      photos: photos.sort((a, b) => a.order_index - b.order_index),
    }
  },
})

export const list = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const conv = await ctx.db.get('conversations', args.conversationId)
    if (!conv || (conv.participant1_id !== userId && conv.participant2_id !== userId)) return []
    const rows = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversation_id', args.conversationId))
      .take(500)
    return rows.map(withId)
  },
})

export const send = mutation({
  args: { conversationId: v.id('conversations'), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const content = args.content.trim()
    if (!content) throw new Error('הודעה ריקה')
    if (content.length > 2000) throw new Error('ההודעה ארוכה מדי')

    const conv = await ctx.db.get('conversations', args.conversationId)
    if (!conv || (conv.participant1_id !== userId && conv.participant2_id !== userId)) {
      throw new Error('אין הרשאה לשיחה הזו')
    }

    const now = new Date().toISOString()
    const id = await ctx.db.insert('messages', {
      conversation_id: args.conversationId,
      sender_id: userId,
      content,
      is_read: false,
      created_at: now,
    })
    // מחליף את הטריגר update_conversation_preview
    await ctx.db.patch('conversations', args.conversationId, {
      last_message_at: now,
      last_message_preview: content.slice(0, 100),
    })
    const msg = await ctx.db.get('messages', id)
    return msg ? withId(msg) : null
  },
})

export const markRead = mutation({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const conv = await ctx.db.get('conversations', args.conversationId)
    if (!conv || (conv.participant1_id !== userId && conv.participant2_id !== userId)) return null
    const unread = await ctx.db
      .query('messages')
      .withIndex('by_conversation_and_read', (q) => q.eq('conversation_id', args.conversationId).eq('is_read', false))
      .take(500)
    for (const msg of unread) {
      if (msg.sender_id === userId) continue
      await ctx.db.patch('messages', msg._id, { is_read: true })
    }
    return null
  },
})

// ─── בקשות הודעה ────────────────────────────────────────────────────────────

async function hydrateRequests(ctx: QueryCtx, reqs: Doc<'message_requests'>[], otherOf: (r: Doc<'message_requests'>) => Id<'users'>) {
  const photos = await photosForUsers(ctx, reqs.map(otherOf))
  const out = []
  for (const req of reqs) {
    const otherId = otherOf(req)
    const profile = await getProfile(ctx, otherId)
    if (!profile) continue
    out.push({
      req: withId(req),
      profile: withId(profile),
      photo: photos.find((p) => p.user_id === otherId && p.is_primary) ?? photos.find((p) => p.user_id === otherId) ?? null,
    })
  }
  return out
}

export const requestsReceived = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const reqs = await ctx.db
      .query('message_requests')
      .withIndex('by_to_and_status', (q) => q.eq('to_user_id', userId).eq('status', 'pending'))
      .order('desc')
      .take(200)
    return await hydrateRequests(ctx, reqs, (r) => r.from_user_id)
  },
})

export const requestsSent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const reqs = (
      await ctx.db.query('message_requests').withIndex('by_from', (q) => q.eq('from_user_id', userId)).order('desc').take(300)
    ).filter((r) => r.status === 'pending')
    return await hydrateRequests(ctx, reqs, (r) => r.to_user_id)
  },
})

// מפה של to_user_id → סטטוס הבקשה ששלחתי, לשימוש בכפתורי הפרופיל
export const sentStatusMap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return {}
    const reqs = await ctx.db.query('message_requests').withIndex('by_from', (q) => q.eq('from_user_id', userId)).take(500)
    const map: Record<string, { status: string; conversation_id: string | null }> = {}
    for (const r of reqs) {
      map[String(r.to_user_id)] = {
        status: r.status,
        conversation_id: r.conversation_id ? String(r.conversation_id) : null,
      }
    }
    return map
  },
})

export const sendRequest = mutation({
  args: { toUserId: v.id('users'), initialMessage: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const message = args.initialMessage.trim()
    if (!message || message.length > 500) throw new Error('אורך ההודעה אינו תקין')
    if (userId === args.toUserId) throw new Error('אי אפשר לשלוח בקשה לעצמך')

    const existing = await ctx.db
      .query('message_requests')
      .withIndex('by_from_and_to', (q) => q.eq('from_user_id', userId).eq('to_user_id', args.toUserId))
      .unique()

    if (existing) {
      if (existing.status === 'pending') return 'already_pending' as const
      if (existing.status === 'accepted') return 'ok' as const
      await ctx.db.patch('message_requests', existing._id, { status: 'pending', initial_message: message })
      return 'ok' as const
    }

    await ctx.db.insert('message_requests', {
      from_user_id: userId,
      to_user_id: args.toUserId,
      initial_message: message,
      status: 'pending',
      conversation_id: null,
      created_at: new Date().toISOString(),
    })
    return 'ok' as const
  },
})

// אישור בקשה — יוצר שיחה ומכניס את ההודעה הראשונה
// (מחליף את הטריגר on_request_accepted)
export const acceptRequest = mutation({
  args: { requestId: v.id('message_requests') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const req = await ctx.db.get('message_requests', args.requestId)
    if (!req) throw new Error('הבקשה לא נמצאה')
    if (req.to_user_id !== userId) throw new Error('אין הרשאה לאשר בקשה זו')
    if (req.conversation_id) {
      const existingConv = await ctx.db.get('conversations', req.conversation_id)
      return existingConv ? withId(existingConv) : null
    }

    const now = new Date().toISOString()
    const convId = await ctx.db.insert('conversations', {
      match_id: null,
      request_id: args.requestId,
      participant1_id: req.from_user_id,
      participant2_id: userId,
      last_message_at: now,
      last_message_preview: req.initial_message.slice(0, 100),
      created_at: now,
    })
    await ctx.db.insert('messages', {
      conversation_id: convId,
      sender_id: req.from_user_id,
      content: req.initial_message,
      is_read: false,
      created_at: now,
    })
    await ctx.db.patch('message_requests', args.requestId, { status: 'accepted', conversation_id: convId })

    const conv = await ctx.db.get('conversations', convId)
    return conv ? withId(conv) : null
  },
})

export const declineRequest = mutation({
  args: { requestId: v.id('message_requests') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const req = await ctx.db.get('message_requests', args.requestId)
    if (!req || req.to_user_id !== userId) throw new Error('אין הרשאה')
    await ctx.db.patch('message_requests', args.requestId, { status: 'declined' })
    return null
  },
})
