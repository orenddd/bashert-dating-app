import { createClient } from '@/lib/supabase/client'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import type { SearchFilters } from '@/lib/types/forms'

type SupabaseResult<T> = { data: T | null; error: { message: string } | null }

function ageToDob(age: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age)
  return d.toISOString().split('T')[0]
}

export async function fetchDiscoverProfiles(
  currentUserId: string,
  filters?: Partial<SearchFilters>,
): Promise<{ profile: DbProfile; photos: DbPhoto[] }[]> {
  const supabase = createClient()

  // Load current user's seeking preference for gender filter
  const { data: me } = await supabase
    .from('profiles')
    .select('seeking, gender')
    .eq('user_id', currentUserId)
    .single() as unknown as SupabaseResult<{ seeking: string; gender: string }>

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('user_id', currentUserId)
    .eq('profile_complete', true)
    // רק פרופילים שאושרו ידנית ע"י מנהל מופיעים בגילוי
    .eq('approval_status', 'approved')

  // Gender filter based on what the current user is seeking
  if (me?.seeking && me.seeking !== 'both') {
    query = query.eq('gender', me.seeking) as typeof query
  }

  // Age range → date_of_birth range
  if (filters?.age_min) {
    query = query.lte('date_of_birth', ageToDob(filters.age_min)) as typeof query
  }
  if (filters?.age_max) {
    query = query.gte('date_of_birth', ageToDob(filters.age_max)) as typeof query
  }

  // Religious level
  if (filters?.religious_levels?.length) {
    query = query.in('religious_level', filters.religious_levels) as typeof query
  }

  // Community background
  if (filters?.community_backgrounds?.length) {
    query = query.in('community_background', filters.community_backgrounds) as typeof query
  }

  // Shomer Shabbat
  if (filters?.shomer_shabbat_only) {
    query = query.eq('shomer_shabbat', true) as typeof query
  }

  // Verified only
  if (filters?.verified_only) {
    query = query.eq('is_verified', true) as typeof query
  }

  const { data: profiles } = await query
    .order('is_online', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60) as unknown as SupabaseResult<DbProfile[]>

  if (!profiles?.length) return []

  const userIds = profiles.map(p => p.user_id)
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('user_id', userIds) as unknown as SupabaseResult<DbPhoto[]>

  // If has_photos_only, filter out profiles with no photos
  const allPhotos = photos ?? []
  return profiles
    .filter(profile => !filters?.has_photos_only || allPhotos.some(ph => ph.user_id === profile.user_id))
    .map(profile => ({
      profile,
      photos: allPhotos.filter(ph => ph.user_id === profile.user_id),
    }))
}

export async function fetchProfile(userId: string): Promise<{ profile: DbProfile; photos: DbPhoto[] } | null> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single() as unknown as SupabaseResult<DbProfile>

  if (!profile) return null

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('order_index') as unknown as SupabaseResult<DbPhoto[]>

  return { profile, photos: photos ?? [] }
}

export async function fetchCurrentUserProfile(userId: string): Promise<DbProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single() as unknown as SupabaseResult<DbProfile>

  return data
}

// ─── Admin moderation ────────────────────────────────────────────────────────

export async function fetchProfilesByApproval(
  status: 'pending' | 'approved' | 'rejected',
): Promise<{ profile: DbProfile; photos: DbPhoto[] }[]> {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('approval_status', status)
    .eq('profile_complete', true)
    .order('created_at', { ascending: true }) as unknown as SupabaseResult<DbProfile[]>

  if (!profiles?.length) return []

  const userIds = profiles.map(p => p.user_id)
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('user_id', userIds)
    .order('order_index') as unknown as SupabaseResult<DbPhoto[]>

  const allPhotos = photos ?? []
  return profiles.map(profile => ({
    profile,
    photos: allPhotos.filter(ph => ph.user_id === profile.user_id),
  }))
}

export async function setProfileApproval(
  userId: string,
  status: 'pending' | 'approved' | 'rejected',
  note = '',
): Promise<boolean> {
  const supabase = createClient()
  const patch: Record<string, unknown> = {
    approval_status: status,
    approval_note: note,
    approved_at: status === 'approved' ? new Date().toISOString() : null,
  }
  const { error } = await (supabase.from('profiles') as unknown as {
    update: (v: unknown) => { eq: (c: string, val: string) => Promise<{ error: { message: string } | null }> }
  })
    .update(patch)
    .eq('user_id', userId)
  return !error
}

// מחיקת משתמש מלאה (auth + כל הנתונים + Storage) — למנהלים בלבד, דרך route בצד שרת
export async function deleteUserAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { ok: false, error: 'נדרשת התחברות' }

  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId }),
  })
  if (res.ok) return { ok: true }
  const json = await res.json().catch(() => ({}))
  return { ok: false, error: (json as { error?: string }).error ?? 'שגיאה במחיקה' }
}

export async function upsertProfile(data: Partial<DbProfile> & { user_id: string }): Promise<DbProfile | null> {
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(data as never, { onConflict: 'user_id' })
    .select()
    .single() as unknown as SupabaseResult<DbProfile> & { error: { message: string } | null }

  if (error) {
    console.error('upsertProfile error:', error)
    throw new Error(error.message)
  }
  return profile
}
