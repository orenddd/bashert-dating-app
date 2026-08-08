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

  // מציגים רק שדות שנאספים בפועל בשאלון (רקע קהילתי, רמת עברית ותוכניות עלייה אינם נשאלים)
  const badges = [
    {
      label: t.religious[profile.religious_level],
      color: 'bg-blue-100 text-blue-700',
      show: true,
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
