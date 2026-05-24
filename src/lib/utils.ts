import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKRW(price: number): string {
  return price.toLocaleString('ko-KR') + '원'
}

export function formatPercent(current: number, base: number): string {
  const diff = ((current - base) / base) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}%`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}
