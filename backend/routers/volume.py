"""
거래량 급증 탐지 API.

GET /api/volume/surge            — 거래량 급증 종목 스캔 (상위 N개)
GET /api/volume/surge/{ticker}   — 특정 종목 상세 분석
"""
from __future__ import annotations

import os
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from algorithm.volume_detector import VolumeAlert, build_alert_from_daily, build_alert_from_intraday

router = APIRouter(prefix="/api/volume", tags=["Volume"])

_KIS_ENABLED = bool(os.getenv("KIS_APP_KEY"))


# ── 응답 스키마 ──────────────────────────────────────────────────────────────────

class VolumeAlertResponse(BaseModel):
    ticker: str
    name: str
    alertLevel: str
    surgeScore: float
    volumeRatio: float
    tradingValueRatio: float
    currentVolume: int
    avgVolume: int
    currentTradingValue: int
    avgTradingValue: int
    priceChangeRate: float
    isAbnormal: bool
    abnormalReason: str
    morningSupplyScore: float
    detectedAt: str
    signals: List[str]


def _to_response(alert: VolumeAlert) -> VolumeAlertResponse:
    return VolumeAlertResponse(
        ticker=alert.ticker,
        name=alert.name,
        alertLevel=alert.alert_level,
        surgeScore=alert.surge_score,
        volumeRatio=alert.volume_ratio,
        tradingValueRatio=alert.trading_value_ratio,
        currentVolume=alert.current_volume,
        avgVolume=alert.avg_volume,
        currentTradingValue=alert.current_trading_value,
        avgTradingValue=alert.avg_trading_value,
        priceChangeRate=alert.price_change_rate,
        isAbnormal=alert.is_abnormal,
        abnormalReason=alert.abnormal_reason,
        morningSupplyScore=alert.morning_supply_score,
        detectedAt=alert.detected_at,
        signals=alert.signals,
    )


# ── 데이터 수집 헬퍼 ─────────────────────────────────────────────────────────────

def _fetch_daily_alert(stock: dict[str, Any]) -> Optional[VolumeAlert]:
    """일봉 기반 VolumeAlert 생성. 히스토리 조회 실패 시 None 반환."""
    try:
        from services.stock_data import get_daily_candles
        candles = get_daily_candles(stock["ticker"], days=21)
        if len(candles) < 5:
            return None

        history = candles[:-1]
        today = candles[-1]

        avg_vol = int(statistics.mean(c.volume for c in history))
        avg_tv = int(statistics.mean(c.trading_value for c in history))

        change_rate = (
            (today.close - history[-1].close) / history[-1].close * 100
            if history[-1].close else 0.0
        )

        return build_alert_from_daily(
            ticker=stock["ticker"],
            name=stock["name"],
            current_volume=today.volume,
            current_trading_value=today.trading_value,
            avg_volume=avg_vol,
            avg_trading_value=avg_tv,
            price_change_rate=round(change_rate, 2),
        )
    except Exception:
        return None


def _fetch_kis_alert(stock: dict[str, Any]) -> Optional[VolumeAlert]:
    """KIS 실시간 데이터 기반 VolumeAlert 생성."""
    try:
        from services.kis_stock import get_current_price
        from services.kis_intraday import get_today_all_minute_candles
        from services.stock_data import get_daily_candles

        price_data = get_current_price(stock["ticker"])
        candles = get_daily_candles(stock["ticker"], days=21)
        if len(candles) < 5:
            return None

        history = candles[:-1]
        avg_vol = int(statistics.mean(c.volume for c in history))
        avg_tv = int(statistics.mean(c.trading_value for c in history))

        minute_candles = get_today_all_minute_candles(stock["ticker"])

        return build_alert_from_intraday(
            ticker=stock["ticker"],
            name=stock["name"],
            minute_candles=minute_candles,
            avg_daily_volume=avg_vol,
            avg_daily_trading_value=avg_tv,
            price_change_rate=price_data["change_rate"],
        )
    except Exception:
        return None


def _is_market_open() -> bool:
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    t = now.hour * 100 + now.minute
    return 900 <= t <= 1530


