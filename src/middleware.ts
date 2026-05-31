import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/suspended', '/api/auth', '/terms', '/_next', '/favicon.ico']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (!token) return NextResponse.next()

  if (token.status === 'suspended') {
    const until = token.suspendedUntil
    const stillSuspended = !until || new Date(until) > new Date()
    if (stillSuspended) {
      return NextResponse.redirect(new URL('/suspended', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
