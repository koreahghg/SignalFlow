"""
개별 신호 감지 함수들.
순수 함수로 구성 — 백테스트와 라이브 모두 동일한 함수 재사용.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass
from typing import List, Literal, Tuple

PatternType = Literal["breakout", "pullback", "volume_surge", "none"]


@dataclass
class Candle:
    date: str
    open: int
    high: int
    low: int
    close: int
    volume: int
    trading_value: int  # 거래대금 (원)


@dataclass
class SignalResult:
    ticker: str
    name: str
    pattern: PatternType
    volume_rank: int
    volume_ratio: float       # 오늘 거래량 / 20일 평균
    ma_aligned: bool          # MA5 > MA20
    rsi: float
    resistance_level: int     # 돌파/눌림목 기준가
    support_level: int        # 최근 5일 저점


# ── 보조 계산 ──────────────────────────────────────────────────────────────────

def _ma(values: List[float], period: int) -> float:
    if len(values) < period:
        return float(values[-1]) if values else 0.0
    return statistics.mean(values[-period:])


def _rsi(closes: List[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains, losses = [], []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        gains.append(max(delta, 0.0))
        losses.append(max(-delta, 0.0))
    avg_gain = statistics.mean(gains[-period:]) or 1e-9
    avg_loss = statistics.mean(losses[-period:]) or 1e-9
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


# ── 패턴 감지 ─────────────────────────────────────────────────────────────────

def detect_pullback(candles: List[Candle], lookback: int = 5) -> Tuple[bool, int]:
    """
    눌림목 패턴.
    조건: 최근 lookback일 최고가 대비 현재가 3~10% 하락 + 오늘 양봉 반등
    Returns: (감지 여부, 기준 저항가)
    """
    if len(candles) < lookback + 1:
        return False, 0

    recent = candles[-(lookback + 1):-1]
    today = candles[-1]

    peak = max(c.high for c in recent)
    drawdown = (peak - today.close) / peak

    # 양봉 반등: 오늘 종가 > 오늘 시가
    rebound = today.close > today.open

    if 0.03 <= drawdown <= 0.10 and rebound:
        return True, peak
    return False, 0


def detect_breakout(candles: List[Candle], resistance_period: int = 20) -> Tuple[bool, int]:
    """
    돌파 패턴.
    조건: 오늘 종가가 N일 전고점 돌파 + 거래량 평균 대비 1.3배 이상
    Returns: (감지 여부, 돌파 기준가)
    """
    if len(candles) < resistance_period + 1:
        return False, 0

    history = candles[-resistance_period - 1:-1]
    today = candles[-1]

    # 최근 3일 제외한 구간의 고점 = 저항선
    resistance = max(c.high for c in history[:-3])

    if today.close > resistance:
        avg_vol = statistics.mean(c.volume for c in history) or 1
        if today.volume >= avg_vol * 1.3:
            return True, resistance
    return False, 0


def detect_volume_surge(candles: List[Candle], avg_period: int = 20) -> Tuple[bool, float]:
    """
    거래량 급증.
    조건: 오늘 거래량이 N일 평균의 2배 이상
    Returns: (감지 여부, 거래량 비율)
    """
    if len(candles) < avg_period + 1:
        return False, 1.0

    history = candles[-avg_period - 1:-1]
    today = candles[-1]

    avg_vol = statistics.mean(c.volume for c in history) or 1
    ratio = today.volume / avg_vol

    return ratio >= 2.0, round(ratio, 2)


def check_ma_aligned(candles: List[Candle]) -> bool:
    """MA5 > MA20 정배열 확인"""
    closes = [float(c.close) for c in candles]
    if len(closes) < 20:
        return False
    return _ma(closes, 5) > _ma(closes, 20)


def calc_rsi(candles: List[Candle]) -> float:
    closes = [float(c.close) for c in candles]
    return round(_rsi(closes), 1)


# ── 통합 분석 ─────────────────────────────────────────────────────────────────

def analyze_signals(
    ticker: str,
    name: str,
    candles: List[Candle],
    volume_rank: int,
) -> SignalResult:
    """종목의 모든 신호를 분석해 SignalResult 반환."""
    _, volume_ratio_raw = detect_volume_surge(candles)
    surge, volume_ratio = detect_volume_surge(candles)
    pullback, pullback_level = detect_pullback(candles)
    breakout, breakout_level = detect_breakout(candles)
    ma_ok = check_ma_aligned(candles)
    rsi = calc_rsi(candles)

    # 패턴 우선순위: 돌파 > 눌림목 > 거래량급증
    if breakout:
        pattern: PatternType = "breakout"
        resistance = breakout_level
    elif pullback:
        pattern = "pullback"
        resistance = pullback_level
    elif surge:
        pattern = "volume_surge"
        resistance = candles[-1].high
    else:
        pattern = "none"
        resistance = candles[-1].high

    support = min(c.low for c in candles[-5:]) if len(candles) >= 5 else candles[-1].low

    return SignalResult(
        ticker=ticker,
        name=name,
        pattern=pattern,
        volume_rank=volume_rank,
        volume_ratio=volume_ratio,
        ma_aligned=ma_ok,
        rsi=rsi,
        resistance_level=resistance,
        support_level=support,
    )