# ── 엔드포인트 ───────────────────────────────────────────────────────────────────

@router.get("/surge", response_model=List[VolumeAlertResponse])
def volume_surge_scan(
    market: str = Query(default="0", pattern="^[012]$"),
    limit: int = Query(default=20, ge=1, le=40),
    min_score: float = Query(default=0.0, ge=0, le=100),
):
    """
    거래량 급증 종목 스캔.

    - KIS 연동 + 장중: 실시간 분봉 기반 분석
    - 그 외: FinanceDataReader 일봉 기반 분석

    Args:
        market:    0=전체 1=코스피 2=코스닥
        limit:     상위 N개 조회
        min_score: 최소 surge_score 필터 (0-100)
    """
    use_kis = _KIS_ENABLED and _is_market_open()

    # 1. 상위 거래량 종목 목록 조회
    if use_kis:
        try:
            from services.kis_stock import get_volume_rank
            stocks = get_volume_rank(market=market, limit=limit)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("KIS API 오류: %s", e, exc_info=True)
            raise HTTPException(status_code=503, detail="거래량 데이터 조회 중 오류가 발생했습니다.")
    else:
        try:
            from services.stock_data import get_top_volume_stocks
            market_map = {"0": "ALL", "1": "KOSPI", "2": "KOSDAQ"}
            stocks = get_top_volume_stocks(limit=limit, market=market_map.get(market, "ALL"))
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("주가 데이터 조회 오류: %s", e, exc_info=True)
            raise HTTPException(status_code=503, detail="거래량 데이터 조회 중 오류가 발생했습니다.")

    if not stocks:
        return []

    # 2. 병렬로 각 종목 분석
    fetch_fn = _fetch_kis_alert if use_kis else _fetch_daily_alert
    alerts: List[VolumeAlert] = []

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(fetch_fn, s): s for s in stocks}
        for future in as_completed(futures):
            result = future.result()
            if result is not None and result.surge_score >= min_score:
                alerts.append(result)

    alerts.sort(key=lambda a: a.surge_score, reverse=True)
    return [_to_response(a) for a in alerts]


@router.get("/surge/{ticker}", response_model=VolumeAlertResponse)
def volume_surge_detail(ticker: str):
    """
    특정 종목 상세 거래량 분석.
    KIS 연동 여부와 무관하게 분봉 분석 시도.
    """
    if not ticker.isdigit() or len(ticker) != 6:
        raise HTTPException(status_code=422, detail="ticker는 6자리 숫자여야 합니다.")

    try:
        from services.stock_data import get_daily_candles
        candles = get_daily_candles(ticker, days=21)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("데이터 조회 오류: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="데이터 조회 중 오류가 발생했습니다.")

    if len(candles) < 5:
        raise HTTPException(status_code=404, detail="데이터 부족")

    history = candles[:-1]
    today = candles[-1]
    avg_vol = int(statistics.mean(c.volume for c in history))
    avg_tv = int(statistics.mean(c.trading_value for c in history))

    if _KIS_ENABLED:
        try:
            from services.kis_stock import get_current_price
            from services.kis_intraday import get_today_all_minute_candles

            price_data = get_current_price(ticker)
            minute_candles = get_today_all_minute_candles(ticker)

            if minute_candles:
                alert = build_alert_from_intraday(
                    ticker=ticker,
                    name=price_data.get("name", ticker),
                    minute_candles=minute_candles,
                    avg_daily_volume=avg_vol,
                    avg_daily_trading_value=avg_tv,
                    price_change_rate=price_data["change_rate"],
                )
                return _to_response(alert)
        except Exception:
            pass

    # KIS 미연동 또는 분봉 실패 시 일봉 기반으로 폴백
    change_rate = (
        (today.close - history[-1].close) / history[-1].close * 100
        if history[-1].close else 0.0
    )
    alert = build_alert_from_daily(
        ticker=ticker,
        name=ticker,
        current_volume=today.volume,
        current_trading_value=today.trading_value,
        avg_volume=avg_vol,
        avg_trading_value=avg_tv,
        price_change_rate=round(change_rate, 2),
    )
    return _to_response(alert)
