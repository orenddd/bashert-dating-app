import { defineSchema, defineTable } from 'convex/server'
import { v, type Validator } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

// שדות שהיו NULL-able ב-Postgres: מקבלים גם null וגם היעדר-ערך
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nullable = <T extends Validator<any, 'required', any>>(t: T) => v.optional(v.union(t, v.null()))

const timestamp = v.string() // ISO-8601, כפי שהיה ב-timestamptz של Postgres

export default defineSchema({
  ...authTables,

  // users של Convex Auth + הקישור ל-UUID הישן מ-Supabase (לצורכי הגירה ומעקב)
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    supabase_id: v.optional(v.string()),
    created_at: v.optional(timestamp),
    last_sign_in_at: nullable(v.string()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_supabase_id', ['supabase_id']),

  profiles: defineTable({
    user_id: v.id('users'),
    display_name: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    gender: v.string(),
    seeking: v.string(),
    date_of_birth: nullable(v.string()),
    birth_year: nullable(v.number()),
    marital_status: v.string(),
    phone_number: v.string(),
    city: nullable(v.string()),
    state: nullable(v.string()),
    country: nullable(v.string()),
    latitude: nullable(v.number()),
    longitude: nullable(v.number()),
    bio: nullable(v.string()),
    occupation: nullable(v.string()),
    education: nullable(v.string()),
    religious_level: v.string(),
    shomer_shabbat: v.boolean(),
    kosher_level: v.string(),
    synagogue_attendance: v.string(),
    community_background: v.string(),
    hebrew_fluency: v.string(),
    aliyah_plan: v.string(),
    children_status: v.string(),
    children_count: v.number(),
    children_future: v.string(),
    wants_children: nullable(v.boolean()),
    height_cm: nullable(v.number()),
    relationship_goal: v.array(v.string()),
    seeking_status: v.array(v.string()),
    seeking_with_kids: v.string(),
    age_pref_min: v.number(),
    age_pref_max: v.number(),
    distance_pref_km: v.number(),
    residence_intent: v.array(v.string()),
    languages: v.array(v.string()),
    romantic_vision: v.array(v.string()),
    friday_night: v.array(v.string()),
    saturday_morning: v.array(v.string()),
    hobbies: v.array(v.string()),
    open_questions: v.any(),
    flight_mode_active: v.boolean(),
    flight_mode_city: v.string(),
    flight_mode_lat: nullable(v.number()),
    flight_mode_lng: nullable(v.number()),
    is_verified: v.boolean(),
    is_online: v.boolean(),
    last_seen: timestamp,
    profile_complete: v.boolean(),
    subscription_tier: v.string(),
    boost_active_until: nullable(v.string()),
    views_count: v.number(),
    is_admin: v.optional(v.boolean()),
    approval_status: v.string(), // pending | approved | rejected
    approval_note: v.string(),
    approved_at: nullable(v.string()),
    approved_by: nullable(v.id('users')),
    created_at: timestamp,
    updated_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_user_id', ['user_id'])
    .index('by_approval_status', ['approval_status'])
    // גילוי: מאושרים + פרופיל מלא + מגדר מבוקש
    .index('by_approval_and_complete_and_gender', ['approval_status', 'profile_complete', 'gender']),

  photos: defineTable({
    user_id: v.id('users'),
    storage_id: v.optional(v.id('_storage')), // הקובץ ב-Convex Storage
    url: nullable(v.string()), // גיבוי: כתובת חיצונית (למשל לפני העברת המדיה)
    thumbnail_url: nullable(v.string()),
    is_primary: v.boolean(),
    order_index: v.number(),
    media_type: v.string(), // image | video | audio
    face_focus_x: nullable(v.number()),
    face_focus_y: nullable(v.number()),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_user_id', ['user_id'])
    .index('by_user_id_and_order', ['user_id', 'order_index']),

  likes: defineTable({
    from_user_id: v.id('users'),
    to_user_id: v.id('users'),
    is_super_like: v.boolean(),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_from', ['from_user_id'])
    .index('by_to', ['to_user_id'])
    .index('by_from_and_to', ['from_user_id', 'to_user_id']),

  matches: defineTable({
    user1_id: v.id('users'),
    user2_id: v.id('users'),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_user1', ['user1_id'])
    .index('by_user2', ['user2_id'])
    .index('by_users', ['user1_id', 'user2_id']),

  message_requests: defineTable({
    from_user_id: v.id('users'),
    to_user_id: v.id('users'),
    initial_message: v.string(),
    status: v.string(), // pending | accepted | declined
    conversation_id: nullable(v.id('conversations')),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_from', ['from_user_id'])
    .index('by_to', ['to_user_id'])
    .index('by_to_and_status', ['to_user_id', 'status'])
    .index('by_from_and_to', ['from_user_id', 'to_user_id']),

  conversations: defineTable({
    match_id: nullable(v.id('matches')),
    request_id: nullable(v.id('message_requests')),
    participant1_id: v.id('users'),
    participant2_id: v.id('users'),
    last_message_at: timestamp,
    last_message_preview: v.string(),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_participant1', ['participant1_id'])
    .index('by_participant2', ['participant2_id'])
    .index('by_match', ['match_id']),

  messages: defineTable({
    conversation_id: v.id('conversations'),
    sender_id: v.id('users'),
    content: v.string(),
    is_read: v.boolean(),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_conversation', ['conversation_id'])
    .index('by_conversation_and_read', ['conversation_id', 'is_read']),

  subscriptions: defineTable({
    user_id: v.id('users'),
    tier: v.string(),
    starts_at: timestamp,
    ends_at: nullable(v.string()),
    is_active: v.boolean(),
    stripe_subscription_id: nullable(v.string()),
    stripe_customer_id: nullable(v.string()),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  }).index('by_user_id', ['user_id']),

  blocks: defineTable({
    blocker_id: v.id('users'),
    blocked_id: v.id('users'),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_blocker', ['blocker_id'])
    .index('by_blocker_and_blocked', ['blocker_id', 'blocked_id']),

  reports: defineTable({
    reporter_id: v.id('users'),
    reported_id: v.id('users'),
    reason: v.string(),
    details: nullable(v.string()),
    reviewed: v.boolean(),
    created_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_reported', ['reported_id'])
    .index('by_reviewed', ['reviewed']),

  feedback: defineTable({
    user_id: v.id('users'),
    message: v.string(),
    category: v.string(),
    screenshots: v.array(v.string()), // כתובות תמונות (Convex Storage)
    screenshot_ids: v.optional(v.array(v.id('_storage'))),
    status: v.string(), // new | in_progress | done
    admin_note: v.string(),
    created_at: timestamp,
    updated_at: timestamp,
    legacy_id: v.optional(v.string()),
  })
    .index('by_user_id', ['user_id'])
    .index('by_status', ['status']),
})
