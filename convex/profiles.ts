import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import {
  withId, requireUserId, currentUserId, getProfile, requireAdmin,
  photosForUsers, type PhotoOut,
} from './helpers'

const MIN_AGE = 18
const MAX_AGE = 100

// אותה סמנטיקה כמו calcAgeFromProfile בפרונטאנד: birth_year קודם, date_of_birth כגיבוי
function ageOf(p: Doc<'profiles'>, currentYear: number): number | null {
  let age: number | null = null
  if (p.birth_year) age = currentYear - p.birth_year
  else if (p.date_of_birth) age = currentYear - new Date(p.date_of_birth).getFullYear()
  if (age == null || age < MIN_AGE || age > MAX_AGE) return null
  return age
}

const filtersValidator = v.optional(
  v.object({
    age_min: v.optional(v.number()),
    age_max: v.optional(v.number()),
    religious_levels: v.optional(v.array(v.string())),
    community_backgrounds: v.optional(v.array(v.string())),
    shomer_shabbat_only: v.optional(v.boolean()),
    verified_only: v.optional(v.boolean()),
    has_photos_only: v.optional(v.boolean()),
    cities: v.optional(v.array(v.string())),
  }),
)

async function attachPhotos(
  ctx: QueryCtx,
  profiles: Doc<'profiles'>[],
): Promise<{ profile: Doc<'profiles'> & { id: string }; photos: PhotoOut[] }[]> {
  const photos = await photosForUsers(ctx, profiles.map((p) => p.user_id))
  return profiles.map((profile) => ({
    profile: withId(profile),
    photos: photos.filter((ph) => ph.user_id === profile.user_id),
  }))
}

// גילוי — רק פרופילים מאושרים ומלאים, לפי ההעדפות של המשתמש הנוכחי
export const discover = query({
  args: { filters: filtersValidator, currentYear: v.number() },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx)
    if (!userId) return []
    const me = await getProfile(ctx, userId)
    const f = args.filters

    const seeking = me?.seeking && me.seeking !== 'both' ? me.seeking : null
    const rows = seeking
      ? await ctx.db
          .query('profiles')
          .withIndex('by_approval_and_complete_and_gender', (q) =>
            q.eq('approval_status', 'approved').eq('profile_complete', true).eq('gender', seeking))
          .take(500)
      : await ctx.db
          .query('profiles')
          .withIndex('by_approval_and_complete_and_gender', (q) =>
            q.eq('approval_status', 'approved').eq('profile_complete', true))
          .take(500)

    const matching = rows.filter((p) => {
      if (p.user_id === userId) return false
      if (f?.religious_levels?.length && !f.religious_levels.includes(p.religious_level)) return false
      if (f?.community_backgrounds?.length && !f.community_backgrounds.includes(p.community_background)) return false
      if (f?.shomer_shabbat_only && !p.shomer_shabbat) return false
      if (f?.verified_only && !p.is_verified) return false
      if (f?.cities?.length && !f.cities.includes(p.city ?? '')) return false
      if (f?.age_min != null || f?.age_max != null) {
        const age = ageOf(p, args.currentYear)
        if (age == null) return false
        if (f.age_min != null && age < f.age_min) return false
        if (f.age_max != null && age > f.age_max) return false
      }
      return true
    })

    // מקוונים תחילה, ואז החדשים ביותר — כמו ה-ORDER BY שהיה ב-Supabase
    matching.sort((a, b) => {
      if (a.is_online !== b.is_online) return a.is_online ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    })

    const withPhotos = await attachPhotos(ctx, matching.slice(0, 60))
    return f?.has_photos_only ? withPhotos.filter((r) => r.photos.length > 0) : withPhotos
  },
})

// פרופיל ציבורי של משתמש מסוים
export const byUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx, args.userId)
    if (!profile) return null
    const photos = await photosForUsers(ctx, [args.userId])
    photos.sort((a, b) => a.order_index - b.order_index)
    return { profile: withId(profile), photos }
  },
})

// הפרופיל של המשתמש המחובר
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get('users', userId)
    const profile = await getProfile(ctx, userId)
    return {
      id: String(userId),
      email: user?.email ?? '',
      profile: profile ? withId(profile) : null,
    }
  },
})

// סטטיסטיקות לדף "הפרופיל שלי"
export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx)
    if (!userId) return { likes: 0, matches: 0, views: 0 }
    const likes = await ctx.db.query('likes').withIndex('by_to', (q) => q.eq('to_user_id', userId)).take(500)
    const m1 = await ctx.db.query('matches').withIndex('by_user1', (q) => q.eq('user1_id', userId)).take(500)
    const m2 = await ctx.db.query('matches').withIndex('by_user2', (q) => q.eq('user2_id', userId)).take(500)
    const profile = await getProfile(ctx, userId)
    return { likes: likes.length, matches: m1.length + m2.length, views: profile?.views_count ?? 0 }
  },
})

