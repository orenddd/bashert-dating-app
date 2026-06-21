import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// סיסמת הגישה לעמוד המעקב (נגיש גם ללא-מנהלים)
const TRACKING_PASSWORD = '88868886'

export const runtime = 'nodejs'

type ProfileRow = {
  user_id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  gender: string | null
  phone_number: string | null
  city: string | null
  profile_complete: boolean | null
  created_at: string
}

export async function POST(req: Request) {
  let body: { password?: string; from?: string; to?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  // ─── בדיקת סיסמה בצד שרת ──────────────────────────────────────────────
  if (body.password !== TRACKING_PASSWORD) {
    return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'שגיאת תצורת שרת' }, { status: 500 })
  }

  // לקוח service-role — עוקף RLS ומאפשר קריאת מיילים מ-auth
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ─── פרופילים (סינון לפי תאריך יצירה) ─────────────────────────────────
  let q = admin
    .from('profiles')
    .select('user_id, first_name, last_name, display_name, gender, phone_number, city, profile_complete, created_at')
    .order('created_at', { ascending: false })

  if (body.from) q = q.gte('created_at', `${body.from}T00:00:00`)
  if (body.to) q = q.lte('created_at', `${body.to}T23:59:59`)

  const { data: profiles, error: profilesErr } = await q
  if (profilesErr) {
    return NextResponse.json({ error: 'שגיאה בשליפת פרופילים' }, { status: 500 })
  }

  // ─── מיפוי user_id → email (מ-auth.users דרך admin API) ────────────────
  const emailMap = new Map<string, string>()
  try {
    let page = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data?.users?.length) break
      for (const u of data.users) {
        if (u.email) emailMap.set(u.id, u.email)
      }
      if (data.users.length < 1000) break
      page += 1
    }
  } catch {
    // אם נכשל — נמשיך בלי מיילים
  }

  const rows = (profiles as ProfileRow[] ?? []).map((p) => ({
    user_id: p.user_id,
    name: (p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || '—',
    email: emailMap.get(p.user_id) ?? '—',
    phone: p.phone_number || '—',
    gender: p.gender ?? 'other',
    city: p.city || '',
    complete: !!p.profile_complete,
    created_at: p.created_at,
  }))

  // ─── משובים ───────────────────────────────────────────────────────────
  const { data: feedback } = await admin
    .from('feedback')
    .select('id, user_id, message, category, screenshots, status, created_at')
    .order('created_at', { ascending: false })

  const feedbackRows = (feedback ?? []).map((f) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ff = f as any
    return {
      id: ff.id as string,
      message: ff.message as string,
      category: ff.category as string,
      status: ff.status as string,
      screenshots: (ff.screenshots ?? []) as string[],
      created_at: ff.created_at as string,
      email: emailMap.get(ff.user_id) ?? '—',
    }
  })

  return NextResponse.json({
    profiles: rows,
    feedback: feedbackRows,
    totals: {
      profiles: rows.length,
      completed: rows.filter((r) => r.complete).length,
      male: rows.filter((r) => r.gender === 'male').length,
      female: rows.filter((r) => r.gender === 'female').length,
      feedback: feedbackRows.length,
    },
  })
}
