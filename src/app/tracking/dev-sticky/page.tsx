'use client'

// דף בדיקה זמני ל-StickyNameBar — למחיקה אחרי האימות
import { StickyNameBar } from '@/components/profile/StickyNameBar'
import type { DbPhoto } from '@/lib/types/database'

const mockPhoto: DbPhoto = {
  id: 'p1',
  user_id: 'u1',
  url: 'https://picsum.photos/seed/sticky-test/600/800',
  thumbnail_url: '',
  is_primary: true,
  order_index: 0,
  media_type: 'image',
  created_at: '',
}

export default function DevStickyPage() {
  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 py-5">
      <div className="rounded-3xl overflow-hidden bg-[#EBE4D2] aspect-[3/4] mb-5">
        <img src={mockPhoto.url} alt="" className="w-full h-full object-cover" />
      </div>
      <StickyNameBar name="דנה כ." age={29} verified photo={mockPhoto} />
      <h1 className="font-serif text-3xl font-black text-[#171411]">דנה כ. <span className="font-light text-2xl text-[#A3A3A3]">29</span></h1>
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i} className="my-6 text-sm text-[#404040]">שורת תוכן {i + 1} — טקסט למילוי כדי לאפשר גלילה ארוכה בפרופיל.</p>
      ))}
    </div>
  )
}
