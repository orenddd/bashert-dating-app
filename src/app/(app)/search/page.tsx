'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import { fetchDiscoverProfiles } from '@/lib/api/profiles'
import { calcAge } from '@/lib/utils/age'
import { JewishAttributesBadges } from '@/components/profile/JewishAttributesBadges'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Shield, SlidersHorizontal, Search, MapPin, X } from 'lucide-react'
import type { SearchFilters } from '@/lib/types/forms'
import type { DbProfile, DbPhoto } from '@/lib/types/database'
import { useAuth } from '@/components/shared/AuthProvider'

const DEFAULT_FILTERS: Partial<SearchFilters> = {
  age_min: 25, age_max: 45,
  religious_levels: [],
  community_backgrounds: [],
  shomer_shabbat_only: false,
  verified_only: false,
  has_photos_only: true,
}

export default function SearchPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [filters, setFilters] = useState<Partial<SearchFilters>>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Partial<SearchFilters>>(DEFAULT_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [results, setResults] = useState<{ profile: DbProfile; photos: DbPhoto[] }[]>([])
  const [loading, setLoading] = useState(true)

  const loadResults = useCallback(async (f: Partial<SearchFilters>) => {
    if (!user) return
    setLoading(true)
    const data = await fetchDiscoverProfiles(user.id, f)
    setResults(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadResults(appliedFilters)
  }, [appliedFilters, loadResults])

  const applyFilters = () => {
    setAppliedFilters(filters)
    setSheetOpen(false)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const activeFilterCount = [
    appliedFilters.shomer_shabbat_only,
    appliedFilters.verified_only,
    (appliedFilters.religious_levels?.length ?? 0) > 0,
    (appliedFilters.community_backgrounds?.length ?? 0) > 0,
  ].filter(Boolean).length

  return (
    <div>
      <AppHeader title={t.search.title} />
      <div className="p-4 md:p-6">
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="inline-flex items-center gap-2 rounded-full border border-input bg-background hover:bg-accent px-4 h-9 text-sm font-medium relative cursor-pointer transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              {t.search.apply_filters}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-[#B8472A] text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-4 pb-6">
              <div className="max-w-lg mx-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center text-base font-bold text-[#171411]">{t.search.apply_filters}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5">
                {/* גיל */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">טווח גיל</Label>
                  <div className="flex items-center gap-3" dir="ltr">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">מ-</span>
                      <Select value={String(filters.age_min)} onValueChange={v => setFilters(f => ({ ...f, age_min: Number(v) }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 53 }, (_, i) => i + 18).map(age => (
                            <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-gray-300 pt-5">—</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">עד</span>
                      <Select value={String(filters.age_max)} onValueChange={v => setFilters(f => ({ ...f, age_max: Number(v) }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 53 }, (_, i) => i + 18).map(age => (
                            <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* רמה דתית */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">{t.religious.level_label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'] as const).map(r => {
                      const selected = filters.religious_levels?.includes(r)
                      return (
                        <button
                          key={r}
                          onClick={() => setFilters(f => ({
                            ...f,
                            religious_levels: selected
                              ? (f.religious_levels ?? []).filter(x => x !== r)
                              : [...(f.religious_levels ?? []), r]
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#171411] text-white border-[#171411]' : 'border-[rgba(23,20,17,0.15)] text-[#171411] hover:border-[rgba(23,20,17,0.4)]'}`}
                        >
                          {t.religious[r]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* רקע קהילתי */}
                <div>
                  <Label className="text-sm font-semibold text-[#171411] mb-2 block">{t.community.background_label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed'] as const).map(c => {
                      const selected = filters.community_backgrounds?.includes(c)
                      return (
                        <button
                          key={c}
                          onClick={() => setFilters(f => ({
                            ...f,
                            community_backgrounds: selected
                              ? (f.community_backgrounds ?? []).filter(x => x !== c)
                              : [...(f.community_backgrounds ?? []), c]
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? 'bg-[#B8472A] text-white border-[#B8472A]' : 'border-[rgba(23,20,17,0.15)] text-[#171411] hover:border-[rgba(23,20,17,0.4)]'}`}
                        >
                          {t.community[c]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* מתגים */}
                <div className="space-y-3 bg-[#F7F2E8] rounded-2xl p-4">
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={filters.shomer_shabbat_only} onCheckedChange={v => setFilters(f => ({ ...f, shomer_shabbat_only: v }))} />
                    <Label className="text-sm text-[#171411]">{t.search.shomer_shabbat}</Label>
                  </div>
                  <div className="h-px bg-[rgba(23,20,17,0.08)]" />
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={filters.verified_only} onCheckedChange={v => setFilters(f => ({ ...f, verified_only: v }))} />
                    <Label className="text-sm text-[#171411]">{t.search.verified_only}</Label>
                  </div>
                  <div className="h-px bg-[rgba(23,20,17,0.08)]" />
                  <div className="flex items-center justify-between" dir="ltr">
                    <Switch checked={filters.has_photos_only} onCheckedChange={v => setFilters(f => ({ ...f, has_photos_only: v }))} />
                    <Label className="text-sm text-[#171411]">עם תמונות בלבד</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-2xl border-[rgba(23,20,17,0.15)]">
                    <X className="w-4 h-4 me-2" /> {t.search.clear_filters}
                  </Button>
                  <Button onClick={applyFilters} className="flex-1 bg-[#171411] hover:bg-[#2A2520] text-white rounded-2xl">
                    <Search className="w-4 h-4 me-2" /> {t.search.apply_filters}
                  </Button>
                </div>
              </div>
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm text-gray-500">
            {loading ? 'מחפש...' : `${results.length} ${t.search.results}`}
          </span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#EBE4D2] rounded-3xl animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(({ profile, photos }) => {
              const photo = photos.find(p => p.is_primary) ?? photos[0]
              const photoUrl = photo?.url ?? `https://picsum.photos/seed/${profile.user_id}-1/400/500`
              const age = calcAge(profile.date_of_birth)

              return (
                <Link key={profile.id} href={`/profile/${profile.user_id}`}>
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-[#B8472A]/30 hover:shadow-md transition-all group">
                    <div className="relative aspect-[3/4]">
                      <img src={photoUrl} alt={profile.first_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {profile.is_online && <div className="absolute top-2 end-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
                      {profile.is_verified && <div className="absolute top-2 start-2"><Shield className="w-4 h-4 text-blue-400 fill-blue-400" /></div>}
                      <div className="absolute bottom-0 start-0 end-0 p-3 text-white">
                        <p className="font-bold text-sm">{profile.first_name}, {age}</p>
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <MapPin className="w-3 h-3" />{profile.city}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <JewishAttributesBadges profile={profile} compact />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">{t.search.no_results}</p>
            <p className="text-gray-300 text-sm mt-2">{t.search.no_results_sub}</p>
          </div>
        )}
      </div>
    </div>
  )
}
