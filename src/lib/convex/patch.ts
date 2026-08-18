import type { DbProfile } from '@/lib/types/database'

// שדות מערכת — לא ניתנים לעדכון מהלקוח (נשלטים בצד השרת)
const READ_ONLY = new Set([
  'id', '_id', '_creationTime', 'user_id', 'created_at', 'updated_at',
  'is_verified', 'views_count', 'is_admin', 'approval_status', 'approval_note',
  'approved_at', 'approved_by', 'boost_active_until', 'legacy_id',
])

export function toPatch(data: Partial<DbProfile> & Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (READ_ONLY.has(key) || value === undefined) continue
    patch[key] = value
  }
  return patch
}
