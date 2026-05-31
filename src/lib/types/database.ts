export type ReligiousLevel = 'hiloni' | 'masorti' | 'dati_light' | 'dati' | 'haredi'
export type KosherLevel = 'none' | 'kosher_home' | 'kosher_out' | 'strict'
export type CommunityBackground = 'ashkenazi' | 'sephardic' | 'mizrahi' | 'yemenite' | 'mixed' | 'other'
export type HebrewFluency = 'none' | 'basic' | 'conversational' | 'fluent' | 'native'
export type AliyahPlan = 'no' | 'considering' | 'planning' | 'already_made'
export type ChildrenStatus = 'no_children' | 'has_children' | 'wants_children' | 'does_not_want' | 'open'
export type SubscriptionTier = 'free' | 'gold' | 'platinum'
export type Gender = 'male' | 'female' | 'other'
export type SynagogueAttendance = 'never' | 'holidays' | 'monthly' | 'weekly' | 'daily'
export type MaritalStatus = 'single' | 'divorced' | 'widowed'
export type ChildrenFuture = '' | 'want_must' | 'want_sometime' | 'undecided' | 'dont_want' | 'have_maybe_more' | 'have_enough'
export type SeekingWithKids = '' | 'yes' | 'no' | 'dont_mind'
export type MediaType = 'image' | 'video' | 'audio'

export interface DbProfile {
  id: string
  user_id: string
  display_name: string
  first_name: string
  last_name: string
  gender: Gender
  seeking: Gender | 'both'
  date_of_birth: string
  birth_year: number | null
  marital_status: MaritalStatus
  city: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  bio: string
  occupation: string
  education: string
  religious_level: ReligiousLevel
  shomer_shabbat: boolean
  kosher_level: KosherLevel
  synagogue_attendance: SynagogueAttendance
  community_background: CommunityBackground
  hebrew_fluency: HebrewFluency
  aliyah_plan: AliyahPlan
  children_status: ChildrenStatus
  children_future: ChildrenFuture
  wants_children: boolean | null
  height_cm: number | null
  phone_number: string
  relationship_goal: string[]
  seeking_status: string[]
  seeking_with_kids: SeekingWithKids
  age_pref_min: number
  age_pref_max: number
  distance_pref_km: number
  residence_intent: string[]
  languages: string[]
  romantic_vision: string[]
  friday_night: string[]
  saturday_morning: string[]
  hobbies: string[]
  open_questions: Record<string, string>
  flight_mode_active: boolean
  flight_mode_city: string
  flight_mode_lat: number | null
  flight_mode_lng: number | null
  is_verified: boolean
  is_online: boolean
  last_seen: string
  profile_complete: boolean
  subscription_tier: SubscriptionTier
  boost_active_until: string | null
  views_count: number
  created_at: string
  updated_at: string
}

export interface DbPhoto {
  id: string
  user_id: string
  url: string
  thumbnail_url: string
  is_primary: boolean
  order_index: number
  media_type: MediaType
  created_at: string
}

export interface DbLike {
  id: string
  from_user_id: string
  to_user_id: string
  is_super_like: boolean
  created_at: string
}

export interface DbMatch {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

export interface DbMessageRequest {
  id: string
  from_user_id: string
  to_user_id: string
  initial_message: string
  status: 'pending' | 'accepted' | 'declined'
  conversation_id: string | null
  created_at: string
}

export interface DbConversation {
  id: string
  match_id: string | null
  request_id: string | null
  participant1_id: string
  participant2_id: string
  last_message_at: string
  last_message_preview: string
  created_at: string
}

export interface DbMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface DbSubscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  starts_at: string
  ends_at: string | null
  is_active: boolean
  stripe_subscription_id: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: DbProfile; Insert: Omit<DbProfile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<DbProfile> }
      photos: { Row: DbPhoto; Insert: Omit<DbPhoto, 'id' | 'created_at'>; Update: Partial<DbPhoto> }
      likes: { Row: DbLike; Insert: Omit<DbLike, 'id' | 'created_at'>; Update: Partial<DbLike> }
      matches: { Row: DbMatch; Insert: Omit<DbMatch, 'id' | 'created_at'>; Update: Partial<DbMatch> }
      message_requests: { Row: DbMessageRequest; Insert: Omit<DbMessageRequest, 'id' | 'created_at'>; Update: Partial<DbMessageRequest> }
      conversations: { Row: DbConversation; Insert: Omit<DbConversation, 'id' | 'created_at'>; Update: Partial<DbConversation> }
      messages: { Row: DbMessage; Insert: Omit<DbMessage, 'id' | 'created_at'>; Update: Partial<DbMessage> }
      subscriptions: { Row: DbSubscription; Insert: Omit<DbSubscription, 'id' | 'created_at'>; Update: Partial<DbSubscription> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
