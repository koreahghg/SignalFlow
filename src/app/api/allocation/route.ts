import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

type StockInput = {
  ticker: string
  name: string
  entryPrice: number
  riskLevel: 'low' | 'medium' | 'high'
  theme: string
}

type AllocationItem = {
  ticker: string
  name: string
  weight_pct: number
  shares: number
  invested_amount: number
  reasoning: string
}

export type AllocationResult = {
  strategy: string
  allocations: AllocationItem[]
  total_invested: number
  cash_remaining: number
}

const SYSTEM_PROMPT = `당신은 한국 주식 단타 매매 자금 배분 전문가입니다.
주어진 종목들의 위험도와 테마를 고려하여 단타 매매에 최적화된 자금 배분 비중을 결정합니다.
반드시 JSON 형식으로만 응답하세요.`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  let totalAmount: number, stocks: StockInput[]
  try {
    ;({ totalAmount, stocks } = (await req.json()) as { totalAmount: number; stocks: StockInput[] })
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (!totalAmount || totalAmount < 10000) {
    return NextResponse.json({ error: '최소 10,000원 이상 입력해주세요.' }, { status: 400 })
  }

  if (!Array.isArray(stocks) || stocks.length > 10) {
    return NextResponse.json({ error: '종목은 최대 10개까지 가능합니다.' }, { status: 400 })
  }

  const riskLabel = { low: '저위험', medium: '중위험', high: '고위험' }
  const stocksText = stocks
    .map(
      (s, i) =>
        `${i + 1}. ${s.name} (${s.ticker}) — 위험도: ${riskLabel[s.riskLevel]}, 테마: ${s.theme}, 진입가: ${s.entryPrice.toLocaleString()}원`,
    )
    .join('\n')

  const userPrompt = `투자 가능 금액: ${totalAmount.toLocaleString()}원

오늘 추천 종목:
${stocksText}

각 종목에 대한 투자 비중(%)을 결정해주세요. 비중 합계는 반드시 100이어야 합니다.

아래 JSON 형식으로만 응답하세요:
{
  "strategy": "전체 배분 전략 설명 (2~3문장, 한국어)",
  "allocations": [
    {
      "ticker": "종목코드",
      "weight_pct": 정수,
      "reasoning": "이 비중을 배분한 이유 (1문장, 한국어)"
    }
  ]
}

배분 기준:
- 저위험 종목 → 40~50% 비중 권장
- 중위험 종목 → 30~40% 비중 권장
- 고위험 종목 → 20~30% 비중 권장
- 진입가가 높을수록 소수 매수 가능성 고려
- 단타 특성상 너무 분산하지 않아야 함`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!groqRes.ok) {
    return NextResponse.json({ error: 'AI 분석 요청 실패' }, { status: 502 })
  }

  const groqData = await groqRes.json()
  const raw = groqData.choices?.[0]?.message?.content ?? '{}'

  let parsed: { strategy: string; allocations: { ticker: string; weight_pct: number; reasoning: string }[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 502 })
  }

  // 비중 합계 보정 (AI가 100이 안 될 수 있음)
  const totalWeight = parsed.allocations.reduce((s, a) => s + a.weight_pct, 0)
  if (totalWeight !== 100) {
    const diff = 100 - totalWeight
    parsed.allocations[0].weight_pct += diff
  }

  // 주수 및 금액은 수학적으로 정확하게 계산
  const stockMap = Object.fromEntries(stocks.map((s) => [s.ticker, s]))
  const allocations: AllocationItem[] = parsed.allocations.map((a) => {
    const stock = stockMap[a.ticker]
    const budget = Math.floor(totalAmount * (a.weight_pct / 100))
    const shares = stock ? Math.floor(budget / stock.entryPrice) : 0
    const invested = stock ? shares * stock.entryPrice : 0
    return {
      ticker: a.ticker,
      name: stock?.name ?? a.ticker,
      weight_pct: a.weight_pct,
      shares,
      invested_amount: invested,
      reasoning: a.reasoning,
    }
  })

  const total_invested = allocations.reduce((s, a) => s + a.invested_amount, 0)

  const result: AllocationResult = {
    strategy: parsed.strategy,
    allocations,
    total_invested,
    cash_remaining: totalAmount - total_invested,
  }

  return NextResponse.json(result)
}
