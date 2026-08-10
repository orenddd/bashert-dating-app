'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { photoObjectPosition } from '@/lib/faceDetection'
import type { DbPhoto } from '@/lib/types/database'

// פס שם דביק: מוצג בראש המסך ברגע שהשם המקורי נגלל אל מחוץ לתצוגה.
// הקומפוננטה מרנדרת "חיישן" (sentinel) שיש למקם בגובה השם בעמוד —
// כשהוא עובר מעל קצה המסך, הפס נשלף מלמעלה.
export function StickyNameBar({
  name,
  age,
  verified,
  photo,
}: {
  name: string
  age?: number | null
  verified?: boolean
  photo?: DbPhoto | null
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px -mt-px" />
      <div
        className={cn(
          'fixed top-0 inset-x-0 md:ms-64 z-40 transition-all duration-200',
          show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <div className="bg-[#F5F5F5]/90 backdrop-blur-md border-b border-[#E5E5E5] shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2.5">
            {photo && (
              <img
                src={photo.url}
                alt={name}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E5E5]"
                style={{ objectPosition: photoObjectPosition(photo) }}
              />
            )}
            <span className="font-serif text-lg font-black text-[#171411] tracking-tight truncate">{name}</span>
            {age != null && <span className="text-base font-light text-[#171411]">{age}</span>}
            {verified && <Shield className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />}
          </div>
        </div>
      </div>
    </>
  )
}
