import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

// הפרונטאנד עובד עם `id` (כמו ב-Postgres); Convex מספק `_id`
export function withId<T extends { _id: unknown }>(doc: T): T & { id: string } {
  return { ...doc, id: String(doc._id) }
}

export async function currentUserId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  return await getAuthUserId(ctx)
}

export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new Error('נדרשת התחברות')
  return userId
}

export async function getProfile(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('profiles')
    .withIndex('by_user_id', (q) => q.eq('user_id', userId))
    .unique()
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await requireUserId(ctx)
  const profile = await getProfile(ctx, userId)
  if (!profile?.is_admin) throw new Error('נדרשת הרשאת מנהל')
  return userId
}

export type PhotoOut = Omit<Doc<'photos'>, 'url'> & { id: string; url: string | null }

// המדיה יושבת ב-Convex Storage; ה-URL נפתר בצד השרת כדי שהפרונטאנד
// יקבל בדיוק את מה שהוא קיבל מ-Supabase (שדה `url` מוכן לשימוש)
export async function hydratePhoto(ctx: QueryCtx | MutationCtx, photo: Doc<'photos'>): Promise<PhotoOut> {
  const url = photo.storage_id ? await ctx.storage.getUrl(photo.storage_id) : (photo.url ?? null)
  return { ...withId(photo), url }
}

export async function hydratePhotos(ctx: QueryCtx | MutationCtx, photos: Doc<'photos'>[]): Promise<PhotoOut[]> {
  return await Promise.all(photos.map((p) => hydratePhoto(ctx, p)))
}

export async function photosForUsers(ctx: QueryCtx | MutationCtx, userIds: Id<'users'>[]): Promise<PhotoOut[]> {
  const all: Doc<'photos'>[] = []
  for (const userId of userIds) {
    const photos = await ctx.db
      .query('photos')
      .withIndex('by_user_id_and_order', (q) => q.eq('user_id', userId))
      .take(12)
    all.push(...photos)
  }
  return await hydratePhotos(ctx, all)
}
