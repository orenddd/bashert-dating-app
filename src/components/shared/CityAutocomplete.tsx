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

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    countrycode?: string
    osm_key?: string
    osm_value?: string
  }
}

const PLACE_VALUES = ['city', 'town', 'village', 'hamlet', 'municipality']

function labelFor(p: PhotonFeature['properties']): string {
  const name = p.name || p.city || ''
  const parts = [name, p.state, p.country].filter(Boolean)
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
  const [results, setResults] = useState<PhotonFeature[]>([])
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

  // חיפוש עם debounce מול Photon (OpenStreetMap) — ללא מפתח, תומך CORS ועברית
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
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=he&limit=8`
        const res = await fetch(url, { signal: ctrl.signal })
        const json = await res.json()
        const feats: PhotonFeature[] = (json.features ?? []).filter(
          (f: PhotonFeature) =>
            f.properties.osm_key === 'place' &&
            PLACE_VALUES.includes(f.properties.osm_value ?? '')
        )
        // הסרת כפילויות לפי תווית
        const seen = new Set<string>()
        const unique = feats.filter((f) => {
          const l = labelFor(f.properties)
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
    }, 300)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  const choose = (f: PhotonFeature) => {
    const label = f.properties.name || f.properties.city || query
    const [lon, lat] = f.geometry.coordinates
    justSelected.current = true
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect({
      city: label,
      country: f.properties.countrycode?.toUpperCase() || f.properties.country || '',
      latitude: lat ?? null,
      longitude: lon ?? null,
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
          {results.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(f)
                }}
                className={cn(
                  'w-full text-right px-4 py-3 flex items-center gap-2 transition-colors',
                  i === activeIdx ? 'bg-[#F5F5F5]' : 'hover:bg-[#F5F5F5]'
                )}
              >
                <MapPin className="w-4 h-4 text-[#A3A3A3] flex-none" />
                <span className="text-sm text-[#0A0A0A] truncate">{labelFor(f.properties)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
