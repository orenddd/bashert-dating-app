import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'

const http = httpRouter()
auth.addHttpRoutes(http)

// עדכוני סטטוס מסשן Claude Code שמתקן דיווח (ראו convex/claude.ts)
http.route({
  path: '/claude/ticket-update',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const body: unknown = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return new Response('bad request', { status: 400 })
    const b = body as Record<string, unknown>
    const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : undefined)
    const ticketId = str('ticket_id')
    const token = str('token')
    const status = str('status')
    if (!ticketId || !token || !status) return new Response('bad request', { status: 400 })

    const ok = await ctx.runMutation(internal.claude.applyUpdate, {
      ticketId,
      token,
      status,
      pr_url: str('pr_url'),
      summary: str('summary'),
      plan: str('plan'),
      note: str('note'),
    })
    return new Response(ok ? 'ok' : 'forbidden', { status: ok ? 200 : 403 })
  }),
})

export default http
