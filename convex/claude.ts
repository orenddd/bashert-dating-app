import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery, mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { requireAdmin, getProfile } from './helpers'

// תיקון אוטומטי של דיווחים ע"י Claude Code.
// כל דיווח נשלח ל-routine בענן (Routines API); הסשן מתקן על branch ‏claude/…,
// פותח PR, ומדווח חזרה ל-/claude/ticket-update (convex/http.ts) עם טוקן חד-פעמי.
//
// משתני סביבה (npx convex env set …):
//   CLAUDE_ROUTINE_ID     — מזהה ה-routine (trig_…)
//   CLAUDE_ROUTINE_TOKEN  — טוקן ה-API של ה-routine (sk-ant-oat01-…)
//   CLAUDE_AUTOFIX_ALL    — "true" כדי לשלוח גם דיווחים של משתמשים רגילים (ברירת מחדל: רק מנהלים)
//
// ההוראות הקבועות של הסשן נמצאות ב-docs/claude-autofix-routine.md

const CALLBACK_STATUSES = ['working', 'pr_open', 'failed'] as const
const LOG_LIMIT = 40

// ציר הזמן של הטיקט בלוח המשימות
function withLog(row: Doc<'feedback'> | null, status: string, note?: string) {
  const at = new Date().toISOString()
  const entry = note ? { at, status, note: note.slice(0, 1000) } : { at, status }
  return { claude_log: [...(row?.claude_log ?? []), entry].slice(-LOG_LIMIT), claude_updated_at: at }
}

// מסמן את הדיווח כממתין ומתזמן שליחה ל-Claude
export async function queueForClaude(ctx: MutationCtx, feedbackId: Id<'feedback'>) {
  const row = await ctx.db.get('feedback', feedbackId)
  await ctx.db.patch('feedback', feedbackId, {
    claude_status: 'queued',
    claude_error: undefined,
    ...withLog(row, 'queued'),
  })
  await ctx.scheduler.runAfter(0, internal.claude.fire, { feedbackId })
}

export function shouldAutoSend(isAdmin: boolean) {
  return isAdmin || process.env.CLAUDE_AUTOFIX_ALL === 'true'
}

// שליחה ידנית (או שליחה חוזרת) מעמוד הניהול
export const sendToClaude = mutation({
  args: { feedbackId: v.id('feedback') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await queueForClaude(ctx, args.feedbackId)
    return null
  },
})

export const loadTicket = internalQuery({
  args: { feedbackId: v.id('feedback') },
  handler: async (ctx, args) => {
    const row = await ctx.db.get('feedback', args.feedbackId)
    if (!row) return null
    const screenshots = row.screenshot_ids?.length
      ? (await Promise.all(row.screenshot_ids.map((id) => ctx.storage.getUrl(id)))).filter((u): u is string => !!u)
      : row.screenshots
    const profile = await getProfile(ctx, row.user_id)
    return {
      message: row.message,
      category: row.category,
      created_at: row.created_at,
      screenshots,
      reporter: profile ? (profile.display_name || `${profile.first_name} ${profile.last_name}`.trim()) : '',
      reporter_is_admin: profile?.is_admin === true,
    }
  },
})

export const recordFire = internalMutation({
  args: {
    feedbackId: v.id('feedback'),
    claude_status: v.string(),
    claude_token: v.optional(v.string()),
    claude_session_url: v.optional(v.string()),
    claude_error: v.optional(v.string()),
  },
  handler: async (ctx, { feedbackId, ...fields }) => {
    const row = await ctx.db.get('feedback', feedbackId)
    await ctx.db.patch('feedback', feedbackId, {
      ...fields,
      // שליחה חדשה מאפסת את תוצאות הריצה הקודמת
      ...(fields.claude_token ? { claude_pr_url: undefined, claude_summary: undefined, claude_plan: undefined } : {}),
      ...withLog(row, fields.claude_status, fields.claude_error),
    })
    return null
  },
})

