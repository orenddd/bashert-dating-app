'use client'

// עורך תמונה לפני שמירה: זום (סליידר / גלגלת / צביטה), גרירה למיקום וסיבוב,
// עם חיתוך ליחס 3:4 — אותו יחס שבו התמונות מוצגות בפרופיל.
// הפלט הוא קובץ JPEG חדש שנחתך בפועל (לא רק שינוי תצוגה).

import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCw, ZoomIn, ZoomOut, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const ASPECT_W = 3
const ASPECT_H = 4
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const MAX_SOURCE_SIDE = 2400 // תמונות ענק מוקטנות לפני החיתוך — חוסך זיכרון בלי אובדן נראה
const MAX_OUTPUT_WIDTH = 1080

interface PhotoCropDialogProps {
  src: string // blob URL של קובץ שנבחר, או URL ציבורי של תמונה שכבר הועלתה
  onCancel: () => void
  onApply: (file: File) => void
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function PhotoCropDialog({ src, onCancel, onApply }: PhotoCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // מעלות, כפולות של 90
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [exporting, setExporting] = useState(false)
  const [loadError, setLoadError] = useState(false)
  // מגעים פעילים — לגרירה ולזיהוי צביטה בשתי אצבעות
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())

  // מידות מסגרת החיתוך לפי רוחב המסך
  useEffect(() => {
    const measure = () => {
      const w = Math.min(window.innerWidth - 48, 320)
      const maxH = window.innerHeight - 300 // משאיר מקום לכותרת ולפקדים
      const h = Math.min(Math.round((w * ASPECT_H) / ASPECT_W), Math.max(maxH, 240))
      setFrame({ w: Math.round((h * ASPECT_W) / ASPECT_H), h })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // מידות התמונה בהתחשב בסיבוב
  const effSize = useCallback((rot: number) => {
    if (!imgSize) return { w: 1, h: 1 }
    return rot % 180 === 0 ? { w: imgSize.w, h: imgSize.h } : { w: imgSize.h, h: imgSize.w }
  }, [imgSize])

  // הסקייל שממפה פיקסלים של התמונה לפיקסלים על המסך (cover של המסגרת × זום)
  const coverScale = useCallback((rot: number) => {
    if (!frame) return 1
    const { w, h } = effSize(rot)
    return Math.max(frame.w / w, frame.h / h)
  }, [frame, effSize])

  const screenScale = coverScale(rotation) * zoom

  // התמונה חייבת תמיד לכסות את כל מסגרת החיתוך
  const clampOffset = useCallback((o: { x: number; y: number }, z: number, rot: number) => {
    if (!frame) return o
    const { w, h } = effSize(rot)
    const s = coverScale(rot) * z
    const maxX = Math.max(0, (w * s - frame.w) / 2)
    const maxY = Math.max(0, (h * s - frame.h) / 2)
    return { x: clamp(o.x, -maxX, maxX), y: clamp(o.y, -maxY, maxY) }
  }, [frame, effSize, coverScale])

  // זום סביב נקודה (ביחס למרכז המסגרת) — הנקודה שמתחת לאצבע/סמן נשארת במקום
  const zoomAround = useCallback((newZoom: number, point: { x: number; y: number }) => {
    const z = clamp(newZoom, MIN_ZOOM, MAX_ZOOM)
    const ratio = z / zoom
    setZoom(z)
    setOffset(prev => clampOffset({
      x: point.x - (point.x - prev.x) * ratio,
      y: point.y - (point.y - prev.y) * ratio,
    }, z, rotation))
  }, [zoom, clampOffset, rotation])

  const rotate = () => {
    const next = (rotation + 90) % 360
    setRotation(next)
    setOffset(o => clampOffset(o, zoom, next))
  }

  // ─── מחוות עכבר ומגע ────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    frameRef.current?.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const pointers = pointersRef.current
    if (!pointers.has(e.pointerId) || !frame) return
    const prev = pointers.get(e.pointerId)!
    const cur = { x: e.clientX, y: e.clientY }

    if (pointers.size === 1) {
      // גרירה
      setOffset(o => clampOffset({ x: o.x + cur.x - prev.x, y: o.y + cur.y - prev.y }, zoom, rotation))
    } else if (pointers.size === 2) {
      // צביטה — זום סביב נקודת האמצע בין שתי האצבעות
      const [a, b] = [...pointers.entries()].map(([id, p]) => (id === e.pointerId ? { id, p: cur } : { id, p }))
      const prevDist = Math.hypot(
        [...pointers.values()][0].x - [...pointers.values()][1].x,
        [...pointers.values()][0].y - [...pointers.values()][1].y,
      )
      const newDist = Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y)
      if (prevDist > 0) {
        const rect = frameRef.current!.getBoundingClientRect()
        const mid = {
          x: (a.p.x + b.p.x) / 2 - (rect.left + rect.width / 2),
          y: (a.p.y + b.p.y) / 2 - (rect.top + rect.height / 2),
        }
        zoomAround(zoom * (newDist / prevDist), mid)
      }
    }
    pointers.set(e.pointerId, cur)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const point = {
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2),
    }
    zoomAround(zoom * Math.exp(-e.deltaY * 0.002), point)
  }

