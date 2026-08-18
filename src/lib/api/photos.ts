import { convex } from '@/lib/convex/client'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { DbPhoto } from '@/lib/types/database'

export interface PhotoInput {
  id?: string                 // תמונה קיימת שנשמרת
  storage_id?: Id<'_storage'> // קובץ חדש שהועלה
  is_primary: boolean
  order_index: number
  media_type?: string
  face_focus_x?: number | null
  face_focus_y?: number | null
}

// שמירת מערך התמונות של המשתמש. כל מה שלא נכלל ברשימה — נמחק (כולל הקובץ).
export async function savePhotos(photos: PhotoInput[]): Promise<DbPhoto[]> {
  const result = await convex.mutation(api.photos.saveAll, {
    photos: photos.map((p) => ({
      ...(p.id ? { id: p.id as Id<'photos'> } : {}),
      ...(p.storage_id ? { storage_id: p.storage_id } : {}),
      is_primary: p.is_primary,
      order_index: p.order_index,
      media_type: p.media_type ?? 'image',
      face_focus_x: p.face_focus_x ?? null,
      face_focus_y: p.face_focus_y ?? null,
    })),
  })
  return result as unknown as DbPhoto[]
}

export async function fetchMyPhotos(): Promise<DbPhoto[]> {
  return (await convex.query(api.photos.listMine, {})) as unknown as DbPhoto[]
}
