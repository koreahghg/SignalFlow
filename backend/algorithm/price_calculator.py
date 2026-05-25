"""
진입가 / 손절가 / 익절가 / 강제매도시간 / 위험도 계산.

기본 비율:
  손절:    진입가 -2.5%  (또는 최근 5일 저점 기반, 더 높은 쪽)
  1차 익절: 진입가 +4%   (돌파 패턴은 +5%)
  2차 익절: 진입가 +7%   (돌파 패턴은 +9%)
"""
from __future__ import annotations

from typing import Tuple

STOP_LOSS_RATIO = 0.025
TARGET1_RATIO = 0.04
TARGET2_RATIO = 0.07
BREAKOUT_TARGET1_RATIO = 0.05
BREAKOUT_TARGET2_RATIO = 0.09


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
    손절가: 비율 기반 vs 지지선 기반 중 더 높은(손실이 적은) 값.
    """
    ratio_based = round_to_tick(int(entry * (1 - STOP_LOSS_RATIO)))
    support_based = round_to_tick(int(support * 0.99))
    return max(ratio_based, support_based)


def calc_targets(entry: int, pattern: str) -> Tuple[int, int]:
    """1차 / 2차 익절가"""
    if pattern == "breakout":
        t1 = int(entry * (1 + BREAKOUT_TARGET1_RATIO))
        t2 = int(entry * (1 + BREAKOUT_TARGET2_RATIO))
    else:
        t1 = int(entry * (1 + TARGET1_RATIO))
        t2 = int(entry * (1 + TARGET2_RATIO))
    return round_to_tick(t1), round_to_tick(t2)


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
