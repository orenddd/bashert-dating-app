import { v } from 'convex/values'
import { mutation } from './_generated/server'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { requireAdmin, getProfile } from './helpers'

// מחיקת שיחה על כל הודעותיה
async function deleteConversation(ctx: MutationCtx, convId: Id<'conversations'>) {
  const msgs = await ctx.db
    .query('messages')
    .withIndex('by_conversation', (q) => q.eq('conversation_id', convId))
    .take(1000)
  for (const m of msgs) await ctx.db.delete('messages', m._id)
  await ctx.db.delete('conversations', convId)
}

// מחיקת משתמש מלאה. ב-Postgres זה נעשה ב-ON DELETE CASCADE;
// ב-Convex אין מחיקה מדורגת, ולכן כל טבלה מנוקה במפורש.
export const deleteUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx)
    if (adminId === args.userId) throw new Error('לא ניתן למחוק את החשבון של עצמך')
    const target = args.userId

    // תמונות + הקבצים עצמם
    const photos = await ctx.db.query('photos').withIndex('by_user_id', (q) => q.eq('user_id', target)).take(200)
    for (const photo of photos) {
      if (photo.storage_id) await ctx.storage.delete(photo.storage_id)
      await ctx.db.delete('photos', photo._id)
    }

    // לייקים (בשני הכיוונים)
    for (const like of await ctx.db.query('likes').withIndex('by_from', (q) => q.eq('from_user_id', target)).take(1000)) {
      await ctx.db.delete('likes', like._id)
    }
    for (const like of await ctx.db.query('likes').withIndex('by_to', (q) => q.eq('to_user_id', target)).take(1000)) {
      await ctx.db.delete('likes', like._id)
    }

    // התאמות
    for (const m of await ctx.db.query('matches').withIndex('by_user1', (q) => q.eq('user1_id', target)).take(1000)) {
      await ctx.db.delete('matches', m._id)
    }
    for (const m of await ctx.db.query('matches').withIndex('by_user2', (q) => q.eq('user2_id', target)).take(1000)) {
      await ctx.db.delete('matches', m._id)
    }

    // שיחות + הודעות
    for (const c of await ctx.db.query('conversations').withIndex('by_participant1', (q) => q.eq('participant1_id', target)).take(500)) {
      await deleteConversation(ctx, c._id)
    }
    for (const c of await ctx.db.query('conversations').withIndex('by_participant2', (q) => q.eq('participant2_id', target)).take(500)) {
      await deleteConversation(ctx, c._id)
    }

    // בקשות הודעה
    for (const r of await ctx.db.query('message_requests').withIndex('by_from', (q) => q.eq('from_user_id', target)).take(500)) {
      await ctx.db.delete('message_requests', r._id)
    }
    for (const r of await ctx.db.query('message_requests').withIndex('by_to', (q) => q.eq('to_user_id', target)).take(500)) {
      await ctx.db.delete('message_requests', r._id)
    }

    // מנויים, חסימות, דיווחים, פידבק
    for (const s of await ctx.db.query('subscriptions').withIndex('by_user_id', (q) => q.eq('user_id', target)).take(200)) {
      await ctx.db.delete('subscriptions', s._id)
    }
    for (const b of await ctx.db.query('blocks').withIndex('by_blocker', (q) => q.eq('blocker_id', target)).take(500)) {
      await ctx.db.delete('blocks', b._id)
    }
    for (const rep of await ctx.db.query('reports').withIndex('by_reported', (q) => q.eq('reported_id', target)).take(500)) {
      await ctx.db.delete('reports', rep._id)
    }
    for (const f of await ctx.db.query('feedback').withIndex('by_user_id', (q) => q.eq('user_id', target)).take(200)) {
      if (f.screenshot_ids?.length) {
        for (const id of f.screenshot_ids) await ctx.storage.delete(id)
      }
      await ctx.db.delete('feedback', f._id)
    }

    // פרופיל
    const profile = await getProfile(ctx, target)
    if (profile) await ctx.db.delete('profiles', profile._id)

    // רשומות ההזדהות של Convex Auth
    const sessions = await ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', target)).take(100)
    for (const session of sessions) {
      const tokens = await ctx.db
        .query('authRefreshTokens')
        .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
        .take(500)
      for (const t of tokens) await ctx.db.delete('authRefreshTokens', t._id)
      await ctx.db.delete('authSessions', session._id)
    }
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', target))
      .take(20)
    for (const account of accounts) {
      const codes = await ctx.db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .take(50)
      for (const c of codes) await ctx.db.delete('authVerificationCodes', c._id)
      await ctx.db.delete('authAccounts', account._id)
    }

    await ctx.db.delete('users', target)
    return { ok: true as const }
  },
})

export const setUserAdmin = mutation({
  args: { userId: v.id('users'), is_admin: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const profile = await getProfile(ctx, args.userId)
    if (!profile) throw new Error('פרופיל לא נמצא')
    await ctx.db.patch('profiles', profile._id, { is_admin: args.is_admin, updated_at: new Date().toISOString() })
    return null
  },
})
