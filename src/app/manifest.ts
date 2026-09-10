import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'מצאתי אותך — הכרויות',
    // short_name הוא הכיתוב שמופיע מתחת לאייקון במסך הבית
    short_name: 'מצאתי אותך',
    description: 'אהבה ישראלית בארצות הברית',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A2647',
    theme_color: '#0A2647',
    dir: 'rtl',
    lang: 'he',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
