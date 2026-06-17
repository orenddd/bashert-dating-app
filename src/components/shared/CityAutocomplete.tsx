'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CitySelection {
  city: string
  country: string
  latitude: number | null
  longitude: number | null
}

// תוצאה מ-Nominatim (OpenStreetMap) בפורמט jsonv2
interface NominatimResult {
  lat: string
  lon: string
  name?: string
  display_name?: string
  category?: string
  type?: string
  addresstype?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
    country_code?: string
  }
}

const PLACE_TYPES = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb']

// ערים ב-jsonv2 חוזרות לרוב כ-category=boundary/type=administrative עם addresstype=city
function isSettlement(r: NominatimResult): boolean {
  return (
    PLACE_TYPES.includes(r.addresstype ?? '') ||
    (r.category === 'place' && PLACE_TYPES.includes(r.type ?? ''))
  )
}

function cityNameOf(r: NominatimResult): string {
  const a = r.address ?? {}
  return r.name || a.city || a.town || a.village || a.municipality || (r.display_name?.split(',')[0] ?? '')
}

function labelFor(r: NominatimResult): string {
  const a = r.address ?? {}
  const parts = [cityNameOf(r), a.state, a.country].filter(Boolean)
  return parts.join(', ')
}

export function CityAutocomplete({
  value,
  onSelect,
  placeholder,
}: {
  value: string
  onSelect: (sel: CitySelection) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const justSelected = useRef(false)

  // סגירה בלחיצה מחוץ לרכיב
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // חיפוש עם debounce מול Nominatim (OpenStreetMap) — ללא מפתח, תומך בעברית ו-CORS
  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false
      return
    }
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
          `&accept-language=he&limit=10&q=${encodeURIComponent(q)}`
        const res = await fetch(url, { signal: ctrl.signal })
        const json: NominatimResult[] = await res.json()
        const feats = (Array.isArray(json) ? json : []).filter(isSettlement)
        // הסרת כפילויות לפי תווית
        const seen = new Set<string>()
        const unique = feats.filter((r) => {
          const l = labelFor(r)
          if (seen.has(l)) return false
          seen.add(l)
          return true
        })
        setResults(unique.slice(0, 6))
        setOpen(unique.length > 0)
        setActiveIdx(-1)
      } catch {
        /* התעלמות משגיאת abort/רשת */
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  const choose = (r: NominatimResult) => {
    const label = cityNameOf(r) || query
    justSelected.current = true
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect({
      city: label,
      country: r.address?.country_code?.toUpperCase() || r.address?.country || '',
      latitude: r.lat ? Number(r.lat) : null,
      longitude: r.lon ? Number(r.lon) : null,
    })
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <MapPin className="absolute top-1/2 -translate-y-1/2 end-4 w-5 h-5 text-[#A3A3A3] pointer-events-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            // עדכון הטקסט החופשי גם אם לא נבחרה הצעה
            onSelect({ city: e.target.value, country: '', latitude: null, longitude: null })
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIdx((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIdx((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && activeIdx >= 0) {
              e.preventDefault()
              choose(results[activeIdx])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder={placeholder}
          className="w-full h-14 rounded-2xl border border-[#E5E5E5] ps-4 pe-12 text-base outline-none focus:border-[#0A0A0A] transition-colors"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 -translate-y-1/2 start-4 w-4 h-4 text-[#A3A3A3] animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-[#E5E5E5] shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(r)
                }}
                className={cn(
                  'w-full text-right px-4 py-3 flex items-center gap-2 transition-colors',
                  i === activeIdx ? 'bg-[#F5F5F5]' : 'hover:bg-[#F5F5F5]'
                )}
              >
                <MapPin className="w-4 h-4 text-[#A3A3A3] flex-none" />
                <span className="text-sm text-[#0A0A0A] truncate">{labelFor(r)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
