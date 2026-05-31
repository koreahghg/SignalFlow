"""
백테스트 API 라우터.

POST /api/backtest/run
  - FinanceDataReader로 과거 데이터 수집 후 백테스트 실행
  - 최대 기간: 30일 (API 호출량 제한)
  - 동기 실행 (FastAPI가 thread pool에서 처리)
"""
from __future__ import annotations

import sys
import os

from datetime import date
from fastapi import APIRouter, HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import schemas
from backtest_runner import build_dataset
from algorithm.backtest import run_backtest

router = APIRouter()

_MAX_DAYS = 30


@router.post("/api/backtest/run", response_model=schemas.BacktestResponse)
def run_backtest_api(req: schemas.BacktestRequest) -> schemas.BacktestResponse:
    try:
        start = date.fromisoformat(req.start_date)
        end = date.fromisoformat(req.end_date)
    except ValueError:
        raise HTTPException(400, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)")

    if start > end:
        raise HTTPException(400, "시작일이 종료일보다 늦습니다")

    if (end - start).days > _MAX_DAYS:
        raise HTTPException(400, f"최대 {_MAX_DAYS}일 기간만 지원합니다")

    if end >= date.today():
        raise HTTPException(400, "종료일은 오늘 이전이어야 합니다")

    if req.market not in ("KOSPI", "KOSDAQ", "ALL"):
        raise HTTPException(400, "market은 KOSPI, KOSDAQ, ALL 중 하나여야 합니다")

    try:
        dataset = build_dataset(req.start_date, req.end_date, req.market)
    except RuntimeError as e:
        import logging
        logging.getLogger(__name__).error("백테스트 데이터셋 빌드 실패: %s", e, exc_info=True)
        raise HTTPException(503, "백테스트 데이터 준비 중 오류가 발생했습니다.")

    summary = run_backtest(dataset)

    # 에쿼티 커브: 거래 순서대로 누적 수익률
    sorted_trades = sorted(summary.trades, key=lambda t: t.date)
    equity_curve: list[schemas.EquityPoint] = []
    cum = 0.0
    for t in sorted_trades:
        cum += t.pnl_pct
        equity_curve.append(schemas.EquityPoint(date=t.date, cum_return=round(cum, 2)))

    by_pattern = {
        k: schemas.PatternStatsOut(
            trades=v.trades,
            wins=v.wins,
            win_rate=v.win_rate,
            avg_return=v.avg_return,
        )
        for k, v in summary.by_pattern.items()
    }

    rr = schemas.RiskRewardStatsOut(
        avg_rr1=summary.rr_stats.avg_rr1,
        avg_rr2=summary.rr_stats.avg_rr2,
        pct_rr1_above_2=summary.rr_stats.pct_rr1_above_2,
        pct_rr2_above_35=summary.rr_stats.pct_rr2_above_35,
    )

    trades_out = [
        schemas.TradeResultOut(
            date=t.date,
            ticker=t.ticker,
            name=t.name,
            pattern=t.pattern,
            score=t.score,
            entry_price=t.entry_price,
            exit_price=t.exit_price,
            exit_reason=t.exit_reason,
            pnl_pct=t.pnl_pct,
            risk_reward_1=t.risk_reward_1,
            atr_pct=t.atr_pct,
            volatility=t.volatility,
        )
        for t in sorted_trades
    ]

    return schemas.BacktestResponse(
        total_trades=summary.total_trades,
        win_rate=summary.win_rate,
        avg_return=summary.avg_return,
        total_return=summary.total_return,
        max_drawdown=summary.max_drawdown,
        by_pattern=by_pattern,
        rr_stats=rr,
        exit_breakdown=summary.exit_breakdown,
        equity_curve=equity_curve,
        trades=trades_out,
    )
