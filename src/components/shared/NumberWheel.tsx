'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const ITEM_H = 48
const VISIBLE = 5 // מספר שורות גלויות (אי-זוגי כדי שתהיה שורה מרכזית)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H

// גלגל בחירת מספר כללי (כמו YearWheel אך לטווחים שרירותיים — מספר ילדים, גובה וכו')
export function NumberWheel({
  value,
  min,
  max,
  onChange,
  ascending = true,
  defaultView,
  autoSelect = false,
  formatLabel,
}: {
  value: string
  min: number
  max: number
  onChange: (v: string) => void
  ascending?: boolean // true: הקטן למעלה (ילדים) | false: הגדול למעלה (כמו שנים)
  defaultView?: number // המספר שיוצג במרכז כשאין ערך עדיין
  autoSelect?: boolean // האם לקבע מיד את הערך המוצג (לשדות חובה)
  formatLabel?: (n: number) => string
}) {
  const nums: number[] = []
  if (ascending) for (let n = min; n <= max; n++) nums.push(n)
  else for (let n = max; n >= min; n--) nums.push(n)

  const ref = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // גלילה למיקום ההתחלתי
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const initial = value !== '' ? Number(value) : (defaultView ?? min)
    const idx = Math.max(0, nums.indexOf(initial))
    el.scrollTop = idx * ITEM_H
    if (value === '' && autoSelect && nums[idx] !== undefined) onChange(String(nums[idx]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(nums.length - 1, idx))
      const n = nums[clamped]
      if (n !== undefined && String(n) !== value) onChange(String(n))
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
    }, 120)
  }

  const select = (n: number) => {
    const el = ref.current
    if (!el) return
    const idx = nums.indexOf(n)
    el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    onChange(String(n))
  }

  const label = (n: number) => (formatLabel ? formatLabel(n) : String(n))

  return (
    <div className="relative mx-auto select-none" style={{ height: VISIBLE * ITEM_H }}>
      {/* פס בחירה מרכזי — מאחורי המספרים */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-2xl bg-[#F5F5F5] border-2 border-[#0A0A0A] pointer-events-none z-0"
        style={{ height: ITEM_H }}
      />
      {/* דהייה למעלה ולמטה */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="relative z-10 h-full overflow-y-scroll no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {nums.map((n) => {
            const isSel = String(n) === value
            return (
              <button
                key={n}
                type="button"
                onClick={() => select(n)}
                className={cn(
                  'w-full flex items-center justify-center transition-all',
                  isSel ? 'text-[#0A0A0A] font-bold' : 'text-[#A3A3A3]'
                )}
                style={{ height: ITEM_H, scrollSnapAlign: 'center', fontSize: isSel ? 30 : 22 }}
              >
                {label(n)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
