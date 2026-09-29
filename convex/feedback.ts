import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { withId, requireUserId, requireAdmin, getProfile } from './helpers'
import { queueForClaude, shouldAutoSend } from './claude'

export const submit = mutation({
  args: {
    message: v.string(),
    category: v.string(),
    screenshot_ids: v.optional(v.array(v.id('_storage'))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const message = args.message.trim()
    if (!message) throw new Error('הודעה ריקה')

    const ids = args.screenshot_ids ?? []
    const urls: string[] = []
    for (const id of ids) {
      const url = await ctx.storage.getUrl(id)
      if (url) urls.push(url)
    }

    const now = new Date().toISOString()
    const feedbackId = await ctx.db.insert('feedback', {
      user_id: userId,
      message,
      category: args.category || 'general',
      screenshots: urls,
      screenshot_ids: ids,
      status: 'new',
      admin_note: '',
      created_at: now,
      updated_at: now,
    })

    // דיווח חדש נשלח מיד ל-Claude לתיקון (מנהלים תמיד; משתמשים רק אם CLAUDE_AUTOFIX_ALL)
    const profile = await getProfile(ctx, userId)
    if (shouldAutoSend(profile?.is_admin === true)) {
      await queueForClaude(ctx, feedbackId)
    }
    return null
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db.query('feedback').take(500)
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const out = []
    for (const row of rows) {
      const profile = await getProfile(ctx, row.user_id)
      // כתובות התמונות נפתרות מחדש כדי שיישארו תקפות
      const screenshots = row.screenshot_ids?.length
        ? (await Promise.all(row.screenshot_ids.map((id) => ctx.storage.getUrl(id)))).filter((u): u is string => !!u)
        : row.screenshots
      // הטוקן וקישור הסשן לא יוצאים לדפדפן — בממשק מוצג רק "צוות הפיתוח"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { claude_token, claude_session_url, ...publicRow } = row
      out.push({
        ...withId(publicRow),
        screenshots,
        user_name: profile ? (profile.display_name || `${profile.first_name} ${profile.last_name}`.trim()) : '',
      })
    }
    return out
  },
})

export const setStatus = mutation({
  args: { feedbackId: v.id('feedback'), status: v.string(), admin_note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('feedback', args.feedbackId, {
      status: args.status,
      ...(args.admin_note !== undefined ? { admin_note: args.admin_note } : {}),
      updated_at: new Date().toISOString(),
    })
    return null
  },
})

// העלאת צילומי מסך לפידבק
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})
