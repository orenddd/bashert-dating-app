import { convex } from '@/lib/convex/client'
import { toPatch } from '@/lib/convex/patch'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import type { SearchFilters } from '@/lib/types/forms'

type ProfileWithPhotos = { profile: DbProfile; photos: DbPhoto[] }

export async function fetchDiscoverProfiles(
  _currentUserId: string,
  filters?: Partial<SearchFilters>,
): Promise<ProfileWithPhotos[]> {
  const result = await convex.query(api.profiles.discover, {
    currentYear: new Date().getFullYear(),
    filters: filters
      ? {
          age_min: filters.age_min,
          age_max: filters.age_max,
          religious_levels: filters.religious_levels,
          community_backgrounds: filters.community_backgrounds,
          shomer_shabbat_only: filters.shomer_shabbat_only,
          verified_only: filters.verified_only,
          has_photos_only: filters.has_photos_only,
        }
      : undefined,
  })
  return result as unknown as ProfileWithPhotos[]
}

export async function fetchProfile(userId: string): Promise<ProfileWithPhotos | null> {
  const result = await convex.query(api.profiles.byUserId, { userId: userId as Id<'users'> })
  return result as unknown as ProfileWithPhotos | null
}

export async function fetchCurrentUserProfile(_userId?: string): Promise<DbProfile | null> {
  const me = await convex.query(api.profiles.me, {})
  return (me?.profile ?? null) as unknown as DbProfile | null
}

export async function fetchMyStats(): Promise<{ likes: number; matches: number; views: number }> {
  return await convex.query(api.profiles.myStats, {})
}

export async function incrementProfileViews(userId: string): Promise<void> {
  await convex.mutation(api.profiles.incrementViews, { userId: userId as Id<'users'> })
}

// ─── ניהול ───────────────────────────────────────────────────────────────────

export async function fetchProfilesByApproval(
  status: 'pending' | 'approved' | 'rejected',
): Promise<ProfileWithPhotos[]> {
  const result = await convex.query(api.profiles.byApproval, { status })
  return result as unknown as ProfileWithPhotos[]
}

export async function fetchAllProfilesForAdmin() {
  return await convex.query(api.profiles.adminList, {})
}

export async function setProfileApproval(
  userId: string,
  status: 'pending' | 'approved' | 'rejected',
  note = '',
): Promise<boolean> {
  try {
    return await convex.mutation(api.profiles.setApproval, {
      userId: userId as Id<'users'>,
      status,
      note,
    })
  } catch {
    return false
  }
}

// מחיקת משתמש מלאה (הזדהות + כל הנתונים + קבצים) — למנהלים בלבד
export async function deleteUserAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await convex.mutation(api.admin.deleteUser, { userId: userId as Id<'users'> })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'שגיאה במחיקה' }
  }
}

export async function upsertProfile(
  data: Partial<DbProfile> & { user_id?: string },
): Promise<DbProfile | null> {
  const profile = await convex.mutation(api.profiles.update, { patch: toPatch(data) })
  return profile as unknown as DbProfile | null
}
