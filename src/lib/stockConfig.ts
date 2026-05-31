export const riskConfig = {
  low: { label: '저위험', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  medium: { label: '중위험', className: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  high: { label: '고위험', className: 'border-red-500/40 bg-red-500/10 text-red-400' },
} as const

export const rankColors = [
  { dot: 'bg-yellow-400', text: 'text-yellow-400' },
  { dot: 'bg-slate-400', text: 'text-slate-400' },
  { dot: 'bg-amber-600', text: 'text-amber-600' },
]

export const rankTextColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
