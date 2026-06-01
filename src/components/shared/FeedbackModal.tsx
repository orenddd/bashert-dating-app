'use client'

import { useState, useRef } from 'react'
import { X, MessageSquare, Camera, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/shared/AuthProvider'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'bug', label: '🐛 באג / תקלה' },
  { value: 'feature', label: '💡 הצעה לשיפור' },
  { value: 'general', label: '💬 משוב כללי' },
  { value: 'other', label: '📝 אחר' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, 3 - screenshots.length)
    setScreenshots(prev => [...prev, ...arr])
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removeShot = (i: number) => {
    setScreenshots(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSend = async () => {
    if (!message.trim() || !user) return
    setSending(true)
    try {
      const supabase = createClient()
      const urls: string[] = []

      for (let i = 0; i < screenshots.length; i++) {
        const file = screenshots[i]
        const ext = file.name.split('.').pop() || 'png'
        const path = `${user.id}/${Date.now()}-${i}.${ext}`
        const { data: uploaded, error } = await supabase.storage
          .from('feedback-screenshots')
          .upload(path, file, { upsert: true })
        if (!error && uploaded) {
          const { data: { publicUrl } } = supabase.storage
            .from('feedback-screenshots')
            .getPublicUrl(uploaded.path)
          urls.push(publicUrl)
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('feedback') as any).insert({
        user_id: user.id,
        message: message.trim(),
        category,
        screenshots: urls,
        status: 'new',
      })

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setMessage('')
        setCategory('general')
        setScreenshots([])
        setPreviews([])
        onClose()
      }, 2000)
    } catch (err) {
      console.error('feedback error:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0A0A0A]" />
            <h2 className="font-bold text-[#0A0A0A] text-base">משוב למנהלי המערכת</h2>
          </div>
          <button onClick={onClose} className="text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-bold text-[#0A0A0A] text-lg">תודה על המשוב!</p>
            <p className="text-[#737373] text-sm">המנהלים יעיינו בהודעתך בהקדם.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide">סוג המשוב</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-all',
                      category === c.value
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : 'border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide">ההודעה שלך</p>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="תאר את הבעיה, הרעיון או ההצעה..."
                className="min-h-[100px] rounded-2xl border-[#E5E5E5] resize-none text-sm"
                dir="rtl"
              />
            </div>

            {/* Screenshots */}
            <div>
              <p className="text-xs font-semibold text-[#737373] mb-2 uppercase tracking-wide">
                צילומי מסך (אופציונלי, עד 3)
              </p>
              <div className="flex gap-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E5E5E5]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeShot(i)}
                      className="absolute top-0.5 end-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {screenshots.length < 3 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[#E5E5E5] flex flex-col items-center justify-center gap-1 hover:border-[#0A0A0A] transition-colors text-[#A3A3A3] hover:text-[#0A0A0A]"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">הוסף</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>
            </div>

            {/* Send */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-full bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-11 gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'שולח...' : 'שלח משוב'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
