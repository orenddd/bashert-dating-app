// זיהוי פנים בצד הלקוח (MediaPipe BlazeFace) — רץ בדפדפן בלבד, בלי שרת.
// משמש בהעלאת תמונות פרופיל לשתי מטרות:
// 1. אזהרה/חסימה כשאין אף תמונה שבה רואים פנים
// 2. שמירת מוקד הפנים (0..1) כדי שהתצוגה תיחתך סביב הפנים ולא תסתיר אותם
// קובצי ה-WASM והמודל מוגשים מקומית מ-public/mediapipe (בלי CDN חיצוני).

import type { FaceDetector } from '@mediapipe/tasks-vision'

export interface FaceCheckResult {
  // face — זוהו פנים; no_face — נבדק ולא זוהו; unknown — הבדיקה נכשלה (לא חוסמים את המשתמש)
  status: 'face' | 'no_face' | 'unknown'
  focusX?: number // מרכז הפנים ביחס לרוחב התמונה (0..1)
  focusY?: number // מרכז הפנים ביחס לגובה התמונה (0..1)
}

const MIN_SCORE = 0.4
const MAX_SIDE = 1280 // מוקטן לפני הזיהוי — מהיר יותר ואין הבדל בדיוק

let detectorPromise: Promise<FaceDetector | null> | null = null

function getDetector(): Promise<FaceDetector | null> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
        return await FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite' },
          runningMode: 'IMAGE',
          minDetectionConfidence: MIN_SCORE,
        })
      } catch (err) {
        console.error('face detector init failed:', err)
        detectorPromise = null // ניסיון טעינה מחדש בקריאה הבאה
        return null
      }
    })()
  }
  return detectorPromise
}

async function loadToCanvas(source: File | string): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap
  if (typeof source === 'string') {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
      img.src = source
    })
    bitmap = await createImageBitmap(img)
  } else {
    bitmap = await createImageBitmap(source)
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// בודק אם יש פנים בתמונה (File שנבחר להעלאה או URL ציבורי).
// לעולם לא זורק — כשל טכני מחזיר 'unknown' כדי לא לחסום משתמשים.
export async function detectFace(source: File | string): Promise<FaceCheckResult> {
  if (typeof window === 'undefined') return { status: 'unknown' }
  try {
    const detector = await getDetector()
    if (!detector) return { status: 'unknown' }
    const canvas = await loadToCanvas(source)
    const { detections } = detector.detect(canvas)
    const best = detections
      .filter(d => (d.categories[0]?.score ?? 0) >= MIN_SCORE)
      .sort((a, b) => (b.categories[0]?.score ?? 0) - (a.categories[0]?.score ?? 0))[0]
    if (!best?.boundingBox) return { status: 'no_face' }
    const bb = best.boundingBox
    return {
      status: 'face',
      focusX: clamp01((bb.originX + bb.width / 2) / canvas.width),
      focusY: clamp01((bb.originY + bb.height / 2) / canvas.height),
    }
  } catch (err) {
    console.error('face detection failed:', err)
    return { status: 'unknown' }
  }
}

// object-position לתמונת פרופיל שנחתכת ב-object-cover:
// אם נשמר מוקד פנים — ממקמים את החיתוך סביבו; אחרת מעדיפים את השליש
// העליון (שם בדרך כלל הפנים בתמונות עומדות) על פני מרכז התמונה.
export function photoObjectPosition(
  photo?: { face_focus_x?: number | null; face_focus_y?: number | null; media_type?: string } | null
): string | undefined {
  if (!photo) return undefined
  if (photo.media_type && photo.media_type !== 'image') return undefined
  if (photo.face_focus_x != null && photo.face_focus_y != null) {
    return `${Math.round(clamp01(photo.face_focus_x) * 100)}% ${Math.round(clamp01(photo.face_focus_y) * 100)}%`
  }
  return '50% 30%'
}
