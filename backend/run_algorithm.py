"""
일일 추천 알고리즘 실행 스크립트.

사용:
    python run_algorithm.py                 # 오늘 추천
    python run_algorithm.py --date 2024-01-15
    python run_algorithm.py --dry-run       # DB 저장 없이 출력만
    python run_algorithm.py --market ALL    # KOSPI + KOSDAQ
"""
from __future__ import annotations

import argparse
import sys
import os
from datetime import date

# 백엔드 루트를 sys.path에 추가
sys.path.insert(0, os.path.dirname(__file__))

from services.stock_data import get_top_volume_stocks, get_daily_candles, get_recent_news
from algorithm.selector import select_top3


def run(
    target_date: str | None = None,
    market: str = "KOSPI",
    dry_run: bool = False,
) -> list:
    today_iso = target_date or date.today().isoformat()
    pykrx_date = today_iso.replace("-", "")

    print(f"\n[SignalFlow] {today_iso} 추천 선정 시작 (시장: {market})")

    # 1. 거래대금 상위 20개
    print("  1/3 거래대금 상위 조회 중...")
    top_stocks = get_top_volume_stocks(pykrx_date, limit=20, market=market)
    print(f"      {len(top_stocks)}개 조회 완료")

    # 2. 캔들 + 뉴스 수집
    print("  2/3 캔들 데이터 수집 중...")
    candidates = []
    for s in top_stocks:
        candles = get_daily_candles(s["ticker"], days=60, end_date=pykrx_date)
        if len(candles) < 20:
            continue
        news = get_recent_news(s["ticker"])
        news_score = min(len(news) * 3, 15)  # 뉴스 1건당 3점, 최대 15점

        candidates.append({
            "ticker": s["ticker"],
            "name": s["name"],
            "candles": candles,
            "volume_rank": s["volume_rank"],
            "news_score": news_score,
        })
    print(f"      {len(candidates)}개 종목 데이터 완료")

    # 3. 상위 3개 선정
    print("  3/3 패턴 분석 및 점수 계산 중...")
    recs = select_top3(candidates)

    _print_result(today_iso, recs)

    if recs and not dry_run:
        _save_to_db(today_iso, recs)

    return recs


def _print_result(date_iso: str, recs: list) -> None:
    print(f"\n{'='*56}")
    print(f"  {date_iso} 오늘의 추천 종목")
    print(f"{'='*56}")

    if not recs:
        print("  추천 종목 없음 — 패턴 조건 미충족")
        return

    for i, r in enumerate(recs, 1):
        sl_pct = (r.stop_loss_price / r.entry_price - 1) * 100
        t1_pct = (r.target1_price / r.entry_price - 1) * 100
        t2_pct = (r.target2_price / r.entry_price - 1) * 100

        print(f"\n  [{i}] {r.name} ({r.ticker})")
        print(f"      점수:    {r.score}점  패턴: {r.pattern}  위험도: {r.risk_level}")
        print(f"      거래량:  {r.volume_ratio:.1f}배  RSI: {r.rsi:.0f}  MA정배열: {'✓' if r.ma_aligned else '✗'}")
        print(f"      진입가:  {r.entry_price:>9,}원")
        print(f"      손절가:  {r.stop_loss_price:>9,}원  ({sl_pct:+.1f}%)")
        print(f"      1차익절: {r.target1_price:>9,}원  ({t1_pct:+.1f}%)")
        print(f"      2차익절: {r.target2_price:>9,}원  ({t2_pct:+.1f}%)")
        print(f"      강제매도: {r.force_sell_time}")
        print(f"      점수 분해: 거래대금 {r.score_breakdown['volume_amount']} + "
              f"거래량급증 {r.score_breakdown['volume_surge']} + "
              f"기술 {r.score_breakdown['technical']} + "
              f"뉴스 {r.score_breakdown['news']}")


def _save_to_db(date_iso: str, recs: list) -> None:
    """DB에 추천 저장. DB 연결 실패 시 경고만 출력."""
    try:
        import uuid
        from db import SessionLocal
        import models

        db = SessionLocal()
        for r in recs:
            rec = models.StockRecommendation(
                id=str(uuid.uuid4()),
                date=date_iso,
                ticker=r.ticker,
                name=r.name,
                entry_price=r.entry_price,
                stop_loss_price=r.stop_loss_price,
                target1_price=r.target1_price,
                target2_price=r.target2_price,
                force_sell_time=r.force_sell_time,
                reason=f"패턴: {r.pattern}, 점수: {r.score}",
                theme="",
                volume_analysis=f"거래량 {r.volume_ratio:.1f}배",
                news_analysis="",
                risk_level=r.risk_level,
            )
            db.add(rec)
        db.commit()
        db.close()
        print(f"\n  DB 저장 완료 ({len(recs)}건)")
    except Exception as e:
        print(f"\n  [경고] DB 저장 실패: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SignalFlow 일일 추천 알고리즘")
    parser.add_argument("--date", type=str, help="대상 날짜 YYYY-MM-DD (기본: 오늘)")
    parser.add_argument("--market", type=str, default="KOSPI", choices=["KOSPI", "KOSDAQ", "ALL"])
    parser.add_argument("--dry-run", action="store_true", help="DB 저장 없이 출력만")
    args = parser.parse_args()

    run(target_date=args.date, market=args.market, dry_run=args.dry_run)
