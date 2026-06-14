import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#050a1a]">
      {/* רקע — פוסטר המותג (כדור הארץ + הלוגו) */}
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: 'url(/logodatingapp.jpeg)' }}
      />

      {/* שכבת הכהיה בתחתית — לקריאוּת הכפתורים */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,10,26,0) 55%, rgba(5,10,26,0.55) 78%, rgba(5,10,26,0.92) 100%)',
        }}
      />

      {/* תוכן — כפתורי CTA בתחתית (הכותרת צרובה בתמונה) */}
      <div className="relative flex flex-col flex-1 px-7 pb-12 justify-end">
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full text-center bg-[#FFD24A] text-[#0A0A0A] text-lg font-bold py-4 rounded-full shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            יצירת חשבון
          </Link>
          <Link
            href="/login"
            className="w-full text-center bg-white/95 text-[#0A0A0A] text-lg font-bold py-4 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            יש לי כבר חשבון
          </Link>

          <p className="text-center text-white/45 text-xs leading-relaxed mt-4 px-2">
            בהרשמה אתם מאשרים את{' '}
            <span className="underline">תנאי השימוש</span> שלנו. ראו כיצד אנו
            משתמשים בנתונים שלכם ב<span className="underline">מדיניות הפרטיות</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