  // ─── חיתוך בפועל וייצוא ─────────────────────────────────────────────────────
  const applyCrop = async () => {
    const img = imgRef.current
    if (!img || !imgSize || !frame) return
    setExporting(true)
    try {
      // שלב 1: תמונה מסובבת (ומוקטנת אם ענקית) על קנבס ביניים
      const eff = effSize(rotation)
      const k = Math.min(1, MAX_SOURCE_SIDE / Math.max(eff.w, eff.h))
      const rotCanvas = document.createElement('canvas')
      rotCanvas.width = Math.max(1, Math.round(eff.w * k))
      rotCanvas.height = Math.max(1, Math.round(eff.h * k))
      const rctx = rotCanvas.getContext('2d')!
      rctx.translate(rotCanvas.width / 2, rotCanvas.height / 2)
      rctx.rotate((rotation * Math.PI) / 180)
      rctx.drawImage(img, (-imgSize.w * k) / 2, (-imgSize.h * k) / 2, imgSize.w * k, imgSize.h * k)

      // שלב 2: חישוב מלבן החיתוך בקואורדינטות התמונה המסובבת
      const cropW = (frame.w / screenScale) * k
      const cropH = (frame.h / screenScale) * k
      const sx = ((eff.w * k) - cropW) / 2 - (offset.x / screenScale) * k
      const sy = ((eff.h * k) - cropH) / 2 - (offset.y / screenScale) * k

      const outW = Math.max(1, Math.round(Math.min(cropW, MAX_OUTPUT_WIDTH)))
      const outH = Math.max(1, Math.round((outW * frame.h) / frame.w))
      const outCanvas = document.createElement('canvas')
      outCanvas.width = outW
      outCanvas.height = outH
      outCanvas.getContext('2d')!.drawImage(rotCanvas, sx, sy, cropW, cropH, 0, 0, outW, outH)

      const blob = await new Promise<Blob | null>(resolve =>
        outCanvas.toBlob(resolve, 'image/jpeg', 0.9)
      )
      if (!blob) throw new Error('toBlob failed')
      onApply(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    } catch (err) {
      console.error('crop export failed:', err)
      toast.error('שגיאה בעריכת התמונה. נסו שוב.')
      setExporting(false)
    }
  }

  const disabled = !imgSize || !frame || exporting

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        <div className="text-center">
          <h2 className="text-white text-lg font-bold">עריכת תמונה</h2>
          <p className="text-white/60 text-xs mt-1">גררו למיקום הרצוי, עשו זום בצביטה או בסליידר</p>
        </div>

        {/* מסגרת החיתוך */}
        <div
          ref={frameRef}
          className="relative overflow-hidden rounded-2xl bg-neutral-900 select-none"
          style={{ width: frame?.w, height: frame?.h, touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            crossOrigin={src.startsWith('blob:') ? undefined : 'anonymous'}
            onLoad={e => setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onError={() => setLoadError(true)}
            className="absolute top-1/2 left-1/2 max-w-none"
            style={{
              width: imgSize?.w,
              height: imgSize?.h,
              visibility: imgSize ? 'visible' : 'hidden',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${screenScale})`,
            }}
          />
          {/* קווי שליש עדינים לעזרה במיקום */}
          {imgSize && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute inset-0 rounded-2xl border border-white/30" />
            </div>
          )}
          {!imgSize && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="text-white/70 text-sm text-center">לא הצלחנו לטעון את התמונה לעריכה</p>
            </div>
          )}
        </div>

        {/* פקדי זום וסיבוב */}
        <div className="w-full flex items-center gap-3" dir="ltr">
          <ZoomOut className="w-4 h-4 text-white/60 shrink-0" />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={disabled}
            onChange={e => zoomAround(Number(e.target.value), { x: 0, y: 0 })}
            className="flex-1 accent-white"
          />
          <ZoomIn className="w-4 h-4 text-white/60 shrink-0" />
          <button
            type="button"
            onClick={rotate}
            disabled={disabled}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors"
            aria-label="סיבוב 90 מעלות"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* אישור / ביטול */}
        <div className="w-full flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={exporting}
            className="flex-1 h-12 rounded-2xl border border-white/25 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
            ביטול
          </button>
          <button
            type="button"
            onClick={applyCrop}
            disabled={disabled || loadError}
            className="flex-1 h-12 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            שמירה
          </button>
        </div>
      </div>
    </div>
  )
}
