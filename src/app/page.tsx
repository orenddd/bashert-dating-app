import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#0A2647]">
      {/* מילוי המסך בגוני המותג — כדי שהלוגו לא ייחתך ובכל זאת אין פסים ריקים */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 28%, #2E7FD4 0%, #1A5CA8 38%, #0D3A73 68%, #061C3D 100%)',
        }}
      />

      {/* הלוגו — מוצג במלואו, ללא חיתוך. הפינות המעוגלות גוזרות את המסגרת השחורה */}
      <div className="absolute inset-x-0 top-[10%] flex justify-center px-5">
        <img
          src="/home-bg.jpeg"
          alt="מצאתי אותך — אהבה ישראלית בארצות הברית"
          className="w-full max-w-[420px] rounded-[17%] shadow-2xl shadow-black/40"
        />
      </div>

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
            className="w-full text-center bg-[#FFD24A] text-[#0A0A0A] text-base font-bold py-3 rounded-full shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            יצירת חשבון
          </Link>
          <Link
            href="/login"
            className="w-full text-center bg-white/95 text-[#0A0A0A] text-base font-bold py-3 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
