'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Shield, ShieldOff, UserCog, ChevronDown, ChevronUp } from 'lucide-react'

type User = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  status: string
  suspendedAt: string | null
  suspendedUntil: string | null
  suspendReason: string | null
  lastLoginAt: string | null
  createdAt: string
  _count: { trades: number }
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function Avatar({ user }: { user: User }) {
  if (user.image) {
    return <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="rounded-full" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {(user.name ?? user.email)[0].toUpperCase()}
    </div>
  )
}

function SuspendForm({ user, onDone }: { user: User; onDone: (updated: User) => void }) {
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', suspendReason: reason || null, suspendedUntil: until || null }),
      })
      if (!res.ok) { toast.error('정지 처리에 실패했습니다.'); return }
      const updated = await res.json()
      toast.success(`${user.name ?? user.email} 계정을 정지했습니다.`)
      onDone(updated)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="text-xs font-medium text-red-400">이용 정지 처리</p>
      <input
        type="text"
        placeholder="정지 사유 (선택)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          title="정지 해제일 (비우면 영구)"
        />
        <span className="flex items-center text-xs text-muted-foreground">해제일</span>
      </div>
      <p className="text-xs text-muted-foreground">해제일 미입력 시 영구 정지</p>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          {loading ? '처리 중...' : '정지 확인'}
        </button>
      </div>
    </form>
  )
}

function UserRow({ user: initial }: { user: User }) {
  const [user, setUser] = useState(initial)
  const [expanded, setExpanded] = useState(false)
  const [showSuspendForm, setShowSuspendForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isSuspended = user.status === 'suspended'

  async function handleActivate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })
      if (!res.ok) { toast.error('처리에 실패했습니다.'); return }
      const updated = await res.json()
      toast.success(`${user.name ?? user.email} 계정을 복구했습니다.`)
      setUser(updated)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleToggle() {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setRole', role: newRole }),
      })
      if (!res.ok) { toast.error('처리에 실패했습니다.'); return }
      const updated = await res.json()
      toast.success(`역할을 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경했습니다.`)
      setUser(updated)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-xl border bg-card px-4 py-4 ${isSuspended ? 'border-red-500/30 bg-red-500/5' : 'border-border'}`}>
      {/* 기본 행 */}
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{user.name ?? '이름 없음'}</p>
            {user.role === 'admin' && (
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">관리자</span>
            )}
            {isSuspended ? (
              <span className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">정지</span>
            ) : (
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">정상</span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={() => { setExpanded((v) => !v); setShowSuspendForm(false) }}
          className="shrink-0 text-muted-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* 펼쳐진 상세 */}
      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">가입일</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">최근 로그인</p>
              <p>{formatDate(user.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">거래 수</p>
              <p>{user._count.trades}건</p>
            </div>
            {isSuspended && (
              <>
                <div>
                  <p className="text-muted-foreground">정지일</p>
                  <p className="text-red-400">{formatDate(user.suspendedAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">해제일</p>
                  <p className="text-red-400">{user.suspendedUntil ? formatDate(user.suspendedUntil) : '영구'}</p>
                </div>
                {user.suspendReason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">정지 사유</p>
                    <p className="text-red-400">{user.suspendReason}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2">
            {isSuspended ? (
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Shield className="h-3.5 w-3.5" />
                정지 해제
              </button>
            ) : (
              <button
                onClick={() => setShowSuspendForm((v) => !v)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                이용 정지
              </button>
            )}
            <button
              onClick={handleRoleToggle}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <UserCog className="h-3.5 w-3.5" />
              {user.role === 'admin' ? '관리자 해제' : '관리자 지정'}
            </button>
          </div>

          {showSuspendForm && (
            <SuspendForm
              user={user}
              onDone={(updated) => {
                setUser(updated)
                setShowSuspendForm(false)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function UserManagement({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.email.includes(search) || (u.name ?? '').includes(search)
    const matchFilter = filter === 'all' || u.status === filter
    return matchSearch && matchFilter
  })

  const suspendedCount = users.filter((u) => u.status === 'suspended').length

  return (
    <div className="space-y-4">
      {/* 필터 + 검색 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />
        <div className="flex gap-1">
          {(['all', 'active', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                filter === f
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? `전체 ${users.length}` : f === 'active' ? `정상 ${users.length - suspendedCount}` : `정지 ${suspendedCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">해당하는 사용자가 없습니다.</p>
        ) : (
          filtered.map((u) => <UserRow key={u.id} user={u} />)
        )}
      </div>
    </div>
  )
}
