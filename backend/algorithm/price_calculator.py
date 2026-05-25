"""
진입가 / 손절가 / 익절가 / 강제매도시간 / 위험도 계산.

손절/익절 산출 방식 (우선순위):
  1. ATR 기반 동적 계산 (변동성 적응형)
  2. 최소 손익비 미충족 시 목표가 상향 조정
  3. 최대 손실 한도 초과 시 손절가 상향 강제

최소 손익비: 1차 1:2.0, 2차 1:3.5
최대 손실 한도: 진입가 -3.5%
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from .atr_calculator import (
    calc_atr,
    calc_atr_pct,
    classify_volatility,
    get_atr_multipliers,
)

# 고정 비율 fallback (ATR 계산 불가 시)
_FALLBACK_STOP_RATIO = 0.025
_FALLBACK_TARGET1_RATIO = 0.04
_FALLBACK_TARGET2_RATIO = 0.07
_FALLBACK_BREAKOUT_T1 = 0.05
_FALLBACK_BREAKOUT_T2 = 0.09

# 손익비 하한선
_MIN_RR1 = 2.0   # 1차 익절 최소 손익비
_MIN_RR2 = 3.5   # 2차 익절 최소 손익비

# 손실 상한선: 진입가 대비 최대 허용 손실
_MAX_STOP_LOSS_RATIO = 0.035


@dataclass
class PriceLevel:
    entry: int
    stop_loss: int
    target1: int
    target2: int
    trailing_stop_offset: int   # 트레일링 스탑 gap (원, ATR × 1.0)
    risk_reward_1: float        # (target1 - entry) / (entry - stop_loss)
    risk_reward_2: float        # (target2 - entry) / (entry - stop_loss)
    atr: float
    atr_pct: float
    volatility: str             # "low" | "medium" | "high"


def round_to_tick(price: int) -> int:
    """KRX 호가단위 적용"""
    if price < 1_000:    return max(price, 1)
    if price < 5_000:    return round(price / 5) * 5
    if price < 10_000:   return round(price / 10) * 10
    if price < 50_000:   return round(price / 50) * 50
    if price < 100_000:  return round(price / 100) * 100
    if price < 500_000:  return round(price / 500) * 500
    return round(price / 1_000) * 1_000


def calc_entry_price(close: int, pattern: str, resistance: int) -> int:
    """
    진입가 산정.
    돌파: 저항선 +0.1% (돌파 확인 후 진입)
    기타: 현재가 +0.1% (시초가 근처 매수 가정)
    """
    base = resistance if pattern == "breakout" else close
    return round_to_tick(int(base * 1.001))


def calc_stop_loss(entry: int, support: int) -> int:
    """
    고정 비율 손절가 (ATR 불가 시 fallback).
    비율 기반 vs 지지선 기반 중 더 높은(손실이 적은) 값.
    """
    ratio_based = round_to_tick(int(entry * (1 - _FALLBACK_STOP_RATIO)))
    support_based = round_to_tick(int(support * 0.99))
    return max(ratio_based, support_based)


def calc_targets(entry: int, pattern: str) -> Tuple[int, int]:
    """고정 비율 익절가 (ATR 불가 시 fallback)."""
    if pattern == "breakout":
        t1 = int(entry * (1 + _FALLBACK_BREAKOUT_T1))
        t2 = int(entry * (1 + _FALLBACK_BREAKOUT_T2))
    else:
        t1 = int(entry * (1 + _FALLBACK_TARGET1_RATIO))
        t2 = int(entry * (1 + _FALLBACK_TARGET2_RATIO))
    return round_to_tick(t1), round_to_tick(t2)


def calc_atr_price_levels(
    candles: List,
    entry: int,
    pattern: str,
    support: int,
    atr_period: int = 14,
) -> PriceLevel:
    """
    ATR 기반 손절/익절/트레일링스탑 계산.

    로직:
    1. ATR 계산 → 변동성 분류
    2. 변동성 + 패턴에 따른 ATR 배수 적용
    3. 지지선 기반 손절가와 비교해 더 높은(안전한) 값 선택
    4. 최대 손실 한도 초과 시 손절가 강제 상향
    5. 최소 손익비 미충족 시 목표가 상향 조정
    """
    atr = calc_atr(candles, atr_period)
    atr_pct = calc_atr_pct(candles, atr_period)
    volatility = classify_volatility(atr_pct)

    stop_mult, t1_mult, t2_mult = get_atr_multipliers(volatility, pattern)

    # 1. ATR 기반 기본 계산
    atr_stop = round_to_tick(int(entry - atr * stop_mult))
    atr_t1 = round_to_tick(int(entry + atr * t1_mult))
    atr_t2 = round_to_tick(int(entry + atr * t2_mult))

    # 2. 지지선 기반 손절가와 비교 (더 높은 쪽 → 손실 최소화)
    support_stop = round_to_tick(int(support * 0.99))
    stop = max(atr_stop, support_stop)

    # 3. 최대 손실 한도 적용 (손절가가 너무 낮으면 강제 상향)
    max_stop = round_to_tick(int(entry * (1 - _MAX_STOP_LOSS_RATIO)))
    stop = max(stop, max_stop)

    # 4. 실제 리스크 기준으로 최소 손익비 충족 여부 확인
    risk = entry - stop
    if risk <= 0:
        risk = max(1, int(entry * 0.01))
        stop = entry - risk

    min_t1 = round_to_tick(int(entry + risk * _MIN_RR1))
    min_t2 = round_to_tick(int(entry + risk * _MIN_RR2))

    t1 = max(atr_t1, min_t1)
    t2 = max(atr_t2, min_t2)

    # t2는 t1보다 반드시 커야 함
    if t2 <= t1:
        t2 = round_to_tick(int(t1 * 1.02))

    # 5. 트레일링 스탑 offset = 1.0x ATR (T1 도달 후 고점 추적)
    trailing_offset = round_to_tick(int(atr * 1.0))

    rr1 = round((t1 - entry) / risk, 2)
    rr2 = round((t2 - entry) / risk, 2)

    return PriceLevel(
        entry=entry,
        stop_loss=stop,
        target1=t1,
        target2=t2,
        trailing_stop_offset=trailing_offset,
        risk_reward_1=rr1,
        risk_reward_2=rr2,
        atr=round(atr, 1),
        atr_pct=atr_pct,
        volatility=volatility,
    )


def calc_force_sell_time(score: int) -> str:
    """
    강제 매도 시간.
    고점수(70+): 오후장까지 홀딩 허용 (13:00)
    일반:       오전장 내 청산 (11:30)
    """
    return "13:00" if score >= 70 else "11:30"


def calc_risk_level(score: int, volume_ratio: float, rsi: float) -> str:
    """위험도 판단"""
    if score >= 70 and volume_ratio >= 2.0 and 35.0 <= rsi <= 70.0:
        return "low"
    if score >= 50:
        return "medium"
    return "high"
