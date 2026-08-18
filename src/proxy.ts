import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/tracking',
])

// דפים שדורשים התחברות: הכל חוץ מהציבוריים. בדיקת השלמת הפרופיל
// נעשית בצד הלקוח ב-(app)/layout.tsx, שם כבר יש את נתוני הפרופיל.
export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated()

  if (!isPublicRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/login')
  }

  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/home')
  }
})

export const config = {
  // כולל /api/auth — שם רץ זרימת ההזדהות של Convex Auth
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
