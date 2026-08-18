// פונקציות הגירה חד-פעמיות מ-Supabase. פנימיות בלבד (נגישות רק דרך ה-CLI).
// אפשר למחוק את הקובץ אחרי שההגירה הסתיימה ואומתה.
import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'
import type { Id, TableNames } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

type Row = Record<string, unknown>

const str = (x: unknown, fallback = '') => (typeof x === 'string' ? x : fallback)
const nstr = (x: unknown) => (typeof x === 'string' ? x : null)
const num = (x: unknown, fallback = 0) => (typeof x === 'number' ? x : fallback)
const nnum = (x: unknown) => (typeof x === 'number' ? x : x == null ? null : Number(x))
const bool = (x: unknown, fallback = false) => (typeof x === 'boolean' ? x : fallback)
const nbool = (x: unknown) => (typeof x === 'boolean' ? x : null)
const arr = (x: unknown) => (Array.isArray(x) ? x.map((i) => String(i)) : [])

async function userByLegacy(ctx: MutationCtx, uuid: unknown): Promise<Id<'users'> | null> {
  if (typeof uuid !== 'string') return null
  const user = await ctx.db
    .query('users')
    .withIndex('by_supabase_id', (q) => q.eq('supabase_id', uuid))
    .unique()
  return user?._id ?? null
}

async function byLegacyId<T extends TableNames>(ctx: MutationCtx, table: T, uuid: unknown) {
  if (typeof uuid !== 'string') return null
  const rows = await ctx.db.query(table).take(2000)
  const found = rows.find((r) => (r as { legacy_id?: string }).legacy_id === uuid)
  return (found?._id ?? null) as Id<T> | null
}

async function alreadyImported<T extends TableNames>(ctx: MutationCtx, table: T, uuid: unknown) {
  return (await byLegacyId(ctx, table, uuid)) !== null
}

// ─── משתמשים + חשבונות הזדהות ────────────────────────────────────────────────

export const importUsers = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    let skipped = 0
    for (const row of args.batch as Row[]) {
      const supabaseId = str(row.id)
      const email = str(row.email).trim().toLowerCase()
      if (!supabaseId || !email) { skipped++; continue }
      if (await userByLegacy(ctx, supabaseId)) { skipped++; continue }

      const meta = (row.raw_user_meta_data ?? {}) as Row
      const name = str(meta.full_name) || str(meta.name) || undefined
      const confirmed = nstr(row.email_confirmed_at)

      const userId = await ctx.db.insert('users', {
        email,
        ...(name ? { name } : {}),
        ...(confirmed ? { emailVerificationTime: new Date(confirmed).getTime() } : {}),
        supabase_id: supabaseId,
        created_at: str(row.created_at),
        last_sign_in_at: nstr(row.last_sign_in_at),
      })

      // ה-hash של bcrypt מ-Supabase נשמר כמות שהוא; convex/auth.ts מאמת אותו
      await ctx.db.insert('authAccounts', {
        userId,
        provider: 'password',
        providerAccountId: email,
        secret: str(row.encrypted_password),
        ...(confirmed ? { emailVerified: email } : {}),
      })
      created++
    }
    return { created, skipped }
  },
})

// ─── פרופילים ────────────────────────────────────────────────────────────────

