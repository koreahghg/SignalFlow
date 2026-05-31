import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isPublicPage =
    pathname === '/login' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/suspended' ||
    pathname === '/activate'

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isLoggedIn) {
    const status = req.auth?.user?.status
    const suspendedUntil = req.auth?.user?.suspendedUntil

    if (status === 'suspended' && pathname !== '/suspended') {
      const stillSuspended = !suspendedUntil || new Date(suspendedUntil) > new Date()
      if (stillSuspended) return NextResponse.redirect(new URL('/suspended', req.url))
    }

  }

  // 서버 컴포넌트에서 현재 pathname을 읽을 수 있도록 헤더로 전달
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
