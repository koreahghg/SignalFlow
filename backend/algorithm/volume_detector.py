"""
거래량 급증 탐지 엔진.
순수 함수로 구성 — 분봉/일봉 데이터 모두 처리 가능.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Literal, Optional, Tuple

AlertLevel = Literal["watch", "caution", "alert", "critical"]


@dataclass
class MinuteCandle:
    time: str           # HH:MM
    open: int
    high: int
    low: int
    close: int
    volume: int
    trading_value: int


@dataclass
class VolumeAlert:
    ticker: str
    name: str
    alert_level: AlertLevel
    surge_score: float              # 0-100 종합 점수
    volume_ratio: float             # 오늘 거래량 / 20일 평균
    trading_value_ratio: float      # 오늘 거래대금 / 20일 평균
    current_volume: int
    avg_volume: int
    current_trading_value: int
    avg_trading_value: int
    price_change_rate: float        # 가격 변동률 (%)
    is_abnormal: bool
    abnormal_reason: str
    morning_supply_score: float     # 장초반 수급 점수 0-100
    detected_at: str                # ISO 탐지 시각
    signals: List[str] = field(default_factory=list)


# ── 장 초반 수급 분석 (분봉 기반) ───────────────────────────────────────────────

def analyze_morning_supply(minute_candles: List[MinuteCandle]) -> float:
    """
    장 초반(9:00~9:30) 수급 점수 계산.

    - 장초반 거래량 집중도: 실제 비율 / 기대 비율 (30분 = ~7.7% of 390분)
    - 장초반 양봉 비율: 매수세 우위 여부

    Returns:
        0~100 수급 점수 (높을수록 강한 매수 수급)
    """
    if not minute_candles:
        return 50.0

    morning = [c for c in minute_candles if c.time <= "09:30"]
    total_volume = sum(c.volume for c in minute_candles) or 1
    morning_volume = sum(c.volume for c in morning)

    if not morning:
        return 50.0

    vol_ratio = morning_volume / total_volume
    expected_ratio = 0.077  # 30분 / 390분 (정규 거래 시간)
    concentration = min(vol_ratio / expected_ratio, 3.0) / 3.0

    bullish_ratio = sum(1 for c in morning if c.close >= c.open) / len(morning)

    score = (concentration * 60) + (bullish_ratio * 40)
    return round(score, 1)


# ── 분봉 급등 감지 ──────────────────────────────────────────────────────────────

def detect_intraday_surge(
    minute_candles: List[MinuteCandle],
    lookback: int = 60,
) -> Tuple[bool, float, str]:
    """
    분봉 내 거래량 급등 탐지. 평균 대비 3배 이상 단일 분봉 여부.

    Returns:
        (감지 여부, 최대 배율, 급등 발생 시간 HH:MM)
    """
    if len(minute_candles) < 10:
        return False, 1.0, ""

    window = minute_candles[-lookback:] if len(minute_candles) > lookback else minute_candles
    avg_vol = statistics.mean(c.volume for c in window) or 1

    max_ratio = 0.0
    surge_time = ""
    for c in window:
        ratio = c.volume / avg_vol
        if ratio > max_ratio:
            max_ratio = ratio
            surge_time = c.time

    return max_ratio >= 3.0, round(max_ratio, 2), surge_time


# ── 이상 거래 탐지 ──────────────────────────────────────────────────────────────

def detect_abnormal_trade(
    minute_candles: List[MinuteCandle],
    avg_daily_volume: int,
    price_change_rate: float,
) -> Tuple[bool, str]:
    """
    이상 거래 패턴 3종 탐지:
      대량매집 — 거래량 급증 + 가격 정체 (±1% 이하)
      세력이탈 — 거래량 급증 + 가격 급락 (≤ -3%)
      펌핑     — 거래량 급증 + 단기 급등 후 고점 대비 ≥3% 하락

    Returns:
        (이상 여부, 설명 메시지)
    """
    if not minute_candles or avg_daily_volume <= 0:
        return False, ""

    total_vol = sum(c.volume for c in minute_candles)
    vol_ratio = total_vol / avg_daily_volume

    if vol_ratio < 1.5:
        return False, ""

    if vol_ratio >= 2.0 and abs(price_change_rate) < 1.0:
        return True, f"대량매집 의심 (거래량 {vol_ratio:.1f}배, 가격변동 {price_change_rate:+.1f}%)"

    if vol_ratio >= 3.0 and price_change_rate <= -3.0:
        return True, f"세력이탈 의심 (거래량 {vol_ratio:.1f}배, 급락 {price_change_rate:.1f}%)"

    highs = [c.high for c in minute_candles]
    if highs:
        peak = max(highs)
        current = minute_candles[-1].close
        pullback = (peak - current) / peak * 100 if peak > 0 else 0
        if vol_ratio >= 2.0 and pullback >= 3.0 and price_change_rate >= 3.0:
            return True, f"펌핑 의심 (고점 대비 -{pullback:.1f}% 하락)"

    return False, ""


# ── 종합 점수 계산 ──────────────────────────────────────────────────────────────

def _calc_surge_score(
    volume_ratio: float,
    trading_value_ratio: float,
    morning_supply_score: float,
    price_change_rate: float,
) -> Tuple[float, List[str]]:
    """0-100 종합 급등 점수."""
    signals: List[str] = []
    score = 0.0

    # 거래량 비율 (최대 40점)
    if volume_ratio >= 7.0:
        score += 40
        signals.append(f"거래량 평균 {volume_ratio:.1f}배 (매우 강함)")
    elif volume_ratio >= 4.0:
        score += 30
        signals.append(f"거래량 평균 {volume_ratio:.1f}배 (강함)")
    elif volume_ratio >= 2.5:
        score += 20
        signals.append(f"거래량 평균 {volume_ratio:.1f}배 (보통)")
    elif volume_ratio >= 1.5:
        score += 10
        signals.append(f"거래량 평균 {volume_ratio:.1f}배 (약함)")

    # 거래대금 비율 (최대 30점)
    if trading_value_ratio >= 10.0:
        score += 30
        signals.append(f"거래대금 평균 {trading_value_ratio:.1f}배 (매우 강함)")
    elif trading_value_ratio >= 5.0:
        score += 22
        signals.append(f"거래대금 평균 {trading_value_ratio:.1f}배 (강함)")
    elif trading_value_ratio >= 3.0:
        score += 15
        signals.append(f"거래대금 평균 {trading_value_ratio:.1f}배 (보통)")
    elif trading_value_ratio >= 1.5:
        score += 7
        signals.append(f"거래대금 평균 {trading_value_ratio:.1f}배 (약함)")

    # 장초반 수급 (최대 20점)
    score += morning_supply_score / 100 * 20
    if morning_supply_score >= 70:
        signals.append(f"장초반 수급 강함 ({morning_supply_score:.0f}점)")
    elif morning_supply_score >= 50:
        signals.append(f"장초반 수급 보통 ({morning_supply_score:.0f}점)")

    # 가격 방향 (±10점)
    if 1.0 <= price_change_rate <= 10.0:
        score += 10
        signals.append(f"가격 상승 {price_change_rate:+.1f}%")
    elif price_change_rate > 10.0:
        score += 5
        signals.append(f"가격 급등 {price_change_rate:+.1f}% (고점 주의)")
    elif price_change_rate < -2.0:
        score -= 5
        signals.append(f"가격 하락 {price_change_rate:.1f}% (주의)")

    return round(max(0.0, min(100.0, score)), 1), signals


def _alert_level(score: float) -> AlertLevel:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "alert"
    if score >= 40:
        return "caution"
    return "watch"


# ── 외부 인터페이스 ──────────────────────────────────────────────────────────────

def build_alert_from_daily(
    ticker: str,
    name: str,
    current_volume: int,
    current_trading_value: int,
    avg_volume: int,
    avg_trading_value: int,
    price_change_rate: float,
) -> VolumeAlert:
    """일봉 데이터만으로 VolumeAlert 생성 (KIS 미연동 / 장외 시간용)."""
    vol_ratio = current_volume / avg_volume if avg_volume else 1.0
    tv_ratio = current_trading_value / avg_trading_value if avg_trading_value else 1.0

    # 일봉 기준 간이 이상 탐지
    is_abnormal = vol_ratio >= 2.0 and abs(price_change_rate) < 1.0
    abnormal_reason = (
        f"대량매집 의심 (거래량 {vol_ratio:.1f}배, 가격변동 {price_change_rate:+.1f}%)"
        if is_abnormal else ""
    )

    surge_score, signals = _calc_surge_score(
        volume_ratio=vol_ratio,
        trading_value_ratio=tv_ratio,
        morning_supply_score=50.0,
        price_change_rate=price_change_rate,
    )

    return VolumeAlert(
        ticker=ticker,
        name=name,
        alert_level=_alert_level(surge_score),
        surge_score=surge_score,
        volume_ratio=round(vol_ratio, 2),
        trading_value_ratio=round(tv_ratio, 2),
        current_volume=current_volume,
        avg_volume=avg_volume,
        current_trading_value=current_trading_value,
        avg_trading_value=avg_trading_value,
        price_change_rate=round(price_change_rate, 2),
        is_abnormal=is_abnormal,
        abnormal_reason=abnormal_reason,
        morning_supply_score=50.0,
        detected_at=datetime.now().isoformat(),
        signals=signals,
    )


def build_alert_from_intraday(
    ticker: str,
    name: str,
    minute_candles: List[MinuteCandle],
    avg_daily_volume: int,
    avg_daily_trading_value: int,
    price_change_rate: float,
) -> VolumeAlert:
    """분봉 데이터가 있을 때 VolumeAlert 생성 (KIS 연동 환경용)."""
    current_volume = sum(c.volume for c in minute_candles)
    current_trading_value = sum(c.trading_value for c in minute_candles)

    vol_ratio = current_volume / avg_daily_volume if avg_daily_volume else 1.0
    tv_ratio = current_trading_value / avg_daily_trading_value if avg_daily_trading_value else 1.0

    morning_score = analyze_morning_supply(minute_candles)
    is_abnormal, abnormal_reason = detect_abnormal_trade(
        minute_candles, avg_daily_volume, price_change_rate
    )
    surge_detected, intraday_max_ratio, surge_time = detect_intraday_surge(minute_candles)

    surge_score, signals = _calc_surge_score(
        volume_ratio=vol_ratio,
        trading_value_ratio=tv_ratio,
        morning_supply_score=morning_score,
        price_change_rate=price_change_rate,
    )

    if surge_detected:
        signals.append(f"분봉 급등 {surge_time} (평균 {intraday_max_ratio:.1f}배)")

    return VolumeAlert(
        ticker=ticker,
        name=name,
        alert_level=_alert_level(surge_score),
        surge_score=surge_score,
        volume_ratio=round(vol_ratio, 2),
        trading_value_ratio=round(tv_ratio, 2),
        current_volume=current_volume,
        avg_volume=avg_daily_volume,
        current_trading_value=current_trading_value,
        avg_trading_value=avg_daily_trading_value,
        price_change_rate=round(price_change_rate, 2),
        is_abnormal=is_abnormal,
        abnormal_reason=abnormal_reason,
        morning_supply_score=morning_score,
        detected_at=datetime.now().isoformat(),
        signals=signals,
    )