export const importProfiles = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    const missing: string[] = []
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'profiles', row.id)) continue
      const userId = await userByLegacy(ctx, row.user_id)
      if (!userId) { missing.push(str(row.user_id)); continue }
      const approvedBy = await userByLegacy(ctx, row.approved_by)

      await ctx.db.insert('profiles', {
        user_id: userId,
        display_name: str(row.display_name),
        first_name: str(row.first_name),
        last_name: str(row.last_name),
        gender: str(row.gender, 'other'),
        seeking: str(row.seeking, 'both'),
        date_of_birth: nstr(row.date_of_birth),
        birth_year: nnum(row.birth_year),
        marital_status: str(row.marital_status, 'single'),
        phone_number: str(row.phone_number),
        city: nstr(row.city),
        state: nstr(row.state),
        country: nstr(row.country),
        latitude: nnum(row.latitude),
        longitude: nnum(row.longitude),
        bio: nstr(row.bio),
        occupation: nstr(row.occupation),
        education: nstr(row.education),
        religious_level: str(row.religious_level, 'masorti'),
        shomer_shabbat: bool(row.shomer_shabbat),
        kosher_level: str(row.kosher_level, 'none'),
        synagogue_attendance: str(row.synagogue_attendance, 'never'),
        community_background: str(row.community_background, 'other'),
        hebrew_fluency: str(row.hebrew_fluency, 'none'),
        aliyah_plan: str(row.aliyah_plan, 'no'),
        children_status: str(row.children_status, 'no_children'),
        children_count: num(row.children_count),
        children_future: str(row.children_future),
        wants_children: nbool(row.wants_children),
        height_cm: nnum(row.height_cm),
        relationship_goal: arr(row.relationship_goal),
        seeking_status: arr(row.seeking_status),
        seeking_with_kids: str(row.seeking_with_kids),
        age_pref_min: num(row.age_pref_min, 18),
        age_pref_max: num(row.age_pref_max, 60),
        distance_pref_km: num(row.distance_pref_km, 80),
        residence_intent: arr(row.residence_intent),
        languages: arr(row.languages),
        romantic_vision: arr(row.romantic_vision),
        friday_night: arr(row.friday_night),
        saturday_morning: arr(row.saturday_morning),
        hobbies: arr(row.hobbies),
        open_questions: row.open_questions ?? {},
        flight_mode_active: bool(row.flight_mode_active),
        flight_mode_city: str(row.flight_mode_city),
        flight_mode_lat: nnum(row.flight_mode_lat),
        flight_mode_lng: nnum(row.flight_mode_lng),
        is_verified: bool(row.is_verified),
        is_online: bool(row.is_online),
        last_seen: str(row.last_seen, str(row.created_at)),
        profile_complete: bool(row.profile_complete),
        subscription_tier: str(row.subscription_tier, 'free'),
        boost_active_until: nstr(row.boost_active_until),
        views_count: num(row.views_count),
        is_admin: bool(row.is_admin),
        approval_status: str(row.approval_status, 'pending'),
        approval_note: str(row.approval_note),
        approved_at: nstr(row.approved_at),
        approved_by: approvedBy,
        created_at: str(row.created_at),
        updated_at: str(row.updated_at, str(row.created_at)),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created, missing }
  },
})

// הפרופילים נוצרים גם ע"י callback של Convex Auth; לפני הייבוא מנקים כפילויות ריקות
export const clearAutoCreatedProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0
    for (const p of await ctx.db.query('profiles').take(2000)) {
      if (p.legacy_id) continue
      await ctx.db.delete('profiles', p._id)
      deleted++
    }
    return { deleted }
  },
})

// ─── תמונות ──────────────────────────────────────────────────────────────────

export const importPhotos = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    const missing: string[] = []
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'photos', row.id)) continue
      const userId = await userByLegacy(ctx, row.user_id)
      if (!userId) { missing.push(str(row.user_id)); continue }
      await ctx.db.insert('photos', {
        user_id: userId,
        url: nstr(row.url), // יוחלף ב-storage_id בשלב העברת הקבצים
        thumbnail_url: nstr(row.thumbnail_url),
        is_primary: bool(row.is_primary),
        order_index: num(row.order_index),
        media_type: str(row.media_type, 'image'),
        face_focus_x: nnum(row.face_focus_x),
        face_focus_y: nnum(row.face_focus_y),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created, missing }
  },
})

// קישור קובץ שהועלה ל-Convex Storage לרשומת התמונה
export const attachStorage = internalMutation({
  args: { items: v.array(v.object({ legacy_id: v.string(), storage_id: v.id('_storage') })) },
  handler: async (ctx, args) => {
    let updated = 0
    const photos = await ctx.db.query('photos').take(2000)
    for (const item of args.items) {
      const photo = photos.find((p) => p.legacy_id === item.legacy_id)
      if (!photo) continue
      await ctx.db.patch('photos', photo._id, { storage_id: item.storage_id, url: null })
      updated++
    }
    return { updated }
  },
})

// ─── שאר הטבלאות ─────────────────────────────────────────────────────────────

