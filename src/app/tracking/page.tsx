'use client'

import { useState } from 'react'
import {
  Lock, Users, MessageSquare, RefreshCw, Mail, Phone, MapPin,
  CheckCircle2, Clock, Calendar, BarChart3,
} from 'lucide-react'

interface ProfileRow {
  user_id: string
  name: string
  email: string
  phone: string
  gender: string
  city: string
  complete: boolean
  created_at: string
}

interface FeedbackRow {
  id: string
  message: string
  category: string
  status: string
  screenshots: string[]
  created_at: string
  email: string
}

interface Totals {
  profiles: number
  completed: number
  male: number
  female: number
  feedback: number
}

interface Data {
  profiles: ProfileRow[]
  feedback: FeedbackRow[]
  totals: Totals
}

const GENDER_LABEL: Record<string, string> = {
  male: 'זכר', female: 'נקבה', other: '—',
}
const GENDER_STYLE: Record<string, string> = {
  male: 'bg-[#E8F1FF] text-[#1D4ED8]',
  female: 'bg-[#FCE7F3] text-[#BE185D]',
  other: 'bg-[#F5F5F5] text-[#737373]',
}
const CATEGORY_LABEL: Record<string, string> = {
  bug: '🐛 באג', feature: '💡 שיפור', general: '💬 כללי', other: '📝 אחר',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'חדש', seen: 'נצפה', resolved: 'טופל',
}
const STATUS_STYLE: Record<string, string> = {
  new: 'bg-[#FEF3C7] text-[#92400E]',
  seen: 'bg-[#DBEAFE] text-[#1E40AF]',
  resolved: 'bg-[#DCFCE7] text-[#166534]',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TrackingPage() {
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'profiles' | 'feedback'>('profiles')

  const load = async (pw: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, from: from || undefined, to: to || undefined }),
      })
      if (res.status === 401) {
        setError('סיסמה שגויה')
        setUnlocked(false)
        return
      }
      if (!res.ok) {
        setError('שגיאה בטעינת הנתונים')
        return
      }
      const json: Data = await res.json()
      setData(json)
      setUnlocked(true)
    } catch {
      setError('שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }

  // ─── מסך הסיסמה ──────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#0A0A0A] mb-1">עמוד מעקב הרשמות</h1>
          <p className="text-[#737373] text-sm mb-6">הזן/י סיסמה כדי להציג את הנתונים</p>
          <form
            onSubmit={(e) => { e.preventDefault(); load(password) }}
            className="space-y-3"
          >
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              autoFocus
              className="w-full h-12 rounded-2xl border border-[#E5E5E5] px-4 text-center text-lg tracking-widest focus:outline-none focus:border-[#0A0A0A]"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-12 rounded-2xl bg-[#0A0A0A] text-white font-bold hover:bg-[#222] transition-colors disabled:opacity-40"
            >
              {loading ? 'בודק...' : 'כניסה'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── התוכן ───────────────────────────────────────────────────────────
  const t = data?.totals
  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-16" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] px-4 md:px-6 h-14 flex items-center justify-between">
        <h1 className="font-bold text-[#0A0A0A] text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> מעקב הרשמות
        </h1>
        <button
          onClick={() => load(password)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0A0A0A] disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענון
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* סינון תאריכים */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-[#737373] text-sm font-medium">
            <Calendar className="w-4 h-4" /> סינון לפי תאריך:
          </div>
          <label className="text-xs text-[#737373]">
            מתאריך
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="block mt-1 h-10 rounded-xl border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#0A0A0A]" />
          </label>
          <label className="text-xs text-[#737373]">
            עד תאריך
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="block mt-1 h-10 rounded-xl border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#0A0A0A]" />
          </label>
          <button
            onClick={() => load(password)}
            className="h-10 px-4 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#222]"
          >
            סנן
          </button>
          {(from || to) && (
            <button
              onClick={() => { setFrom(''); setTo('') }}
              className="h-10 px-3 rounded-xl text-sm text-[#737373] hover:text-[#0A0A0A]"
            >
              נקה
            </button>
          )}
        </div>

        {/* כרטיסי סיכום */}
        {t && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'נרשמו', value: t.profiles },
              { label: 'השלימו פרופיל', value: t.completed },
              { label: 'זכר', value: t.male },
              { label: 'נקבה', value: t.female },
              { label: 'משובים', value: t.feedback },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5E5] p-4 text-center">
                <p className="text-2xl font-bold text-[#0A0A0A]">{s.value}</p>
                <p className="text-xs text-[#A3A3A3] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* טאבים */}
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-2xl p-1 w-fit">
          <button
            onClick={() => setTab('profiles')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'profiles' ? 'bg-[#0A0A0A] text-white' : 'text-[#737373]'}`}
          >
            <Users className="w-4 h-4" /> פרופילים ({data?.profiles.length ?? 0})
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'feedback' ? 'bg-[#0A0A0A] text-white' : 'text-[#737373]'}`}
          >
            <MessageSquare className="w-4 h-4" /> משובים ({data?.feedback.length ?? 0})
          </button>
        </div>

        {/* ─── רשימת פרופילים ─── */}
        {tab === 'profiles' && (
          <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
            {data && data.profiles.length === 0 ? (
              <p className="text-center text-[#A3A3A3] py-12 text-sm">לא נמצאו פרופילים בטווח שנבחר</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#A3A3A3] text-xs">
                      <th className="text-right font-medium px-4 py-3">שם</th>
                      <th className="text-right font-medium px-4 py-3">מייל</th>
                      <th className="text-right font-medium px-4 py-3">נייד</th>
                      <th className="text-right font-medium px-4 py-3">מגדר</th>
                      <th className="text-right font-medium px-4 py-3">סטטוס</th>
                      <th className="text-right font-medium px-4 py-3">תאריך הרשמה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.profiles.map((p) => (
                      <tr key={p.user_id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0A0A0A]">{p.name}</div>
                          {p.city && (
                            <div className="text-xs text-[#A3A3A3] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{p.city}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#525252]" dir="ltr">
                          <a href={`mailto:${p.email}`} className="hover:text-[#0A0A0A] inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-[#A3A3A3]" />{p.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-[#525252]" dir="ltr">
                          <a href={`tel:${p.phone}`} className="hover:text-[#0A0A0A] inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-[#A3A3A3]" />{p.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GENDER_STYLE[p.gender] ?? GENDER_STYLE.other}`}>
                            {GENDER_LABEL[p.gender] ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.complete ? (
                            <span className="text-xs text-green-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />הושלם
                            </span>
                          ) : (
                            <span className="text-xs text-[#A3A3A3] inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />בתהליך
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#737373] whitespace-nowrap">{fmtDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── רשימת משובים ─── */}
        {tab === 'feedback' && (
          <div className="space-y-3">
            {data && data.feedback.length === 0 ? (
              <p className="text-center text-[#A3A3A3] py-12 text-sm bg-white rounded-2xl border border-[#E5E5E5]">
                אין משובים עדיין
              </p>
            ) : (
              data?.feedback.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#0A0A0A] font-medium">
                      {CATEGORY_LABEL[f.category] ?? f.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[f.status] ?? STATUS_STYLE.new}`}>
                      {STATUS_LABEL[f.status] ?? f.status}
                    </span>
                    <span className="text-xs text-[#A3A3A3] mr-auto">{fmtDate(f.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  <p className="text-xs text-[#A3A3A3] mt-2 inline-flex items-center gap-1" dir="ltr">
                    <Mail className="w-3 h-3" />{f.email}
                  </p>
                  {f.screenshots?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {f.screenshots.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                          <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#E5E5E5]" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
