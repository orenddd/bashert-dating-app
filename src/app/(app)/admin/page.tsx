'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/shared/AuthProvider'
import { fetchProfilesByApproval, setProfileApproval, deleteUserAccount } from '@/lib/api/profiles'
import { cn } from '@/lib/utils'
import { photoObjectPosition } from '@/lib/faceDetection'
import {
  Shield, Users, MessageSquare, CheckCircle2, Clock, Eye,
  ChevronDown, ChevronUp, RefreshCw, Image, X, MapPin, UserCheck, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { DbProfile, DbPhoto } from '@/lib/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedbackRow {
  id: string
  user_id: string
  message: string
  category: string
  screenshots: string[]
  status: 'new' | 'seen' | 'resolved'
  admin_note: string | null
  created_at: string
  profile?: { display_name: string; city: string } | null
}

interface UserRow {
  id: string
  user_id: string
  display_name: string
  first_name: string
  last_name: string
  city: string
  gender: string
  profile_complete: boolean
  is_verified: boolean
  subscription_tier: string
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is_admin?: any
}

const STATUS_LABELS: Record<string, string> = {
  new: 'חדש',
  seen: 'נצפה',
  resolved: 'טופל',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-red-100 text-red-700',
  seen: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: '🐛 באג',
  feature: '💡 הצעה',
  general: '💬 כללי',
  other: '📝 אחר',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'approvals' | 'feedback' | 'users'>('approvals')
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [approvals, setApprovals] = useState<{ profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [pendingCount, setPendingCount] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string>('')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const isAdmin = (user?.profile as unknown as Record<string, unknown>)?.is_admin === true

  useEffect(() => {
    if (isLoading) return
    if (!user || !isAdmin) {
      router.replace('/home')
    }
  }, [user, isLoading, isAdmin, router])

  const loadFeedback = useCallback(async () => {
    setLoadingData(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from('feedback') as any)
        .select('*, profile:profiles(display_name, city)')
        .order('created_at', { ascending: false })

      const { data } = statusFilter !== 'all'
        ? await q.eq('status', statusFilter)
        : await q

      setFeedback(data ?? [])
    } finally {
      setLoadingData(false)
    }
  }, [supabase, statusFilter])

  const loadUsers = useCallback(async () => {
    setLoadingData(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('profiles') as any)
        .select('id, user_id, display_name, first_name, last_name, city, gender, profile_complete, is_verified, subscription_tier, is_admin, created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      setUsers(data ?? [])
    } finally {
      setLoadingData(false)
    }
  }, [supabase])

  const loadApprovals = useCallback(async () => {
    setLoadingData(true)
    try {
      const data = await fetchProfilesByApproval(approvalFilter)
      setApprovals(data)
      if (approvalFilter === 'pending') setPendingCount(data.length)
    } finally {
      setLoadingData(false)
    }
  }, [approvalFilter])

  const refreshPendingCount = useCallback(async () => {
    const data = await fetchProfilesByApproval('pending')
    setPendingCount(data.length)
  }, [])

  const decideApproval = async (userId: string, status: 'approved' | 'rejected') => {
    setBusyId(userId)
    const ok = await setProfileApproval(userId, status)
    setBusyId(null)
    if (!ok) return
    // הסר מהרשימה אם הוא כבר לא תואם את הסינון הנוכחי
    setApprovals(prev => prev.filter(a => a.profile.user_id !== userId))
    if (approvalFilter === 'pending') setPendingCount(c => Math.max(0, c - 1))
  }

  useEffect(() => {
    if (!isAdmin) return
    if (tab === 'approvals') loadApprovals()
    else if (tab === 'feedback') loadFeedback()
    else loadUsers()
  }, [tab, isAdmin, loadApprovals, loadFeedback, loadUsers])

  // ספירת ממתינים לאישור עבור התג — נטען פעם אחת בכניסה
  useEffect(() => { if (isAdmin) refreshPendingCount() }, [isAdmin, refreshPendingCount])

  const updateFeedbackStatus = async (id: string, status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('feedback') as any).update({ status }).eq('id', id)
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: status as FeedbackRow['status'] } : f))
  }

  const saveNote = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('feedback') as any).update({ admin_note: editingNote }).eq('id', id)
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, admin_note: editingNote } : f))
    setExpandedId(null)
  }

  const deleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`למחוק לצמיתות את המשתמש ${name}? כל הנתונים, ההודעות והתמונות יימחקו. אין דרך לשחזר.`)) return
    setBusyId(userId)
    const res = await deleteUserAccount(userId)
    setBusyId(null)
    if (!res.ok) {
      toast.error(res.error ?? 'שגיאה במחיקת המשתמש')
      return
    }
    toast.success('המשתמש נמחק לצמיתות')
    setUsers(prev => prev.filter(u => u.user_id !== userId))
    setApprovals(prev => prev.filter(a => a.profile.user_id !== userId))
  }

  const toggleAdmin = async (userId: string, current: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any).update({ is_admin: !current }).eq('user_id', userId)
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_admin: !current } : u))
  }

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filteredFeedback = feedback

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-[#0A0A0A]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">לוח ניהול</h1>
          <p className="text-sm text-[#737373]">ניהול מערכת מצאתי אותך</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto rounded-xl"
          onClick={() => tab === 'approvals' ? loadApprovals() : tab === 'feedback' ? loadFeedback() : loadUsers()}
        >
          <RefreshCw className={cn('w-4 h-4', loadingData && 'animate-spin')} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F0F0] p-1 rounded-2xl mb-6 w-fit">
        <button
          onClick={() => setTab('approvals')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            tab === 'approvals' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#737373]'
          )}
        >
          <UserCheck className="w-4 h-4" />
          אישור פרופילים
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('feedback')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            tab === 'feedback' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#737373]'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          משובים
          {feedback.filter(f => f.status === 'new').length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {feedback.filter(f => f.status === 'new').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            tab === 'users' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#737373]'
          )}
        >
          <Users className="w-4 h-4" />
          משתמשים
        </button>
      </div>

      {/* ── APPROVALS TAB ─────────────────────────────── */}
      {tab === 'approvals' && (
        <div className="space-y-4">
          {/* Sub-filter */}
          <div className="flex gap-2 flex-wrap items-center">
            {(['pending', 'approved', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setApprovalFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  approvalFilter === s
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A]'
                )}
              >
                {s === 'pending' ? 'ממתינים' : s === 'approved' ? 'מאושרים' : 'נדחו'}
              </button>
            ))}
            <span className="text-sm text-[#A3A3A3] ms-auto">{approvals.length} פרופילים</span>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12 text-[#737373]">
              <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{approvalFilter === 'pending' ? 'אין פרופילים שממתינים לאישור 🎉' : 'אין פרופילים להצגה'}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {approvals.map(({ profile, photos }) => {
                const primary = photos.find(p => p.is_primary && p.media_type === 'image')
                  ?? photos.find(p => p.media_type === 'image')
                const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null
                return (
                  <div key={profile.user_id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden flex flex-col">
                    <div className="flex gap-3 p-3">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#F0F0F0] flex-shrink-0">
                        {primary
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={primary.url} alt="" className="w-full h-full object-cover" style={{ objectPosition: photoObjectPosition(primary) }} />
                          : <div className="w-full h-full flex items-center justify-center text-4xl text-[#D4D4D4]">👤</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#0A0A0A]">
                            {profile.first_name} {profile.last_name?.[0] ? `${profile.last_name[0]}.` : ''}
                          </span>
                          {age != null && <span className="text-[#737373]">{age}</span>}
                          {profile.is_verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#737373] flex-wrap">
                          {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>}
                          <span>{profile.gender === 'male' ? 'זכר' : profile.gender === 'female' ? 'נקבה' : 'אחר'}</span>
                          <span>· {photos.length} מדיה</span>
                        </div>
                        {(profile.open_questions?.bio || profile.bio) && (
                          <p className="text-xs text-[#737373] mt-1.5 line-clamp-3 leading-relaxed">
                            {profile.open_questions?.bio || profile.bio}
                          </p>
                        )}
                        <Link href={`/profile/${profile.user_id}`}
                          className="inline-block text-xs text-[#7C3AED] hover:underline mt-1.5">
                          צפייה בפרופיל המלא ↗
                        </Link>
                      </div>
                    </div>
                    <div className="flex gap-2 p-3 pt-0 mt-auto">
                      {approvalFilter !== 'approved' && (
                        <button
                          onClick={() => decideApproval(profile.user_id, 'approved')}
                          disabled={busyId === profile.user_id}
                          className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />אשר
                        </button>
                      )}
                      {approvalFilter !== 'rejected' && (
                        <button
                          onClick={() => decideApproval(profile.user_id, 'rejected')}
                          disabled={busyId === profile.user_id}
                          className="flex-1 h-10 rounded-xl border border-[#E5E5E5] text-[#B8472A] hover:bg-red-50 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />דחה
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FEEDBACK TAB ──────────────────────────────── */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'new', 'seen', 'resolved'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  statusFilter === s
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A]'
                )}
              >
                {s === 'all' ? 'הכל' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-[#737373]">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין משובים</p>
            </div>
          ) : (
            filteredFeedback.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                {/* Row header */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[f.status])}>
                        {STATUS_LABELS[f.status]}
                      </span>
                      <span className="text-xs bg-[#F0F0F0] px-2 py-0.5 rounded-full text-[#737373]">
                        {CATEGORY_LABELS[f.category] ?? f.category}
                      </span>
                      {f.profile?.display_name && (
                        <span className="text-xs text-[#737373]">
                          👤 {f.profile.display_name}
                          {f.profile.city && ` • ${f.profile.city}`}
                        </span>
                      )}
                      <span className="text-xs text-[#A3A3A3] ms-auto">
                        {new Date(f.created_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-[#0A0A0A] line-clamp-2">{f.message}</p>
                    {f.admin_note && (
                      <p className="text-xs text-[#737373] mt-1 italic">📝 {f.admin_note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === f.id ? null : f.id)
                      setEditingNote(f.admin_note ?? '')
                    }}
                    className="text-[#A3A3A3] hover:text-[#0A0A0A] p-1"
                  >
                    {expandedId === f.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded */}
                {expandedId === f.id && (
                  <div className="border-t border-[#E5E5E5] p-4 space-y-4 bg-[#FAFAFA]">
                    {/* Full message */}
                    <div>
                      <p className="text-xs font-semibold text-[#737373] mb-1 uppercase tracking-wide">הודעה מלאה</p>
                      <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap">{f.message}</p>
                    </div>

                    {/* Screenshots */}
                    {f.screenshots?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" /> צילומי מסך ({f.screenshots.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {f.screenshots.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setLightboxSrc(src)}
                              className="w-24 h-24 rounded-xl overflow-hidden border border-[#E5E5E5] hover:border-[#0A0A0A] transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status update */}
                    <div>
                      <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide">עדכון סטטוס</p>
                      <div className="flex gap-2">
                        {(['new', 'seen', 'resolved'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => updateFeedbackStatus(f.id, s)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                              f.status === s
                                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                : 'border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A]'
                            )}
                          >
                            {s === 'new' && <Clock className="w-3.5 h-3.5" />}
                            {s === 'seen' && <Eye className="w-3.5 h-3.5" />}
                            {s === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin note */}
                    <div>
                      <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide">הערת מנהל</p>
                      <textarea
                        value={editingNote}
                        onChange={e => setEditingNote(e.target.value)}
                        placeholder="הוסף הערה פנימית..."
                        className="w-full text-sm border border-[#E5E5E5] rounded-xl p-3 resize-none min-h-[80px] focus:outline-none focus:border-[#0A0A0A]"
                        dir="rtl"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => saveNote(f.id)} className="rounded-xl bg-[#0A0A0A] hover:bg-[#222] text-white text-xs">
                          שמור
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setExpandedId(null)} className="rounded-xl text-xs">
                          ביטול
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <p className="text-sm text-[#737373] mb-4">{users.length} משתמשים</p>
          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#737373] text-xs">
                      <th className="text-start px-4 py-3 font-medium">שם</th>
                      <th className="text-start px-4 py-3 font-medium">עיר</th>
                      <th className="text-start px-4 py-3 font-medium">מגדר</th>
                      <th className="text-start px-4 py-3 font-medium">סטטוס</th>
                      <th className="text-start px-4 py-3 font-medium">מנוי</th>
                      <th className="text-start px-4 py-3 font-medium">הצטרף</th>
                      <th className="text-start px-4 py-3 font-medium">ניהול</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} className={cn('border-b border-[#F0F0F0] hover:bg-[#FAFAFA]', i === users.length - 1 && 'border-0')}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0A0A0A]">{u.display_name || `${u.first_name} ${u.last_name}`}</div>
                          {u.is_admin && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">מנהל</span>}
                        </td>
                        <td className="px-4 py-3 text-[#737373]">{u.city || '—'}</td>
                        <td className="px-4 py-3 text-[#737373]">
                          {u.gender === 'male' ? 'זכר' : u.gender === 'female' ? 'נקבה' : 'אחר'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {u.profile_complete ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">פרופיל מלא</span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">לא הושלם</span>
                            )}
                            {u.is_verified && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">מאומת</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full',
                            u.subscription_tier === 'free' ? 'bg-gray-100 text-gray-500' :
                            u.subscription_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          )}>
                            {u.subscription_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#A3A3A3] text-xs">
                          {new Date(u.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {u.user_id !== user?.id && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleAdmin(u.user_id, !!u.is_admin)}
                                className={cn(
                                  'text-[10px] px-2 py-1 rounded-full border transition-all',
                                  u.is_admin
                                    ? 'border-purple-300 text-purple-700 hover:bg-purple-50'
                                    : 'border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A]'
                                )}
                              >
                                {u.is_admin ? 'הסר מנהל' : 'הפוך למנהל'}
                              </button>
                              <button
                                onClick={() => deleteUser(u.user_id, u.display_name || `${u.first_name} ${u.last_name}`)}
                                disabled={busyId === u.user_id}
                                title="מחק משתמש"
                                className="text-[10px] px-2 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />מחק
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button className="absolute top-4 end-4 text-white hover:text-gray-300" onClick={() => setLightboxSrc(null)}>
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
