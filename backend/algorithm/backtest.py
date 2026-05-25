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
    exit_price: int
    exit_reason: str    # "target2" | "target1" | "stop_loss" | "force_sell"
    pnl_pct: float      # 수익률 (%)


@dataclass
class PatternStats:
    trades: int = 0
    wins: int = 0
    total_return: float = 0.0

    @property
    def win_rate(self) -> float:
        return round(self.wins / self.trades * 100, 1) if self.trades else 0.0

    @property
    def avg_return(self) -> float:
        return round(self.total_return / self.trades, 2) if self.trades else 0.0


@dataclass
class BacktestSummary:
    total_trades: int
    win_rate: float
    avg_return: float
    total_return: float
    max_drawdown: float
    by_pattern: Dict[str, PatternStats]
    trades: List[TradeResult]


def _simulate_trade(
    entry: int,
    stop: int,
    t1: int,
    t2: int,
    day_high: int,
    day_low: int,
    day_close: int,
) -> Tuple[int, str]:
    """
    당일 고/저 데이터로 체결 시뮬레이션.
    손절 먼저 체크(보수적), 이후 익절 체크.
    분봉 데이터가 없으므로 일봉 고/저 기준으로 판단.
    """
    if day_low <= stop:
        return stop, "stop_loss"
    if day_high >= t2:
        return t2, "target2"
    if day_high >= t1:
        return t1, "target1"
    return day_close, "force_sell"


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
                exit_price=exit_price,
                exit_reason=exit_reason,
                pnl_pct=round(pnl, 2),
            ))

    if not trades:
        return BacktestSummary(0, 0.0, 0.0, 0.0, 0.0, {}, [])

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
        trades=trades,
    )
