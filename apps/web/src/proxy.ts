import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/admin')

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', nextUrl))
    }
    return null
  }

  if (isDashboardRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  return null
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
