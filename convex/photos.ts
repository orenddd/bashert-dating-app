import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { requireUserId, currentUserId, hydratePhotos, photosForUsers } from './helpers'

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const photos = await photosForUsers(ctx, [userId])
    photos.sort((a, b) => a.order_index - b.order_index)
    return photos
  },
})

export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const photos = await photosForUsers(ctx, [args.userId])
    photos.sort((a, b) => a.order_index - b.order_index)
    return photos
  },
})

// שלב 1 בהעלאת מדיה: כתובת חד-פעמית להעלאה ישירות ל-Convex Storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

const photoInput = v.object({
  id: v.optional(v.id('photos')),          // קיים — נשמר ומעודכן
  storage_id: v.optional(v.id('_storage')), // חדש — הועלה זה עתה
  is_primary: v.boolean(),
  order_index: v.number(),
  media_type: v.optional(v.string()),
  face_focus_x: v.optional(v.union(v.number(), v.null())),
  face_focus_y: v.optional(v.union(v.number(), v.null())),
})

// שמירת מערך התמונות של המשתמש כמקשה אחת:
// פריטים עם id נשמרים, חדשים נוספים, וכל מה שלא ברשימה נמחק (כולל הקובץ)
export const saveAll = mutation({
  args: { photos: v.array(photoInput) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('photos')
      .withIndex('by_user_id', (q) => q.eq('user_id', userId))
      .take(50)

    const keptIds = new Set(args.photos.map((p) => p.id).filter(Boolean).map(String))
    for (const photo of existing) {
      if (keptIds.has(String(photo._id))) continue
      if (photo.storage_id) await ctx.storage.delete(photo.storage_id)
      await ctx.db.delete('photos', photo._id)
    }

    const now = new Date().toISOString()
    for (const input of args.photos) {
      const fields = {
        is_primary: input.is_primary,
        order_index: input.order_index,
        media_type: input.media_type ?? 'image',
        face_focus_x: input.face_focus_x ?? null,
        face_focus_y: input.face_focus_y ?? null,
      }
      if (input.id) {
        const owned = existing.find((p) => String(p._id) === String(input.id))
        if (!owned) continue // לא שלו — מתעלמים
        await ctx.db.patch('photos', input.id, fields)
      } else if (input.storage_id) {
        await ctx.db.insert('photos', {
          user_id: userId,
          storage_id: input.storage_id,
          url: null,
          thumbnail_url: null,
          created_at: now,
          ...fields,
        })
      }
    }

    const updated = await ctx.db
      .query('photos')
      .withIndex('by_user_id_and_order', (q) => q.eq('user_id', userId))
      .take(50)
    return await hydratePhotos(ctx, updated)
  },
})

// מחיקת קובץ שהועלה אך לא נשמר (ביטול בעורך)
export const discardUpload = mutation({
  args: { storage_id: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    const used = await ctx.db.query('photos').take(1000)
    if (used.some((p) => p.storage_id === args.storage_id)) return null
    await ctx.storage.delete(args.storage_id)
    return null
  },
})

// כתובת לצפייה בקובץ שהועלה (לפני שנשמר כרשומת תמונה)
export const storageUrl = query({
  args: { storage_id: v.id('_storage') },
  handler: async (ctx, args) => await ctx.storage.getUrl(args.storage_id),
})