const profilePatch = v.object({
  display_name: v.optional(v.string()),
  first_name: v.optional(v.string()),
  last_name: v.optional(v.string()),
  gender: v.optional(v.string()),
  seeking: v.optional(v.string()),
  date_of_birth: v.optional(v.union(v.string(), v.null())),
  birth_year: v.optional(v.union(v.number(), v.null())),
  marital_status: v.optional(v.string()),
  phone_number: v.optional(v.string()),
  city: v.optional(v.union(v.string(), v.null())),
  state: v.optional(v.union(v.string(), v.null())),
  country: v.optional(v.union(v.string(), v.null())),
  latitude: v.optional(v.union(v.number(), v.null())),
  longitude: v.optional(v.union(v.number(), v.null())),
  bio: v.optional(v.union(v.string(), v.null())),
  occupation: v.optional(v.union(v.string(), v.null())),
  education: v.optional(v.union(v.string(), v.null())),
  religious_level: v.optional(v.string()),
  shomer_shabbat: v.optional(v.boolean()),
  kosher_level: v.optional(v.string()),
  synagogue_attendance: v.optional(v.string()),
  community_background: v.optional(v.string()),
  hebrew_fluency: v.optional(v.string()),
  aliyah_plan: v.optional(v.string()),
  children_status: v.optional(v.string()),
  children_count: v.optional(v.number()),
  children_future: v.optional(v.string()),
  wants_children: v.optional(v.union(v.boolean(), v.null())),
  height_cm: v.optional(v.union(v.number(), v.null())),
  relationship_goal: v.optional(v.array(v.string())),
  seeking_status: v.optional(v.array(v.string())),
  seeking_with_kids: v.optional(v.string()),
  age_pref_min: v.optional(v.number()),
  age_pref_max: v.optional(v.number()),
  distance_pref_km: v.optional(v.number()),
  residence_intent: v.optional(v.array(v.string())),
  languages: v.optional(v.array(v.string())),
  romantic_vision: v.optional(v.array(v.string())),
  friday_night: v.optional(v.array(v.string())),
  saturday_morning: v.optional(v.array(v.string())),
  hobbies: v.optional(v.array(v.string())),
  open_questions: v.optional(v.any()),
  flight_mode_active: v.optional(v.boolean()),
  flight_mode_city: v.optional(v.string()),
  flight_mode_lat: v.optional(v.union(v.number(), v.null())),
  flight_mode_lng: v.optional(v.union(v.number(), v.null())),
  is_online: v.optional(v.boolean()),
  last_seen: v.optional(v.string()),
  profile_complete: v.optional(v.boolean()),
  subscription_tier: v.optional(v.string()),
})

// עדכון הפרופיל של המשתמש המחובר (מחליף את upsertProfile)
export const update = mutation({
  args: { patch: profilePatch },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await getProfile(ctx, userId)
    const now = new Date().toISOString()
    if (!existing) throw new Error('פרופיל לא נמצא')
    await ctx.db.patch('profiles', existing._id, { ...args.patch, updated_at: now })
    const updated = await ctx.db.get('profiles', existing._id)
    return updated ? withId(updated) : null
  },
})

export const touchOnline = mutation({
  args: { is_online: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx)
    if (!userId) return null
    const profile = await getProfile(ctx, userId)
    if (!profile) return null
    await ctx.db.patch('profiles', profile._id, {
      is_online: args.is_online,
      last_seen: new Date().toISOString(),
    })
    return null
  },
})

export const incrementViews = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const viewer = await currentUserId(ctx)
    if (!viewer || viewer === args.userId) return null
    const profile = await getProfile(ctx, args.userId)
    if (!profile) return null
    await ctx.db.patch('profiles', profile._id, { views_count: profile.views_count + 1 })
    return null
  },
})

// ─── ניהול ─────────────────────────────────────────────────────────────────

export const byApproval = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const rows = (
      await ctx.db
        .query('profiles')
        .withIndex('by_approval_status', (q) => q.eq('approval_status', args.status))
        .take(500)
    ).filter((p) => p.profile_complete)
    rows.sort((a, b) => a.created_at.localeCompare(b.created_at))
    return await attachPhotos(ctx, rows)
  },
})

export const setApproval = mutation({
  args: { userId: v.id('users'), status: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx)
    const profile = await getProfile(ctx, args.userId)
    if (!profile) return false
    await ctx.db.patch('profiles', profile._id, {
      approval_status: args.status,
      approval_note: args.note ?? '',
      approved_at: args.status === 'approved' ? new Date().toISOString() : null,
      approved_by: args.status === 'approved' ? adminId : null,
      updated_at: new Date().toISOString(),
    })
    return true
  },
})

// רשימת כל המשתמשים לטבלת הניהול
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const profiles = await ctx.db.query('profiles').take(1000)
    profiles.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return profiles.map((p) => ({
      id: String(p._id),
      user_id: p.user_id as Id<'users'>,
      display_name: p.display_name,
      first_name: p.first_name,
      last_name: p.last_name,
      city: p.city ?? '',
      gender: p.gender,
      profile_complete: p.profile_complete,
      is_verified: p.is_verified,
      subscription_tier: p.subscription_tier,
      is_admin: p.is_admin ?? false,
      created_at: p.created_at,
    }))
  },
})
