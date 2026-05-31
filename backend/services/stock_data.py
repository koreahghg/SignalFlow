"""
주식 데이터 수집 서비스.

기본(무료): FinanceDataReader — pip install finance-datareader
  - 한국거래소 일봉 OHLCV, 종목 목록 + 거래대금
  - 전일 데이터 기준 (실시간 불가)

고급(실시간): KIS Open API — 증권계좌 + 앱키 발급 필요
  - 환경변수: KIS_APP_KEY, KIS_APP_SECRET
"""
from __future__ import annotations

import os
import sys
import warnings
from datetime import date, datetime, timedelta
from typing import List, Optional

warnings.filterwarnings("ignore")

try:
    import FinanceDataReader as fdr
    _FDR = True
except ImportError:
    _FDR = False

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from algorithm.signals import Candle

_CACHE: dict = {}

def _cached(key: str, ttl: int, fn, *args, **kwargs):
    entry = _CACHE.get(key)
    if entry and datetime.now() < entry["expires"]:
        return entry["value"]
    value = fn(*args, **kwargs)
    _CACHE[key] = {"value": value, "expires": datetime.now() + timedelta(seconds=ttl)}
    return value


def _require_fdr() -> None:
    if not _FDR:
        raise RuntimeError("FinanceDataReader 미설치. pip install finance-datareader 실행 후 재시도")


def _last_weekday(d: Optional[date] = None) -> date:
    """주말이면 직전 금요일로 조정."""
    d = d or date.today()
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d


# ── 거래대금 상위 종목 ─────────────────────────────────────────────────────────

def _fetch_top_volume_stocks(target_date, limit, market) -> List[dict]:
    """
    거래대금 상위 종목 조회.

    Args:
        target_date: YYYYMMDD 형식. None이면 최근 거래일.
        limit:       상위 N개.
        market:      "KOSPI" | "KOSDAQ" | "ALL"

    Returns:
        [{ ticker, name, trading_value, volume, volume_rank }]
    """
    _require_fdr()

    if market == "ALL":
        df_k = fdr.StockListing("KOSPI")
        df_q = fdr.StockListing("KOSDAQ")
        import pandas as pd
        df = pd.concat([df_k, df_q], ignore_index=True)
    else:
        df = fdr.StockListing(market)

    # Amount = 거래대금, Volume = 거래량
    df = df.dropna(subset=["Amount", "Volume"])
    df = df[df["Amount"] > 0]
    df = df.nlargest(limit, "Amount")

    result = []
    for rank, (_, row) in enumerate(df.iterrows(), 1):
        result.append({
            "ticker": str(row["Code"]),
            "name": str(row["Name"]),
            "trading_value": int(row["Amount"]),
            "volume": int(row["Volume"]),
            "volume_rank": rank,
        })
    return result


def get_top_volume_stocks(
    target_date: Optional[str] = None,
    limit: int = 20,
    market: str = "KOSPI",
) -> List[dict]:
    key = f"top_volume:{market}:{limit}:{target_date or _last_weekday().isoformat()}"
    return _cached(key, ttl=1800, fn=_fetch_top_volume_stocks,
                   target_date=target_date, limit=limit, market=market)


# ── 일봉 캔들 데이터 ──────────────────────────────────────────────────────────

def _fetch_daily_candles(
    ticker: str,
    days: int = 60,
    end_date: Optional[str] = None,
) -> List[Candle]:
    """
    일봉 OHLCV 조회.

    Args:
        ticker:    6자리 종목코드 (예: "005930")
        days:      최근 N 거래일
        end_date:  YYYYMMDD 기준일. None이면 최근 거래일.

    Returns:
        오래된 순 → 최신 순 Candle 리스트
    """
    _require_fdr()

    if end_date:
        end_dt = date(int(end_date[:4]), int(end_date[4:6]), int(end_date[6:8]))
    else:
        end_dt = _last_weekday()

    # 거래일 기준 days개를 얻기 위해 달력일 여유 확보
    start_dt = end_dt - timedelta(days=int(days * 1.7))

    df = fdr.DataReader(ticker, start_dt.strftime("%Y-%m-%d"), end_dt.strftime("%Y-%m-%d"))
    df = df.tail(days)

    candles = []
    for d, row in df.iterrows():
        close = int(row["Close"])
        volume = int(row["Volume"])
        candles.append(Candle(
            date=d.strftime("%Y-%m-%d"),
            open=int(row["Open"]),
            high=int(row["High"]),
            low=int(row["Low"]),
            close=close,
            volume=volume,
            trading_value=close * volume,  # FDR에 거래대금 없음 → 근사값
        ))
    return candles


def get_daily_candles(
    ticker: str,
    days: int = 60,
    end_date: Optional[str] = None,
) -> List[Candle]:
    key = f"candles:{ticker}:{days}:{end_date or _last_weekday().isoformat()}"
    return _cached(key, ttl=3600, fn=_fetch_daily_candles,
                   ticker=ticker, days=days, end_date=end_date)


# ── 뉴스 조회 ─────────────────────────────────────────────────────────────────

def get_recent_news(ticker: str, limit: int = 5) -> List[dict]:
    """
    종목 관련 최근 뉴스.

    현재: 빈 리스트 반환 (뉴스 API 미연동)
    TODO: 네이버 금융 뉴스 API 또는 BigKinds 연동

    Returns:
        [{ title, summary, published_at, sentiment }]
    """
    return []
