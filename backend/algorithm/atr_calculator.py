"""
ATR(Average True Range) 기반 변동성 계산.

ATR은 단타 손절/익절 기준가를 시장 변동성에 맞게 동적으로 조정하기 위해 사용.
고정 비율 대신 ATR 배수를 쓰면 변동성이 클 때 손절이 넓어지고,
변동성이 작을 때 손절이 좁아져 불필요한 손절을 줄인다.
"""
from __future__ import annotations

import statistics
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from .signals import Candle

# 변동성 분류 임계값 (ATR이 현재가의 몇 %)
_LOW_VOLATILITY_THRESHOLD = 1.5   # ATR% < 1.5% → 저변동성
_HIGH_VOLATILITY_THRESHOLD = 3.5  # ATR% > 3.5% → 고변동성


def calc_true_range(candle, prev_close: float) -> float:
    """True Range = max(High-Low, |High-PrevClose|, |Low-PrevClose|)"""
    return max(
        candle.high - candle.low,
        abs(candle.high - prev_close),
        abs(candle.low - prev_close),
    )


def calc_atr(candles: List, period: int = 14) -> float:
    """
    Wilder's ATR.
    최소 period+1개의 캔들이 필요. 부족하면 단순 고저폭 평균 반환.
    """
    if len(candles) < 2:
        return float(candles[-1].high - candles[-1].low) if candles else 0.0

    trs: List[float] = []
    for i in range(1, len(candles)):
        trs.append(calc_true_range(candles[i], candles[i - 1].close))

    if len(trs) < period:
        return statistics.mean(trs)

    # Wilder smoothing: 초기값은 단순평균, 이후 지수이동평균
    atr = statistics.mean(trs[:period])
    for tr in trs[period:]:
        atr = (atr * (period - 1) + tr) / period
    return round(atr, 2)


def calc_atr_pct(candles: List, period: int = 14) -> float:
    """ATR을 현재 종가 대비 퍼센트로 반환 (변동성 체감지표)."""
    atr = calc_atr(candles, period)
    current_price = candles[-1].close
    if current_price == 0:
        return 0.0
    return round(atr / current_price * 100, 2)


def classify_volatility(atr_pct: float) -> str:
    """
    ATR% 기준 변동성 분류.
    - low:    안정적, 손절 좁게 가능
    - medium: 일반적 단타 환경
    - high:   변동성 과다, 포지션 축소 고려
    """
    if atr_pct < _LOW_VOLATILITY_THRESHOLD:
        return "low"
    if atr_pct > _HIGH_VOLATILITY_THRESHOLD:
        return "high"
    return "medium"


def get_atr_multipliers(volatility: str, pattern: str) -> tuple[float, float, float]:
    """
    변동성과 패턴에 따른 ATR 배수 반환.
    Returns: (stop_mult, target1_mult, target2_mult)

    설계 원칙:
    - 최소 손익비 1:2 유지 (stop_mult:target1_mult >= 1:2)
    - 돌파 패턴은 모멘텀이 강하므로 익절 목표를 높게 설정
    - 고변동성 구간은 손절 폭을 넓히되 익절도 비례해서 높임
    """
    base = {
        "low":    (1.2, 2.5, 4.0),
        "medium": (1.5, 3.0, 5.0),
        "high":   (2.0, 4.0, 6.5),
    }
    stop_m, t1_m, t2_m = base.get(volatility, base["medium"])

    if pattern == "breakout":
        t1_m *= 1.2
        t2_m *= 1.2

    return stop_m, t1_m, t2_m
