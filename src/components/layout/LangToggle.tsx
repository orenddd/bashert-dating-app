'use client'

import { useContext } from 'react'
import { LanguageContext } from '@/components/shared/LanguageProvider'
import { Button } from '@/components/ui/button'

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useContext(LanguageContext)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
      className={className}
    >
      {lang === 'he' ? 'EN' : 'עב'}
    </Button>
  )
}
