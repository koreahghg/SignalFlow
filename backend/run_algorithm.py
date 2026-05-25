"""
일일 추천 알고리즘 실행 스크립트.

사용:
    python run_algorithm.py                    # 오늘 추천 (AI 분석 포함)
    python run_algorithm.py --date 2024-01-15
    python run_algorithm.py --dry-run          # DB 저장 없이 출력만
    python run_algorithm.py --market ALL       # KOSPI + KOSDAQ
    python run_algorithm.py --provider openai  # OpenAI 사용
    python run_algorithm.py --provider fallback  # 키워드 분석만 (API 불필요)
"""
from __future__ import annotations

import argparse
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from services.stock_data import get_top_volume_stocks, get_daily_candles
from services.news_fetcher import fetch_stock_news
from services.ai_analysis import analyze_stocks_news, NewsAnalysisResult
from algorithm.selector import select_top3


def run(
    target_date: str | None = None,
    market: str = "KOSPI",
    dry_run: bool = False,
    provider: str = "auto",
) -> list:
    today_iso = target_date or date.today().isoformat()
    pykrx_date = today_iso.replace("-", "")

    print(f"\n[SignalFlow] {today_iso} 추천 선정 시작 (시장: {market}, AI: {provider})")

    # 1. 거래대금 상위 20개
    print("  1/4 거래대금 상위 조회 중...")
    top_stocks = get_top_volume_stocks(pykrx_date, limit=20, market=market)
    print(f"      {len(top_stocks)}개 조회 완료")

    # 2. 캔들 데이터 수집 + 필터링
    print("  2/4 캔들 데이터 수집 중...")
    valid_stocks: list[dict] = []
    candle_map: dict[str, list] = {}
    for s in top_stocks:
        candles = get_daily_candles(s["ticker"], days=60, end_date=pykrx_date)
        if len(candles) < 20:
            continue
        candle_map[s["ticker"]] = candles
        valid_stocks.append(s)
    print(f"      {len(valid_stocks)}개 유효 종목")

    # 3. 뉴스 수집 + AI 분석 (배치 1회 호출)
    print("  3/4 뉴스 수집 및 AI 분석 중...")
    news_map: dict[str, list] = {}
    for s in valid_stocks:
        news_map[s["ticker"]] = fetch_stock_news(s["ticker"], limit=8)

    ai_input = [
        {"ticker": s["ticker"], "name": s["name"], "news": news_map[s["ticker"]]}
        for s in valid_stocks
    ]
    ai_map: dict[str, NewsAnalysisResult] = analyze_stocks_news(ai_input, provider=provider)
    print(f"      AI 분석 완료 ({sum(1 for r in ai_map.values() if r.impact_score > 0)}개 유의미한 뉴스)")

    # 4. 후보 리스트 구성 + 상위 3개 선정
    print("  4/4 패턴 분석 및 점수 계산 중...")
    candidates = []
    for s in valid_stocks:
        ai = ai_map.get(s["ticker"])
        candidates.append({
            "ticker": s["ticker"],
            "name": s["name"],
            "candles": candle_map[s["ticker"]],
            "volume_rank": s["volume_rank"],
            "news_score": ai.impact_score if ai else 0,
        })

    recs = select_top3(candidates)

    _print_result(today_iso, recs, ai_map)

    if recs and not dry_run:
        _save_to_db(today_iso, recs, ai_map)

    return recs


def _print_result(
    date_iso: str,
    recs: list,
    ai_map: dict[str, NewsAnalysisResult],
) -> None:
    print(f"\n{'='*60}")
    print(f"  {date_iso} 오늘의 추천 종목")
    print(f"{'='*60}")

    if not recs:
        print("  추천 종목 없음 — 패턴 조건 미충족")
        return

    for i, r in enumerate(recs, 1):
        ai = ai_map.get(r.ticker)
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
              f"뉴스AI {r.score_breakdown['news']}")

        if ai:
            sentiment_label = {"positive": "긍정", "negative": "부정", "neutral": "중립"}[ai.sentiment]
            themes_str = ", ".join(ai.themes) if ai.themes else "없음"
            print(f"      뉴스감정: {sentiment_label} ({ai.sentiment_score:+.2f})  테마: {themes_str}")
            if ai.reason:
                print(f"      추천이유: {ai.reason}")


def _save_to_db(
    date_iso: str,
    recs: list,
    ai_map: dict[str, NewsAnalysisResult],
) -> None:
    try:
        import uuid
        from db import SessionLocal
        import models

        db = SessionLocal()
        for r in recs:
            ai = ai_map.get(r.ticker)
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
                reason=ai.reason if ai and ai.reason else f"패턴: {r.pattern}, 점수: {r.score}점",
                theme=", ".join(ai.themes) if ai and ai.themes else "",
                volume_analysis=f"거래량 {r.volume_ratio:.1f}배 (20일 평균 대비)",
                news_analysis=ai.news_analysis if ai and ai.news_analysis else "",
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
    parser.add_argument(
        "--provider",
        type=str,
        default="auto",
        choices=["auto", "claude", "openai", "gemini", "groq", "fallback"],
        help="AI 프로바이더 (기본: auto — API 키 자동 감지)",
    )
    args = parser.parse_args()

    run(
        target_date=args.date,
        market=args.market,
        dry_run=args.dry_run,
        provider=args.provider,
    )
