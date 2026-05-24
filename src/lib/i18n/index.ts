'use client'

import { useContext } from 'react'
import { LanguageContext } from '@/components/shared/LanguageProvider'
import he from './he'
import en from './en'

export type Language = 'he' | 'en'
export type Translations = typeof he

export function useTranslation() {
  const { lang } = useContext(LanguageContext)
  const t = lang === 'he' ? he : en
  return { t, lang, isRTL: lang === 'he' }
}
