'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import type { DbProfile } from '@/lib/types/database'
import { Star, Globe, BookOpen } from 'lucide-react'

interface Props {
  profile: DbProfile
  compact?: boolean
}

export function JewishAttributesBadges({ profile, compact }: Props) {
  const { t } = useTranslation()

  const badges = [
    {
      label: t.religious[profile.religious_level],
      color: 'bg-blue-100 text-blue-700',
      show: true,
    },
    {
      label: profile.shomer_shabbat ? t.religious.shomer_shabbat : null,
      color: 'bg-purple-100 text-purple-700',
      show: profile.shomer_shabbat,
    },
    {
      label: t.community[profile.community_background],
      color: 'bg-amber-100 text-amber-700',
      show: true,
    },
    {
      label: profile.hebrew_fluency !== 'none' ? t.community[`hebrew_${profile.hebrew_fluency}` as keyof typeof t.community] : null,
      color: 'bg-green-100 text-green-700',
      show: profile.hebrew_fluency !== 'none',
    },
    {
      label: profile.aliyah_plan !== 'no' ? t.community[`aliyah_${profile.aliyah_plan === 'already_made' ? 'done' : profile.aliyah_plan}` as keyof typeof t.community] : null,
      color: 'bg-rose-100 text-rose-700',
      show: profile.aliyah_plan !== 'no',
    },
  ].filter(b => b.show && b.label)

  if (compact) return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 3).map((b, i) => (
        <Badge key={i} className={`text-xs px-2 py-0.5 rounded-full border-0 ${b.color}`}>
          {b.label}
        </Badge>
      ))}
    </div>
  )

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <Badge key={i} className={`text-xs px-2.5 py-1 rounded-full border-0 ${b.color}`}>
          {b.label}
        </Badge>
      ))}
    </div>
  )
}
