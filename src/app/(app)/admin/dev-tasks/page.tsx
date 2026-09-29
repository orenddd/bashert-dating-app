'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { FunctionReturnType } from 'convex/server'
import { useAuth } from '@/components/shared/AuthProvider'
import { FeedbackModal } from '@/components/shared/FeedbackModal'
import { cn } from '@/lib/utils'
import {
  Wrench, ArrowRight, Plus, Inbox, Clock, Loader2, GitPullRequest, AlertTriangle, CheckCircle2,
  X, RotateCcw, Image as ImageIcon, Lightbulb, FileText, History,
} from 'lucide-react'
import { toast } from 'sonner'

// לוח משימות פיתוח. מאחורי הקלעים המשימות מטופלות ע"י Claude (convex/claude.ts),
// אבל בממשק מוצג רק "צוות הפיתוח".
// הנתונים מגיעים ב-useQuery, כך שכל עדכון מהסשן בענן מופיע כאן מיד.

type Ticket = FunctionReturnType<typeof api.feedback.listAll>[number]
type ColumnKey = 'inbox' | 'queued' | 'working' | 'review' | 'blocked' | 'done'

const COLUMNS: { key: ColumnKey; title: string; hint: string; icon: typeof Inbox; tone: string; dot: string }[] = [
  { key: 'inbox', title: 'לא נשלח', hint: 'דיווחים שעוד לא הועברו לפיתוח', icon: Inbox, tone: 'text-slate-600', dot: 'bg-slate-400' },
  { key: 'queued', title: 'בתור', hint: 'הועבר לצוות הפיתוח, ממתין לטיפול', icon: Clock, tone: 'text-sky-700', dot: 'bg-sky-500' },
  { key: 'working', title: 'בפיתוח', hint: 'המפתח מנתח ומתקן עכשיו', icon: Loader2, tone: 'text-blue-700', dot: 'bg-blue-600' },
  { key: 'review', title: 'מוכן לבדיקה', hint: 'נפתח PR — מחכה לאישור שלך', icon: GitPullRequest, tone: 'text-purple-700', dot: 'bg-purple-600' },
  { key: 'blocked', title: 'דורש התערבות', hint: 'הפיתוח צריך הבהרה או שהשליחה נכשלה', icon: AlertTriangle, tone: 'text-orange-700', dot: 'bg-orange-500' },
  { key: 'done', title: 'הושלם', hint: 'סומן כטופל', icon: CheckCircle2, tone: 'text-green-700', dot: 'bg-green-600' },
]

const STATUS_TEXT: Record<string, string> = {
  queued: 'נכנס לתור',
  sending: 'נשלח לפיתוח',
  sent: 'התקבל בפיתוח',
  working: 'בטיפול',
  pr_open: 'נפתח PR',
  failed: 'נדרשת הבהרה',
  error: 'שגיאת שליחה',
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: '🐛 באג',
  feature: '💡 הצעה',
  general: '💬 כללי',
  other: '📝 אחר',
}

function columnOf(t: Ticket): ColumnKey {
  if (t.status === 'resolved') return 'done'
  switch (t.claude_status) {
    case undefined: return 'inbox'
    case 'working': return 'working'
    case 'pr_open': return 'review'
    case 'failed':
    case 'error': return 'blocked'
    default: return 'queued'
  }
}

