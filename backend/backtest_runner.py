"""
백테스트 실행 스크립트.

사용:
    python backtest_runner.py --start 2024-01-01 --end 2024-06-30
    python backtest_runner.py --start 2024-01-01 --end 2024-06-30 --market KOSDAQ
    python backtest_runner.py --start 2024-01-01 --end 2024-06-30 --csv result.csv
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import date, timedelta
from typing import Dict, List, Optional

sys.path.insert(0, os.path.dirname(__file__))

from services.stock_data import get_top_volume_stocks, get_daily_candles
from algorithm.backtest import run_backtest, BacktestSummary


def build_dataset(
    start_date: str,
    end_date: str,
    market: str = "KOSPI",
) -> Dict[str, List[dict]]:
    """백테스트용 데이터셋 구성. API 호출이 많으므로 시간이 걸린다."""
    dataset: Dict[str, List[dict]] = {}

    current = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    total_days = (end - current).days
    processed = 0

    while current <= end:
        if current.weekday() >= 5:
            current += timedelta(days=1)
            continue

        processed += 1
        pct = processed / max(total_days, 1) * 100
        print(f"\r  데이터 수집: {current.isoformat()} ({pct:.0f}%)...", end="", flush=True)

        pykrx_date = current.strftime("%Y%m%d")

        try:
            top_stocks = get_top_volume_stocks(pykrx_date, limit=20, market=market)
        except Exception:
            current += timedelta(days=1)
            continue

        # 다음 거래일 계산
        next_dt = current + timedelta(days=1)
        while next_dt.weekday() >= 5:
            next_dt += timedelta(days=1)
        next_pykrx = next_dt.strftime("%Y%m%d")

        candidates = []
        for s in top_stocks:
            candles = get_daily_candles(s["ticker"], days=60, end_date=pykrx_date)
            if len(candles) < 21:
                continue

            # 다음 거래일 가격 (시뮬레이션 체결용)
            next_candles = get_daily_candles(s["ticker"], days=5, end_date=next_pykrx)
            next_day_ohlc: Optional[dict] = None
            if next_candles and next_candles[-1].date != candles[-1].date:
                nc = next_candles[-1]
                next_day_ohlc = {
                    "open": nc.open,
                    "high": nc.high,
                    "low": nc.low,
                    "close": nc.close,
                }

            candidates.append({
                "ticker": s["ticker"],
                "name": s["name"],
                "candles": candles,       # 당일 포함 (당일 신호 감지)
                "volume_rank": s["volume_rank"],
                "news_score": 0,
                "next_day_ohlc": next_day_ohlc,
            })

        if candidates:
            dataset[current.isoformat()] = candidates

        current += timedelta(days=1)

    print()
    return dataset


def _print_summary(summary: BacktestSummary) -> None:
    sep = "=" * 56
    print(f"\n{sep}")
    print("  백테스트 결과")
    print(sep)
    print(f"  총 거래 수:   {summary.total_trades:>5d}건")
    print(f"  승률:         {summary.win_rate:>5.1f}%")
    print(f"  평균 수익률:  {summary.avg_return:>+6.2f}%")
    print(f"  누적 수익률:  {summary.total_return:>+6.2f}%")
    print(f"  최대 낙폭:    {summary.max_drawdown:>+6.2f}%")

    print(f"\n  패턴별 성과:")
    for pattern, stats in summary.by_pattern.items():
        print(
            f"    {pattern:<15s}: {stats.trades:3d}건  "
            f"승률 {stats.win_rate:4.0f}%  "
            f"평균 {stats.avg_return:+5.2f}%"
        )

    if summary.trades:
        best = max(summary.trades, key=lambda t: t.pnl_pct)
        worst = min(summary.trades, key=lambda t: t.pnl_pct)
        print(f"\n  최고 수익: {best.name} ({best.date}) {best.pnl_pct:+.2f}%")
        print(f"  최대 손실: {worst.name} ({worst.date}) {worst.pnl_pct:+.2f}%")


def _save_csv(summary: BacktestSummary, path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "ticker", "name", "pattern", "score",
            "entry_price", "stop_loss_price", "target1_price", "target2_price",
            "exit_price", "exit_reason", "pnl_pct",
        ])
        writer.writeheader()
        for t in summary.trades:
            writer.writerow({
                "date": t.date,
                "ticker": t.ticker,
                "name": t.name,
                "pattern": t.pattern,
                "score": t.score,
                "entry_price": t.entry_price,
                "stop_loss_price": t.stop_loss_price,
                "target1_price": t.target1_price,
                "target2_price": t.target2_price,
                "exit_price": t.exit_price,
                "exit_reason": t.exit_reason,
                "pnl_pct": t.pnl_pct,
            })
    print(f"\n  CSV 저장: {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SignalFlow 백테스트")
    parser.add_argument("--start", required=True, help="시작 날짜 YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="종료 날짜 YYYY-MM-DD")
    parser.add_argument("--market", default="KOSPI", choices=["KOSPI", "KOSDAQ", "ALL"])
    parser.add_argument("--csv", type=str, help="결과 CSV 저장 경로")
    args = parser.parse_args()

    print(f"백테스트 기간: {args.start} ~ {args.end}  시장: {args.market}")
    print("데이터 수집 중 (시간이 걸릴 수 있음)...")

    dataset = build_dataset(args.start, args.end, market=args.market)
    print(f"  {len(dataset)}개 거래일 완료")

    print("\n백테스트 실행 중...")
    summary = run_backtest(dataset)

    _print_summary(summary)

    if args.csv:
        _save_csv(summary, args.csv)
