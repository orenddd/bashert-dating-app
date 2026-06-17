'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const ITEM_H = 48
const VISIBLE = 5 // מספר שורות גלויות (אי-זוגי כדי שתהיה שורה מרכזית)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H

export function YearWheel({
  value,
  min,
  max,
  onChange,
}: {
  value: string
  min: number
  max: number
  onChange: (year: string) => void
}) {
  // שנים בסדר יורד — הצעירים למעלה
  const years: number[] = []
  for (let y = max; y >= min; y--) years.push(y)

  const ref = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // גלילה למיקום ההתחלתי (לפי value, אחרת ~1990)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const initial = value ? Number(value) : 1990
    const idx = Math.max(0, years.indexOf(initial))
    el.scrollTop = idx * ITEM_H
    if (!value && years[idx] !== undefined) onChange(String(years[idx]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(years.length - 1, idx))
      const year = years[clamped]
      if (year !== undefined && String(year) !== value) onChange(String(year))
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
    }, 120)
  }

  const selectYear = (y: number) => {
    const el = ref.current
    if (!el) return
    const idx = years.indexOf(y)
    el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    onChange(String(y))
  }

  return (
    <div className="relative mx-auto select-none" style={{ height: VISIBLE * ITEM_H }}>
      {/* פס בחירה מרכזי */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-2xl bg-[#F5F5F5] border-2 border-[#0A0A0A] pointer-events-none"
        style={{ height: ITEM_H }}
      />
      {/* דהייה למעלה ולמטה */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {years.map((y) => {
            const isSel = String(y) === value
            return (
              <button
                key={y}
                type="button"
                onClick={() => selectYear(y)}
                className={cn(
                  'w-full flex items-center justify-center transition-all',
                  isSel ? 'text-[#0A0A0A] font-bold' : 'text-[#A3A3A3]'
                )}
                style={{ height: ITEM_H, scrollSnapAlign: 'center', fontSize: isSel ? 30 : 22 }}
              >
                {y}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
