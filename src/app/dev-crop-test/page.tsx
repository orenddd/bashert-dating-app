'use client'

// דף בדיקה זמני ל-PhotoCropDialog — נמחק אחרי האימות, לא חלק מהאפליקציה
import { useEffect, useState } from 'react'
import { PhotoCropDialog } from '@/components/profile/PhotoCropDialog'

export default function CropTestPage() {
  const [src, setSrc] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [info, setInfo] = useState('')

  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 900
    c.height = 1200
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 900, 1200)
    g.addColorStop(0, '#f59e0b')
    g.addColorStop(1, '#3b82f6')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 900, 1200)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(450, 400, 150, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.font = 'bold 90px sans-serif'
    ctx.fillText('TOP', 60, 130)
    ctx.fillText('BOTTOM', 60, 1150)
    c.toBlob(b => setSrc(URL.createObjectURL(b!)))
  }, [])

  if (result) {
    return (
      <div className="p-4">
        <p data-testid="result-info">{info}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result} alt="result" style={{ width: 240, border: '2px solid black' }} />
      </div>
    )
  }

  return src ? (
    <PhotoCropDialog
      src={src}
      onCancel={() => setInfo('cancelled')}
      onApply={f => {
        const u = URL.createObjectURL(f)
        const img = new Image()
        img.onload = () => setInfo(`${f.name} | ${f.type} | ${Math.round(f.size / 1024)}KB | ${img.naturalWidth}x${img.naturalHeight}`)
        img.src = u
        setResult(u)
      }}
    />
  ) : (
    <p>loading…</p>
  )
}
