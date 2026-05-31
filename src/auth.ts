import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false
      try {
        await prisma.$executeRaw`
          INSERT INTO "User" (id, email, name, image, provider, "providerId", "lastLoginAt", "createdAt", "updatedAt")
          VALUES (
            ${user.id ?? account?.providerAccountId ?? user.email},
            ${user.email},
            ${user.name ?? null},
            ${user.image ?? null},
            ${account?.provider ?? null},
            ${account?.providerAccountId ?? null},
            NOW(),
            NOW(),
            NOW()
          )
          ON CONFLICT (email) DO UPDATE
          SET name = EXCLUDED.name,
              image = EXCLUDED.image,
              "lastLoginAt" = NOW(),
              "updatedAt" = NOW()
        `
      } catch {
        // DB 오류가 있어도 로그인은 허용
      }
      return true
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        const rows = await prisma.$queryRaw<
          { id: string; status: string; suspendedUntil: Date | null }[]
        >`
          SELECT id, status, "suspendedUntil" FROM "User" WHERE email = ${profile.email} LIMIT 1
        `
        if (rows[0]) {
          token.dbId = rows[0].id
          token.status = rows[0].status
          token.suspendedUntil = rows[0].suspendedUntil?.toISOString() ?? null
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.dbId) session.user.id = token.dbId as string
      if (token.status) session.user.status = token.status as string
      if (token.suspendedUntil !== undefined) session.user.suspendedUntil = token.suspendedUntil as string | null
      return session
    },
  },
})
