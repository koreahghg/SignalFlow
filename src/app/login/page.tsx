import Link from 'next/link'
import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100svh-4rem-4rem)] sm:min-h-[calc(100svh-4rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">SignalFlow</h1>
          <p className="text-sm text-muted-foreground">매일 장 시작 전 단타 추천 종목 3개</p>
        </div>

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground touch-manipulation"
          >
            <GoogleIcon />
            Google로 로그인
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          로그인하면{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            서비스 이용약관
          </Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            개인정보 처리방침
          </Link>
          에 동의하는 것으로 간주합니다.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
      />
    </svg>
  )
}
