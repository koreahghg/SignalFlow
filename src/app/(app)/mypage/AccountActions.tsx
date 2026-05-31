'use client'

import { useState } from 'react'
import { LogOut, UserX, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  signOutAction: () => Promise<void>
}

export function AccountActions({ signOutAction }: Props) {
  const [modal, setModal] = useState<'logout' | 'withdraw' | null>(null)
  const [withdrawConfirm, setWithdrawConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await signOutAction()
  }

  async function handleWithdraw() {
    if (withdrawConfirm !== '회원탈퇴') return
    setLoading(true)
    const res = await fetch('/api/user', { method: 'DELETE' })
    if (!res.ok) {
      toast.error('탈퇴 처리 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }
    await signOutAction()
  }

  return (
    <>
      {/* 버튼들 */}
      <div className="space-y-3">
        <button
          onClick={() => setModal('logout')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>

        <button
          onClick={() => { setModal('withdraw'); setWithdrawConfirm('') }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-card px-4 py-3.5 text-sm font-medium text-red-500/60 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
        >
          <UserX className="h-4 w-4" />
          회원탈퇴
        </button>
      </div>

      {/* 로그아웃 모달 */}
      {modal === 'logout' && (
        <Modal onClose={() => setModal(null)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold">로그아웃 하시겠어요?</h2>
              <p className="mt-1 text-sm text-muted-foreground">다시 로그인하려면 Google 계정이 필요합니다.</p>
            </div>
            <div className="flex w-full gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? '처리 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 회원탈퇴 모달 */}
      {modal === 'withdraw' && (
        <Modal onClose={() => !loading && setModal(null)}>
          <div className="flex flex-col gap-4">
            {/* 경고 헤더 */}
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
              <p className="text-sm font-semibold text-red-400">이 작업은 되돌릴 수 없습니다</p>
            </div>

            <div>
              <h2 className="text-base font-bold">정말 탈퇴하시겠어요?</h2>
              <ul className="mt-2 space-y-1.5">
                {[
                  '계정 및 모든 개인정보가 즉시 삭제됩니다',
                  '작성한 문의 내역이 모두 삭제됩니다',
                  '삭제된 데이터는 복구할 수 없습니다',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-red-400">✕</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* 확인 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                확인을 위해 아래에 <span className="font-bold text-red-400">회원탈퇴</span> 를 정확히 입력해주세요
              </label>
              <input
                type="text"
                value={withdrawConfirm}
                onChange={(e) => setWithdrawConfirm(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-red-500/50 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawConfirm !== '회원탈퇴' || loading}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-30"
              >
                {loading ? '탈퇴 처리 중...' : '영구 탈퇴'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
