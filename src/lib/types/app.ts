import type { DbProfile, DbPhoto, DbConversation, DbMessage } from './database'

export interface ProfileWithPhotos extends DbProfile {
  photos: DbPhoto[]
  primary_photo_url: string | null
  age: number
}

export interface ConversationWithDetails extends DbConversation {
  other_user: ProfileWithPhotos
  unread_count: number
  last_message: DbMessage | null
}

export interface AuthUser {
  id: string
  email: string
  profile: DbProfile | null
}
