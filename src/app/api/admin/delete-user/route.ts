import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// מחיקת משתמש מלאה: קבצי Storage + משתמש auth (כל הטבלאות נמחקות ב-CASCADE)
export async function POST(req: Request) {
  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const targetId = body.userId
  if (!targetId) {
    return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })
  }

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'שגיאת תצורת שרת' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // זיהוי המבקש לפי הטוקן ובדיקה שהוא מנהל
  const { data: callerData, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !callerData?.user) {
    return NextResponse.json({ error: 'התחברות לא תקפה' }, { status: 401 })
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('user_id', callerData.user.id)
    .single()

  if (!(callerProfile as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ error: 'אין הרשאת מנהל' }, { status: 403 })
  }

  if (callerData.user.id === targetId) {
    return NextResponse.json({ error: 'לא ניתן למחוק את החשבון של עצמך' }, { status: 400 })
  }

  // ניקוי תמונות מ-Storage (התיקייה של המשתמש בבאקט profile-photos)
  try {
    const { data: files } = await admin.storage.from('profile-photos').list(targetId, { limit: 1000 })
    if (files?.length) {
      await admin.storage.from('profile-photos').remove(files.map(f => `${targetId}/${f.name}`))
    }
  } catch {
    // כשל בניקוי Storage לא חוסם את מחיקת המשתמש עצמו
  }

  // מחיקת המשתמש מ-auth — כל שאר הנתונים נמחקים אוטומטית ב-ON DELETE CASCADE
  const { error: delErr } = await admin.auth.admin.deleteUser(targetId)
  if (delErr) {
    return NextResponse.json({ error: 'שגיאה במחיקת המשתמש' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
