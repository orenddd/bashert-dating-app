import { convex } from '@/lib/convex/client'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

type UploadKind = 'photo' | 'feedback'

// העלאת קובץ ל-Convex Storage: כתובת חד-פעמית מהשרת ואז POST ישיר
export async function uploadToStorage(file: File | Blob, kind: UploadKind = 'photo'): Promise<Id<'_storage'>> {
  const uploadUrl = await convex.mutation(
    kind === 'photo' ? api.photos.generateUploadUrl : api.feedback.generateUploadUrl,
    {},
  )
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!res.ok) throw new Error(`העלאת הקובץ נכשלה (${res.status})`)
  const { storageId } = (await res.json()) as { storageId: Id<'_storage'> }
  return storageId
}

// כתובת צפייה לקובץ שהועלה זה עתה
export async function storageUrl(storageId: Id<'_storage'>): Promise<string | null> {
  return await convex.query(api.photos.storageUrl, { storage_id: storageId })
}

// מחיקת קובץ שהועלה ולא נשמר (ביטול בעורך)
export async function discardUpload(storageId: Id<'_storage'>): Promise<void> {
  await convex.mutation(api.photos.discardUpload, { storage_id: storageId })
}