export const importLikes = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'likes', row.id)) continue
      const from = await userByLegacy(ctx, row.from_user_id)
      const to = await userByLegacy(ctx, row.to_user_id)
      if (!from || !to) continue
      await ctx.db.insert('likes', {
        from_user_id: from,
        to_user_id: to,
        is_super_like: bool(row.is_super_like),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importMatches = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'matches', row.id)) continue
      const u1 = await userByLegacy(ctx, row.user1_id)
      const u2 = await userByLegacy(ctx, row.user2_id)
      if (!u1 || !u2) continue
      await ctx.db.insert('matches', {
        user1_id: u1, user2_id: u2, created_at: str(row.created_at), legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importRequests = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'message_requests', row.id)) continue
      const from = await userByLegacy(ctx, row.from_user_id)
      const to = await userByLegacy(ctx, row.to_user_id)
      if (!from || !to) continue
      await ctx.db.insert('message_requests', {
        from_user_id: from,
        to_user_id: to,
        initial_message: str(row.initial_message),
        status: str(row.status, 'pending'),
        conversation_id: null, // מקושר בשלב נפרד, אחרי ייבוא השיחות
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importConversations = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'conversations', row.id)) continue
      const p1 = await userByLegacy(ctx, row.participant1_id)
      const p2 = await userByLegacy(ctx, row.participant2_id)
      if (!p1 || !p2) continue
      await ctx.db.insert('conversations', {
        match_id: await byLegacyId(ctx, 'matches', row.match_id),
        request_id: await byLegacyId(ctx, 'message_requests', row.request_id),
        participant1_id: p1,
        participant2_id: p2,
        last_message_at: str(row.last_message_at, str(row.created_at)),
        last_message_preview: str(row.last_message_preview),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

// חיבור message_requests.conversation_id אחרי שהשיחות יובאו
export const linkRequestConversations = internalMutation({
  args: { pairs: v.array(v.object({ request_legacy_id: v.string(), conversation_legacy_id: v.string() })) },
  handler: async (ctx, args) => {
    let linked = 0
    for (const pair of args.pairs) {
      const reqId = await byLegacyId(ctx, 'message_requests', pair.request_legacy_id)
      const convId = await byLegacyId(ctx, 'conversations', pair.conversation_legacy_id)
      if (!reqId || !convId) continue
      await ctx.db.patch('message_requests', reqId, { conversation_id: convId })
      linked++
    }
    return { linked }
  },
})

export const importMessages = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'messages', row.id)) continue
      const conv = await byLegacyId(ctx, 'conversations', row.conversation_id)
      const sender = await userByLegacy(ctx, row.sender_id)
      if (!conv || !sender) continue
      await ctx.db.insert('messages', {
        conversation_id: conv,
        sender_id: sender,
        content: str(row.content),
        is_read: bool(row.is_read),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importSubscriptions = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'subscriptions', row.id)) continue
      const userId = await userByLegacy(ctx, row.user_id)
      if (!userId) continue
      await ctx.db.insert('subscriptions', {
        user_id: userId,
        tier: str(row.tier, 'free'),
        starts_at: str(row.starts_at, str(row.created_at)),
        ends_at: nstr(row.ends_at),
        is_active: bool(row.is_active, true),
        stripe_subscription_id: nstr(row.stripe_subscription_id),
        stripe_customer_id: nstr(row.stripe_customer_id),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importBlocks = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'blocks', row.id)) continue
      const blocker = await userByLegacy(ctx, row.blocker_id)
      const blocked = await userByLegacy(ctx, row.blocked_id)
      if (!blocker || !blocked) continue
      await ctx.db.insert('blocks', {
        blocker_id: blocker, blocked_id: blocked, created_at: str(row.created_at), legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importReports = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'reports', row.id)) continue
      const reporter = await userByLegacy(ctx, row.reporter_id)
      const reported = await userByLegacy(ctx, row.reported_id)
      if (!reporter || !reported) continue
      await ctx.db.insert('reports', {
        reporter_id: reporter,
        reported_id: reported,
        reason: str(row.reason, 'other'),
        details: nstr(row.details),
        reviewed: bool(row.reviewed),
        created_at: str(row.created_at),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

export const importFeedback = internalMutation({
  args: { batch: v.array(v.any()) },
  handler: async (ctx, args) => {
    let created = 0
    for (const row of args.batch as Row[]) {
      if (await alreadyImported(ctx, 'feedback', row.id)) continue
      const userId = await userByLegacy(ctx, row.user_id)
      if (!userId) continue
      await ctx.db.insert('feedback', {
        user_id: userId,
        message: str(row.message),
        category: str(row.category, 'general'),
        screenshots: arr(row.screenshots),
        status: str(row.status, 'new'),
        admin_note: str(row.admin_note),
        created_at: str(row.created_at),
        updated_at: str(row.updated_at, str(row.created_at)),
        legacy_id: str(row.id),
      })
      created++
    }
    return { created }
  },
})

// ─── אימות ───────────────────────────────────────────────────────────────────

export const stats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const count = async (table: TableNames) => (await ctx.db.query(table).take(5000)).length
    const photos = await ctx.db.query('photos').take(2000)
    return {
      users: await count('users'),
      authAccounts: await count('authAccounts'),
      profiles: await count('profiles'),
      photos: photos.length,
      photos_with_storage: photos.filter((p) => p.storage_id).length,
      photos_pending_media: photos.filter((p) => !p.storage_id).length,
      likes: await count('likes'),
      matches: await count('matches'),
      message_requests: await count('message_requests'),
      conversations: await count('conversations'),
      messages: await count('messages'),
      subscriptions: await count('subscriptions'),
      blocks: await count('blocks'),
      reports: await count('reports'),
      feedback: await count('feedback'),
    }
  },
})

