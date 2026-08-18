import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { withId, requireUserId, currentUserId, getProfile, photosForUsers } from './helpers'

async function hydrateLikes(ctx: QueryCtx, likes: Doc<'likes'>[], otherOf: (l: Doc<'likes'>) => Id<'users'>) {
  const photos = await photosForUsers(ctx, likes.map(otherOf))
  const out = []
  for (const like of likes) {
    const otherId = otherOf(like)
    const profile = await getProfile(ctx, otherId)
    if (!profile) continue
    out.push({
      like: withId(like),
      profile: withId(profile),
      photos: photos.filter((p) => p.user_id === otherId),
    })
  }
  return out
}

export const received = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const likes = await ctx.db
      .query('likes')
      .withIndex('by_to', (q) => q.eq('to_user_id', userId))
      .order('desc')
      .take(200)
    return await hydrateLikes(ctx, likes, (l) => l.from_user_id)
  },
})

export const sent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const likes = await ctx.db
      .query('likes')
      .withIndex('by_from', (q) => q.eq('from_user_id', userId))
      .order('desc')
      .take(200)
    return await hydrateLikes(ctx, likes, (l) => l.to_user_id)
  },
})

export const isLiked = query({
  args: { toUserId: v.id('users') },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx)
    if (!userId) return false
    const like = await ctx.db
      .query('likes')
      .withIndex('by_from_and_to', (q) => q.eq('from_user_id', userId).eq('to_user_id', args.toUserId))
      .unique()
    return !!like
  },
})

// שליחת לייק; אם הצד השני כבר עשה לייק — נוצרת התאמה
// (מחליף את הטריגר check_mutual_like שהיה ב-Postgres)
export const send = mutation({
  args: { toUserId: v.id('users'), isSuperLike: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    if (userId === args.toUserId) throw new Error('אי אפשר לסמן לייק לעצמך')

    const existing = await ctx.db
      .query('likes')
      .withIndex('by_from_and_to', (q) => q.eq('from_user_id', userId).eq('to_user_id', args.toUserId))
      .unique()

    if (existing) {
      await ctx.db.patch('likes', existing._id, { is_super_like: args.isSuperLike ?? false })
    } else {
      await ctx.db.insert('likes', {
        from_user_id: userId,
        to_user_id: args.toUserId,
        is_super_like: args.isSuperLike ?? false,
        created_at: new Date().toISOString(),
      })
    }

    const mutual = await ctx.db
      .query('likes')
      .withIndex('by_from_and_to', (q) => q.eq('from_user_id', args.toUserId).eq('to_user_id', userId))
      .unique()
    if (!mutual) return { matched: false as const }

    // סדר קבוע לזוג כדי שלא ייווצרו שתי התאמות לאותו זוג
    const [user1_id, user2_id] = [userId, args.toUserId].sort() as [Id<'users'>, Id<'users'>]
    const already = await ctx.db
      .query('matches')
      .withIndex('by_users', (q) => q.eq('user1_id', user1_id).eq('user2_id', user2_id))
      .unique()
    if (already) return { matched: true as const, matchId: String(already._id) }

    const matchId = await ctx.db.insert('matches', {
      user1_id, user2_id, created_at: new Date().toISOString(),
    })
    return { matched: true as const, matchId: String(matchId) }
  },
})

export const remove = mutation({
  args: { toUserId: v.id('users') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const like = await ctx.db
      .query('likes')
      .withIndex('by_from_and_to', (q) => q.eq('from_user_id', userId).eq('to_user_id', args.toUserId))
      .unique()
    if (like) await ctx.db.delete('likes', like._id)
    return null
  },
})

// ההתאמות שלי, עם פרופיל ותמונות של הצד השני
export const myMatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const asFirst = await ctx.db.query('matches').withIndex('by_user1', (q) => q.eq('user1_id', userId)).take(300)
    const asSecond = await ctx.db.query('matches').withIndex('by_user2', (q) => q.eq('user2_id', userId)).take(300)
    const all = [...asFirst, ...asSecond].sort((a, b) => b.created_at.localeCompare(a.created_at))

    const otherIds = all.map((m) => (m.user1_id === userId ? m.user2_id : m.user1_id))
    const photos = await photosForUsers(ctx, otherIds)

    const out = []
    for (const match of all) {
      const otherId = match.user1_id === userId ? match.user2_id : match.user1_id
      const profile = await getProfile(ctx, otherId)
      if (!profile) continue
      out.push({
        match: withId(match),
        profile: withId(profile),
        photos: photos.filter((p) => p.user_id === otherId),
      })
    }
    return out
  },
})
