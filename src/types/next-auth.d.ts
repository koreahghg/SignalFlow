import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      status?: string
      suspendedUntil?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dbId?: string
    status?: string
    suspendedUntil?: string | null
  }
}
