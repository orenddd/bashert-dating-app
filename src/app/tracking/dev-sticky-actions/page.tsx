'use client'

// דף בדיקה זמני לסרגל הפעולות הדביק בעמוד פרופיל — למחיקה אחרי האימות.
// משכפל את אותם קלאסים ולוגיקת IntersectionObserver מ-profile/[userId],
// כולל חיקוי של תפריט הניווט התחתון במובייל (z-40) לבדיקת ההיסט.
import { useEffect, useRef, useState } from 'react'
import { Heart, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DevStickyActionsPage() {
  const actionsRef = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)
  const [liked, setLiked] = useState(false)
  const [superLiked, setSuperLiked] = useState(false)

  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const actionButtons = (
    <>
      <Button
        className={cn('flex-1 h-12 rounded-2xl font-bold transition-all',
          liked ? 'bg-[#B8472A] text-white hover:bg-[#7A2E18]'
            : 'bg-[#EBE4D2] text-[rgba(23,20,17,0.65)] hover:bg-[#B8472A] hover:text-white'
        )}
        onClick={() => setLiked(v => !v)}
      >
        <Heart className={cn('w-4 h-4 me-2', liked && 'fill-white')} />
        {liked ? '❤️ לייקת!' : 'לייק'}
      </Button>
      <Button
        className="flex-1 h-12 bg-[#171411] hover:bg-[#2A2520] text-[#F2EDDF] rounded-2xl font-bold"
        onClick={() => {}}
      >
        <MessageCircle className="w-4 h-4 me-2" />
        הודעה
      </Button>
      <Button
        variant="outline"
        className={cn('w-12 h-12 rounded-2xl p-0 transition-all border-[rgba(23,20,17,0.15)]',
          superLiked ? 'bg-[#171411] text-[#F2EDDF] border-[#171411]' : 'text-[rgba(23,20,17,0.55)] hover:bg-[rgba(23,20,17,0.06)]'
        )}
        onClick={() => setSuperLiked(v => !v)}
      >
        <Star className={cn('w-5 h-5', superLiked ? 'fill-[#F2EDDF]' : '')} />
      </Button>
    </>
  )

  return (
    <div dir="rtl" className={cn('max-w-2xl mx-auto px-4 py-5 pb-20', showSticky ? 'md:pb-28' : 'md:pb-6')}>
      <div className="rounded-3xl bg-[#EBE4D2] aspect-[3/4] mb-5 flex items-center justify-center text-6xl">👤</div>
      <div ref={actionsRef} className="flex gap-3">
        {actionButtons}
      </div>
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i} className="my-6 text-sm text-[#404040]">שורת תוכן {i + 1} — טקסט למילוי כדי לאפשר גלילה ארוכה בפרופיל.</p>
      ))}

      {/* Sticky action bar — זהה לעמוד הפרופיל */}
      <div className={cn(
        'fixed bottom-[70px] md:bottom-0 left-0 right-0 md:ms-64 z-30',
        'bg-white/95 backdrop-blur-sm border-t border-[#E5E5E5] px-4 py-2.5 md:pb-[max(0.625rem,env(safe-area-inset-bottom))]',
        'transition-all duration-300',
        showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      )}>
        <div className="max-w-2xl mx-auto flex gap-3">
          {actionButtons}
        </div>
      </div>

      {/* חיקוי תפריט תחתון של מובייל (AppNav) לבדיקת ההיסט */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E5E5E5] z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {['גילוי', 'התאמות', 'הודעות', 'פרופיל'].map(l => (
            <span key={l} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[#C0C0C0]">
              <Heart className="w-5 h-5" />
              <span className="text-[10px] font-medium">{l}</span>
            </span>
          ))}
        </div>
      </nav>
    </div>
  )
}