function timeAgo(iso?: string) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק׳`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `לפני ${hours} שע׳`
  return `לפני ${Math.round(hours / 24)} ימים`
}

export default function DevTasksPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const isAdmin = (user?.profile as unknown as Record<string, unknown>)?.is_admin === true

  const tickets = useQuery(api.feedback.listAll, isAdmin ? {} : 'skip')
  const sendToClaude = useMutation(api.claude.sendToClaude)
  const setStatus = useMutation(api.feedback.setStatus)

  const [openId, setOpenId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (isLoading) return
    if (!user || !isAdmin) router.replace('/home')
  }, [user, isLoading, isAdmin, router])

  // מרענן את "לפני X דק׳" בלי לחכות לעדכון נתונים
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const grouped = useMemo(() => {
    const out: Record<ColumnKey, Ticket[]> = { inbox: [], queued: [], working: [], review: [], blocked: [], done: [] }
    for (const t of tickets ?? []) out[columnOf(t)].push(t)
    for (const key of Object.keys(out) as ColumnKey[]) {
      out[key].sort((a, b) => (b.claude_updated_at ?? b.created_at).localeCompare(a.claude_updated_at ?? a.created_at))
    }
    return out
  }, [tickets])

  const open = tickets?.find(t => t.id === openId) ?? null

  const handleSend = async (id: string) => {
    try {
      await sendToClaude({ feedbackId: id as Id<'feedback'> })
      toast.success('נשלח לצוות הפיתוח')
    } catch {
      toast.error('שגיאה בשליחה לפיתוח')
    }
  }

  const handleStatus = async (id: string, status: 'resolved' | 'seen') => {
    await setStatus({ feedbackId: id as Id<'feedback'>, status })
    toast.success(status === 'resolved' ? 'סומן כהושלם' : 'הוחזר ללוח')
  }

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 pb-28 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin" className="text-[#737373] hover:text-[#0A0A0A] p-1" aria-label="חזרה לניהול">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-[#0A0A0A] whitespace-nowrap">משימות פיתוח</h1>
          <p className="hidden md:block text-sm text-[#737373]">כל דיווח, תוכנית העבודה, מה בטיפול עכשיו ומה מחכה לאישור שלך</p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="w-full md:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#222]"
        >
          <Plus className="w-4 h-4" /> משימה חדשה
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {COLUMNS.map(c => (
          <div key={c.key} className="bg-white border border-[#E5E5E5] rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[#737373] whitespace-nowrap">
              <span className={cn('w-2 h-2 rounded-full', c.dot)} /> {c.title}
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#0A0A0A] mt-0.5">{grouped[c.key].length}</div>
          </div>
        ))}
      </div>

      {tickets === undefined ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Board */
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          {COLUMNS.map(col => {
            const Icon = col.icon
            return (
              <section key={col.key} className="snap-start shrink-0 w-[280px] md:w-auto md:flex-1 md:min-w-[220px] bg-[#F5F5F5] rounded-2xl p-2.5 flex flex-col">
                <header className="px-1.5 pt-1 pb-2.5">
                  <div className={cn('flex items-center gap-1.5 font-semibold text-sm', col.tone)}>
                    <Icon className={cn('w-4 h-4', col.key === 'working' && 'animate-spin')} />
                    {col.title}
                    <span className="ms-auto text-xs font-medium text-[#737373] bg-white rounded-full px-2 py-0.5">{grouped[col.key].length}</span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] mt-0.5">{col.hint}</p>
                </header>

                <div className="space-y-2 flex-1">
                  {grouped[col.key].length === 0 && (
                    <div className="text-center text-xs text-[#A3A3A3] border border-dashed border-[#D9D9D9] rounded-xl py-6">ריק</div>
                  )}
                  {grouped[col.key].map(t => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      column={col.key}
                      onOpen={() => setOpenId(t.id)}
                      onSend={() => handleSend(t.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {open && (
        <TicketDrawer
          ticket={open}
          column={columnOf(open)}
          onClose={() => setOpenId(null)}
          onSend={() => handleSend(open.id)}
          onStatus={s => handleStatus(open.id, s)}
          onImage={setLightbox}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}

      <FeedbackModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}

function TicketCard({ ticket: t, column, onOpen, onSend }: {
  ticket: Ticket
  column: ColumnKey
  onOpen: () => void
  onSend: () => void
}) {
  const last = t.claude_log?.[t.claude_log.length - 1]
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      className={cn(
        'bg-white rounded-xl border border-[#E5E5E5] p-3 cursor-pointer hover:border-[#0A0A0A] hover:shadow-sm transition-all',
        column === 'working' && 'ring-2 ring-blue-500/20 border-blue-200',
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5 text-[11px]">
        <span className="bg-[#F0F0F0] px-1.5 py-0.5 rounded-full text-[#737373]">{CATEGORY_LABELS[t.category] ?? t.category}</span>
        {t.screenshots.length > 0 && (
          <span className="flex items-center gap-0.5 text-[#737373]"><ImageIcon className="w-3 h-3" />{t.screenshots.length}</span>
        )}
        <span className="ms-auto text-[#A3A3A3]">{timeAgo(t.claude_updated_at ?? t.created_at)}</span>
      </div>

      <p className="text-sm text-[#0A0A0A] line-clamp-3 leading-snug">{t.message}</p>

      {t.claude_plan && column !== 'done' && (
        <div className="mt-2 text-xs text-[#525252] bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 line-clamp-2">
          <Lightbulb className="w-3 h-3 inline -mt-0.5 me-1 text-amber-600" />{t.claude_plan}
        </div>
      )}

      {column === 'working' && last?.note && (
        <p className="mt-2 text-xs text-blue-700 flex items-center gap-1 line-clamp-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" /> {last.note}
        </p>
      )}

      {column === 'blocked' && (t.claude_summary || t.claude_error) && (
        <p className="mt-2 text-xs text-orange-700 line-clamp-2">{t.claude_error ?? t.claude_summary}</p>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        {t.user_name && <span className="text-[11px] text-[#A3A3A3] truncate">👤 {t.user_name}</span>}
        <div className="ms-auto flex gap-1.5" onClick={e => e.stopPropagation()}>
          {t.claude_pr_url && (
            <a href={t.claude_pr_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
              <GitPullRequest className="w-3 h-3" /> PR
            </a>
          )}
          {(column === 'inbox' || column === 'blocked') && (
            <button onClick={onSend}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-[#0A0A0A] text-white hover:bg-[#222]">
              <Wrench className="w-3 h-3" /> {column === 'inbox' ? 'שלח לפיתוח' : 'שלח שוב'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TicketDrawer({ ticket: t, column, onClose, onSend, onStatus, onImage }: {
  ticket: Ticket
  column: ColumnKey
  onClose: () => void
  onSend: () => void
  onStatus: (s: 'resolved' | 'seen') => void
  onImage: (src: string) => void
}) {
  const col = COLUMNS.find(c => c.key === column)!
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <aside
        className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#E5E5E5] px-5 py-4 flex items-center gap-2 z-10">
          <span className={cn('flex items-center gap-1.5 text-sm font-semibold', col.tone)}>
            <span className={cn('w-2 h-2 rounded-full', col.dot)} /> {col.title}
          </span>
          <span className="text-xs text-[#A3A3A3]">· {CATEGORY_LABELS[t.category] ?? t.category}</span>
          <button onClick={onClose} className="ms-auto text-[#A3A3A3] hover:text-[#0A0A0A]" aria-label="סגירה">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {t.claude_pr_url && (
              <a href={t.claude_pr_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-purple-600 text-white hover:bg-purple-700">
                <GitPullRequest className="w-4 h-4" /> פתח PR לבדיקה
              </a>
            )}
            {column !== 'done' && (
              <button onClick={onSend}
                disabled={column === 'queued'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-[#E5E5E5] text-[#525252] hover:border-[#0A0A0A] disabled:opacity-50">
                <Wrench className="w-4 h-4" /> {t.claude_status ? 'שלח שוב לפיתוח' : 'שלח לפיתוח'}
              </button>
            )}
            {column === 'done' ? (
              <button onClick={() => onStatus('seen')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-[#E5E5E5] text-[#525252] hover:border-[#0A0A0A]">
                <RotateCcw className="w-4 h-4" /> פתח מחדש
              </button>
            ) : (
              <button onClick={() => onStatus('resolved')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-green-200 text-green-700 hover:bg-green-50">
                <CheckCircle2 className="w-4 h-4" /> סמן כהושלם
              </button>
            )}
          </div>

          {/* Report */}
          <section>
            <h3 className="text-xs font-semibold text-[#737373] mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> הדיווח</h3>
            <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap leading-relaxed">{t.message}</p>
            <p className="text-xs text-[#A3A3A3] mt-2">
              {t.user_name && <>👤 {t.user_name} · </>}
              {new Date(t.created_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
            {t.screenshots.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {t.screenshots.map((src, i) => (
                  <button key={i} onClick={() => onImage(src)}
                    className="w-24 h-24 rounded-xl overflow-hidden border border-[#E5E5E5] hover:border-[#0A0A0A]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Plan */}
          <section>
            <h3 className="text-xs font-semibold text-[#737373] mb-2 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> תוכנית העבודה</h3>
            {t.claude_plan ? (
              <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">{t.claude_plan}</p>
            ) : (
              <p className="text-sm text-[#A3A3A3]">{t.claude_status ? 'הפיתוח עוד לא שיתף תוכנית' : 'עוד לא נשלח לפיתוח'}</p>
            )}
          </section>

          {/* Result */}
          {(t.claude_summary || t.claude_error) && (
            <section>
              <h3 className="text-xs font-semibold text-[#737373] mb-2 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> מה בוצע</h3>
              {t.claude_summary && (
                <p className={cn('text-sm whitespace-pre-wrap rounded-xl p-3 leading-relaxed border',
                  column === 'blocked' ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-[#FAFAFA] border-[#EEEEEE] text-[#0A0A0A]')}>
                  {t.claude_summary}
                </p>
              )}
              {t.claude_error && <p className="text-sm text-red-600 mt-2">{t.claude_error}</p>}
            </section>
          )}

          {/* Timeline */}
          <section>
            <h3 className="text-xs font-semibold text-[#737373] mb-3 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> ציר זמן</h3>
            {t.claude_log?.length ? (
              <ol className="relative border-s border-[#E5E5E5] ms-1.5 space-y-4">
                {[...t.claude_log].reverse().map((e, i) => (
                  <li key={i} className="ms-4">
                    <span className={cn('absolute -start-[5px] w-2.5 h-2.5 rounded-full mt-1.5',
                      e.status === 'pr_open' ? 'bg-purple-600'
                        : e.status === 'failed' || e.status === 'error' ? 'bg-orange-500'
                        : e.status === 'working' ? 'bg-blue-600' : 'bg-slate-400')} />
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-[#0A0A0A]">{STATUS_TEXT[e.status] ?? e.status}</span>
                      <span className="text-[11px] text-[#A3A3A3]">
                        {new Date(e.at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {e.note && <p className="text-xs text-[#737373] mt-0.5 whitespace-pre-wrap">{e.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#A3A3A3]">אין עדיין פעילות</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}
