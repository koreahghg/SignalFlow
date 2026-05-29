// /Users/user/h4.zx7/02_sideProject/SignalFlow/src/components/dashboard/ScoreBreakdown.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ScoreBreakdown, FactorScore } from "@/types/stock"

// ── Grade badge ───────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<
  string,
  { bg: string; text: string; ring: string; label: string }
> = {
  S: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    label: "최상",
  },
  A: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    label: "우수",
  },
  B: {
    bg: "bg-yellow-500/15 dark:bg-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    ring: "ring-yellow-500/30",
    label: "양호",
  },
  C: {
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/30",
    label: "보통",
  },
  D: {
    bg: "bg-red-500/15 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/30",
    label: "미흡",
  },
}

// ── Label badge ───────────────────────────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  우수: "text-emerald-500 dark:text-emerald-400",
  양호: "text-blue-500 dark:text-blue-400",
  보통: "text-yellow-500 dark:text-yellow-400",
  미흡: "text-zinc-400 dark:text-zinc-500",
}

// ── Factor bar colors ─────────────────────────────────────────────────────────

const FACTOR_BAR_COLORS: Record<string, string> = {
  volume: "bg-sky-500",
  news: "bg-violet-500",
  volatility: "bg-amber-500",
  theme: "bg-pink-500",
  supplyDemand: "bg-teal-500",
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FactorRowProps {
  factorKey: string
  label: string
  score: number
  maxScore: number
  detail?: FactorScore
}

// ── FactorRow component ───────────────────────────────────────────────────────

function FactorRow({ factorKey, label, score, maxScore, detail }: FactorRowProps) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const barColor = FACTOR_BAR_COLORS[factorKey] ?? "bg-zinc-500"
  const labelColor =
    detail?.label ? (LABEL_COLORS[detail.label] ?? "text-zinc-400") : "text-zinc-400"

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-foreground shrink-0">{label}</span>
          {detail?.label && (
            <span className={`text-[10px] font-semibold shrink-0 ${labelColor}`}>
              {detail.label}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {score}
          <span className="text-zinc-500 dark:text-zinc-600">/{maxScore}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={maxScore}
        />
      </div>

      {/* Reason */}
      {detail?.reason && (
        <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
          {detail.reason}
        </p>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown
  totalScore: number
  grade: string
  className?: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScoreBreakdown({
  breakdown,
  totalScore,
  grade,
  className,
}: ScoreBreakdownProps) {
  const gradeConfig = GRADE_CONFIG[grade] ?? GRADE_CONFIG["D"]

  const factors: FactorRowProps[] = [
    {
      factorKey: "volume",
      label: "거래량",
      score: breakdown.volume,
      maxScore: 25,
      detail: breakdown.volumeFactor,
    },
    {
      factorKey: "news",
      label: "뉴스",
      score: breakdown.news,
      maxScore: 20,
      detail: breakdown.newsFactor,
    },
    {
      factorKey: "volatility",
      label: "변동성",
      score: breakdown.volatility,
      maxScore: 15,
      detail: breakdown.volatilityFactor,
    },
    {
      factorKey: "theme",
      label: "테마 강도",
      score: breakdown.theme,
      maxScore: 20,
      detail: breakdown.themeFactor,
    },
    {
      factorKey: "supplyDemand",
      label: "수급",
      score: breakdown.supplyDemand,
      maxScore: 20,
      detail: breakdown.supplyDemandFactor,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">AI 추천 점수</CardTitle>

          {/* Grade badge */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ring-1 ${gradeConfig.bg} ${gradeConfig.ring}`}
          >
            <span
              className={`text-lg font-bold leading-none ${gradeConfig.text}`}
            >
              {grade}
            </span>
            <div className="flex flex-col items-start">
              <span className={`text-[10px] font-medium ${gradeConfig.text}`}>
                {gradeConfig.label}
              </span>
              <span className={`text-[10px] font-mono ${gradeConfig.text} opacity-80`}>
                {totalScore}점
              </span>
            </div>
          </div>
        </div>

        {/* Total score bar */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>총점</span>
            <span>{totalScore}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${gradeConfig.text.replace("text-", "bg-").replace("dark:text-", "dark:bg-")}`}
              style={{ width: `${Math.min(totalScore, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-4">
          {factors.map((f) => (
            <FactorRow key={f.factorKey} {...f} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ScoreBreakdown
