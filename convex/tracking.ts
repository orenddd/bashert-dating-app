import { v } from 'convex/values'
import { query } from './_generated/server'

// דוח המעקב מוגן בסיסמה בלבד (כמו קודם ב-route של Next),
// והסיסמה נבדקת כאן בצד השרת מול משתנה סביבה של Convex.
export const report = query({
  args: { password: v.string(), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const expected = process.env.TRACKING_PASSWORD
    if (!expected || args.password !== expected) throw new Error('סיסמה שגויה')

    const from = args.from ? `${args.from}T00:00:00` : null
    const to = args.to ? `${args.to}T23:59:59` : null

    const profiles = (await ctx.db.query('profiles').take(2000))
      .filter((p) => (!from || p.created_at >= from) && (!to || p.created_at <= to))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    const emailById = new Map<string, string>()
    for (const user of await ctx.db.query('users').take(2000)) {
      if (user.email) emailById.set(String(user._id), user.email)
    }

    const rows = profiles.map((p) => ({
      user_id: String(p.user_id),
      name: (p.display_name || `${p.first_name} ${p.last_name}`).trim() || '—',
      email: emailById.get(String(p.user_id)) ?? '—',
      phone: p.phone_number || '—',
      gender: p.gender,
      city: p.city || '',
      complete: p.profile_complete,
      created_at: p.created_at,
    }))

    const feedbackRows = []
    for (const f of (await ctx.db.query('feedback').take(500)).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      const screenshots = f.screenshot_ids?.length
        ? (await Promise.all(f.screenshot_ids.map((id) => ctx.storage.getUrl(id)))).filter((u): u is string => !!u)
        : f.screenshots
      feedbackRows.push({
        id: String(f._id),
        message: f.message,
        category: f.category,
        status: f.status,
        screenshots,
        created_at: f.created_at,
        email: emailById.get(String(f.user_id)) ?? '—',
      })
    }

    return {
      profiles: rows,
      feedback: feedbackRows,
      totals: {
        profiles: rows.length,
        completed: rows.filter((r) => r.complete).length,
        male: rows.filter((r) => r.gender === 'male').length,
        female: rows.filter((r) => r.gender === 'female').length,
        feedback: feedbackRows.length,
      },
    }
  },
})
