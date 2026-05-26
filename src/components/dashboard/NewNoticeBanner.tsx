'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'

const STORAGE_KEY = 'sf_dismissed_notice'

type Props = {
  id: string
  title: string
}

export function NewNoticeBanner({ id, title }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== id) {
      setVisible(true)
    }
  }, [id])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, id)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/8 px-4 py-3">
      <Bell className="h-4 w-4 shrink-0 text-blue-400" />
      <Link
        href="/notice"
        onClick={dismiss}
        className="min-w-0 flex-1"
      >
        <p className="text-xs font-medium text-blue-400">새 공지사항</p>
        <p className="truncate text-sm font-medium">{title}</p>
      </Link>
      <button
        onClick={dismiss}
        aria-label="공지 닫기"
        className="shrink-0 touch-manipulation text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