// רשימת התמונות שעדיין ממתינות להעברת הקובץ (עם ה-URL המקורי ב-Supabase)
export const pendingMedia = internalQuery({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db.query('photos').take(2000)
    return photos
      .filter((p) => !p.storage_id && p.url)
      .map((p) => ({ legacy_id: p.legacy_id ?? '', url: p.url as string, media_type: p.media_type }))
  },
})

// כתובת העלאה לשימוש סקריפט ההגירה (ללא הזדהות משתמש — פנימי בלבד)
export const uploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
})

// ניקוי משתמש שיובא (לשימוש סקריפט האימות בלבד)
export const deleteBySupabaseId = internalMutation({
  args: { supabase_id: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_supabase_id', (q) => q.eq('supabase_id', args.supabase_id))
      .unique()
    if (!user) return { deleted: 0 }
    for (const account of await ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', user._id)).take(10)) {
      await ctx.db.delete('authAccounts', account._id)
    }
    for (const session of await ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', user._id)).take(50)) {
      for (const t of await ctx.db.query('authRefreshTokens').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(100)) {
        await ctx.db.delete('authRefreshTokens', t._id)
      }
      await ctx.db.delete('authSessions', session._id)
    }
    const profile = await ctx.db.query('profiles').withIndex('by_user_id', (q) => q.eq('user_id', user._id)).unique()
    if (profile) await ctx.db.delete('profiles', profile._id)
    await ctx.db.delete('users', user._id)
    return { deleted: 1 }
  },
})

// עזר זמני לבדיקות ידניות: השלמת פרופיל לפי אימייל
export const devCompleteProfile = internalMutation({
  args: { email: v.string(), gender: v.string(), seeking: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query('users').withIndex('email', (q) => q.eq('email', args.email)).unique()
    if (!user) return { ok: false }
    const profile = await ctx.db.query('profiles').withIndex('by_user_id', (q) => q.eq('user_id', user._id)).unique()
    if (!profile) return { ok: false }
    await ctx.db.patch('profiles', profile._id, {
      profile_complete: true,
      approval_status: 'approved',
      gender: args.gender,
      seeking: args.seeking,
      birth_year: 1990,
      city: 'תל אביב',
      is_admin: true,
    })
    return { ok: true, userId: String(user._id) }
  },
})

// ניקוי משתמשי בדיקה לפי אימייל
export const devDeleteUserByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ deleted: number }> => {
    const user = await ctx.db.query('users').withIndex('email', (q) => q.eq('email', args.email)).unique()
    if (!user) return { deleted: 0 }
    for (const t of ['likes', 'message_requests', 'conversations', 'messages', 'profiles', 'photos'] as const) {
      for (const row of await ctx.db.query(t).take(2000)) {
        const r = row as Record<string, unknown>
        if ([r.user_id, r.from_user_id, r.to_user_id, r.participant1_id, r.participant2_id, r.sender_id].some((v2) => v2 === user._id)) {
          await ctx.db.delete(t, row._id)
        }
      }
    }
    for (const a of await ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', user._id)).take(10)) {
      await ctx.db.delete('authAccounts', a._id)
    }
    for (const s of await ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', user._id)).take(50)) {
      for (const t of await ctx.db.query('authRefreshTokens').withIndex('sessionId', (q) => q.eq('sessionId', s._id)).take(100)) {
        await ctx.db.delete('authRefreshTokens', t._id)
      }
      await ctx.db.delete('authSessions', s._id)
    }
    await ctx.db.delete('users', user._id)
    return { deleted: 1 }
  },
})