export const fire = internalAction({
  args: { feedbackId: v.id('feedback') },
  handler: async (ctx, { feedbackId }): Promise<null> => {
    const routineId = process.env.CLAUDE_ROUTINE_ID
    const routineToken = process.env.CLAUDE_ROUTINE_TOKEN
    const siteUrl = process.env.CONVEX_SITE_URL
    if (!routineId || !routineToken || !siteUrl) {
      await ctx.runMutation(internal.claude.recordFire, {
        feedbackId,
        claude_status: 'error',
        claude_error: 'שירות הפיתוח לא מוגדר (חסרים משתני סביבה)',
      })
      return null
    }

    const ticket = await ctx.runQuery(internal.claude.loadTicket, { feedbackId })
    if (!ticket) return null

    // הטוקן נשמר לפני השליחה, כדי שעדכון מהיר מהסשן לא יידחה
    const token = crypto.randomUUID()
    await ctx.runMutation(internal.claude.recordFire, { feedbackId, claude_status: 'sending', claude_token: token })

    // נתוני הטיקט בלבד — ההוראות יושבות בפרומפט השמור של ה-routine
    const text = [
      `ticket_id: ${feedbackId}`,
      `callback_url: ${siteUrl}/claude/ticket-update`,
      `callback_token: ${token}`,
      `category: ${ticket.category}`,
      `reporter: ${ticket.reporter || 'לא ידוע'}${ticket.reporter_is_admin ? ' (צוות)' : ' (משתמש)'}`,
      `created_at: ${ticket.created_at}`,
      'screenshots:',
      ...(ticket.screenshots.length ? ticket.screenshots.map((u, i) => `  ${i + 1}. ${u}`) : ['  (אין)']),
      'description:',
      '<<<',
      ticket.message,
      '>>>',
    ].join('\n').slice(0, 65000)

    try {
      const res = await fetch(`https://api.anthropic.com/v1/claude_code/routines/${routineId}/fire`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${routineToken}`,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      const body = await res.json().catch(() => null) as
        | { claude_code_session_url?: string; error?: { message?: string } }
        | null
      if (!res.ok) {
        await ctx.runMutation(internal.claude.recordFire, {
          feedbackId,
          claude_status: 'error',
          claude_error: res.status === 429 ? 'יותר מדי משימות בשעה האחרונה — נסו שוב מאוחר יותר' : `שגיאה בשליחה לפיתוח (${res.status})`,
        })
        return null
      }
      await ctx.runMutation(internal.claude.recordFire, {
        feedbackId,
        claude_status: 'sent',
        claude_session_url: body?.claude_code_session_url,
      })
    } catch {
      await ctx.runMutation(internal.claude.recordFire, {
        feedbackId,
        claude_status: 'error',
        claude_error: 'שגיאת תקשורת בשליחה לפיתוח',
      })
    }
    return null
  },
})

// עדכון סטטוס מהסשן בענן (נקרא מ-convex/http.ts)
export const applyUpdate = internalMutation({
  args: {
    ticketId: v.string(),
    token: v.string(),
    status: v.string(),
    pr_url: v.optional(v.string()),
    summary: v.optional(v.string()),
    plan: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId('feedback', args.ticketId)
    if (!id) return false
    const row = await ctx.db.get('feedback', id)
    if (!row?.claude_token || row.claude_token !== args.token) return false
    if (!(CALLBACK_STATUSES as readonly string[]).includes(args.status)) return false

    const now = new Date().toISOString()
    await ctx.db.patch('feedback', id, {
      claude_status: args.status,
      ...(args.pr_url ? { claude_pr_url: args.pr_url.slice(0, 500) } : {}),
      ...(args.summary ? { claude_summary: args.summary.slice(0, 4000) } : {}),
      ...(args.plan ? { claude_plan: args.plan.slice(0, 4000) } : {}),
      ...withLog(row, args.status, args.note ?? args.summary),
      // PR מוכן לבדיקה — הדיווח עצמו עובר ל"נצפה"
      ...(args.status === 'pr_open' && row.status === 'new' ? { status: 'seen', updated_at: now } : {}),
    })
    return true
  },
})
