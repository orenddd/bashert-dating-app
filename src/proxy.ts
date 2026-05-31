import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password']
const SETUP_PATH = '/setup-profile'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
  const isSetup = path === SETUP_PATH || path.startsWith(SETUP_PATH + '/')

  // לא מחובר + דף מוגן → login
  if (!session && !isPublic && !isSetup) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // לא מחובר + setup → login
  if (!session && isSetup) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // מחובר + login/register → בדוק profile_complete (DB query חד-פעמי)
  if (session && (path === '/login' || path === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_complete')
      .eq('user_id', session.user.id)
      .single()

    const dest = profile?.profile_complete ? '/discover' : SETUP_PATH
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
