"""
백테스트 엔진.

사용 예시:
    from algorithm.backtest import run_backtest
    summary = run_backtest(candidates_by_date)
    print(summary.win_rate, summary.avg_return)

candidates_by_date 형식:
    {
      "2024-01-15": [
        {
          ticker, name,
          candles: List[Candle],   # 해당 날짜 이전 데이터
          volume_rank: int,
          news_score: int,
          next_day_ohlc: { open, high, low, close }  # 다음 거래일 (시뮬레이션용)
        },
        ...
      ],
      ...
    }

트레일링 스탑 시뮬레이션:
    분봉 데이터 없이 일봉 고/저만 있으므로 보수적 시나리오로 가정:
    - T1 돌파 확인 후 손절선을 진입가(Break-Even)로 이동
    - 이후 당일 저가가 trailing_stop 이하면 trailing_stop 체결
    - T2 돌파면 T2 체결
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .selector import select_top3


@dataclass
class TradeResult:
    date: str
    ticker: str
    name: str
    pattern: str
    score: int
    entry_price: int
    stop_loss_price: int
    target1_price: int
    target2_price: int
    trailing_stop_offset: int
    exit_price: int
    exit_reason: str    # "target2" | "trailing_stop" | "target1" | "stop_loss" | "force_sell"
    pnl_pct: float      # 수익률 (%)
    risk_reward_1: float
    risk_reward_2: float
    atr: float
    atr_pct: float
    volatility: str


@dataclass
class PatternStats:
    trades: int = 0
    wins: int = 0
    total_return: float = 0.0
    avg_rr1: float = 0.0
    _rr1_sum: float = field(default=0.0, repr=False)

    @property
    def win_rate(self) -> float:
        return round(self.wins / self.trades * 100, 1) if self.trades else 0.0

    @property
    def avg_return(self) -> float:
        return round(self.total_return / self.trades, 2) if self.trades else 0.0


@dataclass
class RiskRewardStats:
    avg_rr1: float          # 평균 1차 손익비
    avg_rr2: float          # 평균 2차 손익비
    pct_rr1_above_2: float  # 손익비 1:2 이상 비율 (%)
    pct_rr2_above_35: float # 손익비 1:3.5 이상 비율 (%)


@dataclass
class BacktestSummary:
    total_trades: int
    win_rate: float
    avg_return: float
    total_return: float
    max_drawdown: float
    by_pattern: Dict[str, PatternStats]
    rr_stats: RiskRewardStats
    exit_breakdown: Dict[str, int]   # 청산 사유별 건수
    trades: List[TradeResult]


def _simulate_trade(
    entry: int,
    stop: int,
    t1: int,
    t2: int,
    trailing_offset: int,
    day_high: int,
    day_low: int,
    day_close: int,
) -> Tuple[int, str]:
    """
    당일 고/저 데이터로 체결 시뮬레이션.

    시나리오 (보수적 순서):
    1. 손절 먼저 체크 (하락이 손절 이하)
    2. T1 돌파 여부 확인
       - T1 미달 → 강제 매도 (종가)
       - T1 달성 → Break-Even으로 trailing_stop 이동
         - trailing_stop = max(entry, day_high - trailing_offset)
         - day_low <= trailing_stop → trailing_stop 체결
         - T2 달성 → T2 체결
    """
    if day_low <= stop:
        return stop, "stop_loss"

    if day_high < t1:
        return day_close, "force_sell"

    # T1 달성 — trailing stop을 진입가(break-even) 이상으로 설정
    trailing_stop = max(entry, day_high - trailing_offset)

    if day_high >= t2:
        return t2, "target2"

    # T1 달성, T2 미달 — trailing_stop 체크
    if day_low <= trailing_stop:
        return trailing_stop, "trailing_stop"

    return t1, "target1"


def run_backtest(candidates_by_date: Dict[str, List[Dict]]) -> BacktestSummary:
    trades: List[TradeResult] = []

    for date in sorted(candidates_by_date):
        candidates = candidates_by_date[date]
        recs = select_top3(candidates)

        for rec in recs:
            next_day = next(
                (c["next_day_ohlc"] for c in candidates if c["ticker"] == rec.ticker),
                None,
            )
            if not next_day:
                continue

            exit_price, exit_reason = _simulate_trade(
                entry=rec.entry_price,
                stop=rec.stop_loss_price,
                t1=rec.target1_price,
                t2=rec.target2_price,
                trailing_offset=rec.trailing_stop_offset,
                day_high=next_day["high"],
                day_low=next_day["low"],
                day_close=next_day["close"],
            )
            pnl = (exit_price - rec.entry_price) / rec.entry_price * 100

            trades.append(TradeResult(
                date=date,
                ticker=rec.ticker,
                name=rec.name,
                pattern=rec.pattern,
                score=rec.score,
                entry_price=rec.entry_price,
                stop_loss_price=rec.stop_loss_price,
                target1_price=rec.target1_price,
                target2_price=rec.target2_price,
                trailing_stop_offset=rec.trailing_stop_offset,
                exit_price=exit_price,
                exit_reason=exit_reason,
                pnl_pct=round(pnl, 2),
                risk_reward_1=rec.risk_reward_1,
                risk_reward_2=rec.risk_reward_2,
                atr=rec.atr,
                atr_pct=rec.atr_pct,
                volatility=rec.volatility,
            ))

    if not trades:
        return BacktestSummary(
            0, 0.0, 0.0, 0.0, 0.0, {}, RiskRewardStats(0.0, 0.0, 0.0, 0.0), {}, []
        )

    wins = [t for t in trades if t.pnl_pct > 0]
    returns = [t.pnl_pct for t in trades]

    # 패턴별 통계
    by_pattern: Dict[str, PatternStats] = {}
    for t in trades:
        stats = by_pattern.setdefault(t.pattern, PatternStats())
        stats.trades += 1
        stats.total_return += t.pnl_pct
        if t.pnl_pct > 0:
            stats.wins += 1

    # 청산 사유 분포
    exit_breakdown: Dict[str, int] = {}
    for t in trades:
        exit_breakdown[t.exit_reason] = exit_breakdown.get(t.exit_reason, 0) + 1

    # 손익비 통계
    rr1_values = [t.risk_reward_1 for t in trades]
    rr2_values = [t.risk_reward_2 for t in trades]
    n = len(trades)
    rr_stats = RiskRewardStats(
        avg_rr1=round(sum(rr1_values) / n, 2),
        avg_rr2=round(sum(rr2_values) / n, 2),
        pct_rr1_above_2=round(sum(1 for r in rr1_values if r >= 2.0) / n * 100, 1),
        pct_rr2_above_35=round(sum(1 for r in rr2_values if r >= 3.5) / n * 100, 1),
    )

    # 최대 낙폭 (누적 수익 기준)
    cumulative = peak = 0.0
    max_dd = 0.0
    for r in returns:
        cumulative += r
        peak = max(peak, cumulative)
        max_dd = min(max_dd, cumulative - peak)

    return BacktestSummary(
        total_trades=len(trades),
        win_rate=round(len(wins) / len(trades) * 100, 1),
        avg_return=round(sum(returns) / len(returns), 2),
        total_return=round(sum(returns), 2),
        max_drawdown=round(max_dd, 2),
        by_pattern=by_pattern,
        rr_stats=rr_stats,
        exit_breakdown=exit_breakdown,
        trades=trades,
    )
