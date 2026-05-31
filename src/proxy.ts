import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isPublicPage =
    pathname === '/login' || pathname === '/terms' || pathname === '/privacy' || pathname === '/suspended'

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isLoggedIn && pathname !== '/suspended') {
    const status = req.auth?.user?.status
    const suspendedUntil = req.auth?.user?.suspendedUntil
    if (status === 'suspended') {
      const stillSuspended = !suspendedUntil || new Date(suspendedUntil) > new Date()
      if (stillSuspended) {
        return NextResponse.redirect(new URL('/suspended', req.url))
      }
    }
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
