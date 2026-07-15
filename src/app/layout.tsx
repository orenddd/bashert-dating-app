import type { Metadata, Viewport } from 'next'
import { Heebo, Frank_Ruhl_Libre } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/shared/LanguageProvider'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { Toaster } from '@/components/ui/sonner'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-frank-ruhl',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'מצאתי אותך — הכרויות',
  description: 'אפליקציית ההיכרויות הישראלית — מצא את הזיווג שלך',
  // האייקונים נטענים אוטומטית מקבצי הקונבנציה של Next:
  // src/app/favicon.ico, src/app/icon.png, src/app/apple-icon.png
}

// resizes-content מבטיח שכאשר מקלדת הטלפון נפתחת, ה-viewport מתכווץ
// וכך אלמנטים עם position:fixed bottom-0 (כמו כפתור ה"המשך") נשארים מעל המקלדת
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${heebo.variable} ${frankRuhl.variable}`}>
      <body className={`antialiased min-h-screen bg-background ${heebo.className}`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
