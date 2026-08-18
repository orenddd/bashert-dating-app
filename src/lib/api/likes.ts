import { convex } from '@/lib/convex/client'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { DbLike, DbProfile, DbPhoto, DbMatch } from '@/lib/types/database'

type LikeItem = { like: DbLike; profile: DbProfile; photos: DbPhoto[] }

export async function fetchLikesReceived(_userId?: string): Promise<LikeItem[]> {
  return (await convex.query(api.likes.received, {})) as unknown as LikeItem[]
}

export async function fetchLikesSent(_userId?: string): Promise<LikeItem[]> {
  return (await convex.query(api.likes.sent, {})) as unknown as LikeItem[]
}

// שליחת לייק; אם הוא הדדי — נוצרת התאמה בצד השרת
export async function sendLike(
  _fromUserId: string,
  toUserId: string,
  isSuperLike = false,
): Promise<{ matched: boolean; matchId?: string }> {
  return await convex.mutation(api.likes.send, {
    toUserId: toUserId as Id<'users'>,
    isSuperLike,
  })
}

export async function removeLike(_fromUserId: string, toUserId: string): Promise<void> {
  await convex.mutation(api.likes.remove, { toUserId: toUserId as Id<'users'> })
}

export async function isLiked(_fromUserId: string, toUserId: string): Promise<boolean> {
  return await convex.query(api.likes.isLiked, { toUserId: toUserId as Id<'users'> })
}

export async function fetchMatches(
  _userId?: string,
): Promise<{ match: DbMatch; profile: DbProfile; photos: DbPhoto[] }[]> {
  return (await convex.query(api.likes.myMatches, {})) as unknown as {
    match: DbMatch; profile: DbProfile; photos: DbPhoto[]
  }[]
}
