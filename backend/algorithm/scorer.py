"""
종합 추천 점수 계산 (100점 만점).

항목별 배점:
  거래대금 순위   30점  — 상위일수록 고점수
  거래량 급증     30점  — 20일 평균 대비 비율
  기술적 패턴     25점  — 돌파 > 눌림목 > 거래량급증, MA/RSI 보너스
  뉴스/테마       15점  — 외부에서 주입 (AI 분석 결과)
"""
from __future__ import annotations

from dataclasses import dataclass

from .signals import SignalResult


@dataclass
class ScoreResult:
    ticker: str
    name: str
    total_score: int
    volume_amount_score: int   # 거래대금 순위  (max 30)
    volume_surge_score: int    # 거래량 급증    (max 30)
    technical_score: int       # 기술 패턴      (max 25)
    news_score: int            # 뉴스/테마      (max 15)
    # 원본 신호 값 (가격 계산에 필요)
    pattern: str
    volume_ratio: float
    ma_aligned: bool
    rsi: float
    resistance_level: int
    support_level: int


def _score_volume_amount(rank: int) -> int:
    """거래대금 순위 → 점수 (max 30)"""
    if rank <= 3:   return 30
    if rank <= 5:   return 25
    if rank <= 10:  return 19
    if rank <= 20:  return 11
    return 5


def _score_volume_surge(ratio: float) -> int:
    """20일 평균 대비 거래량 배율 → 점수 (max 30)"""
    if ratio >= 5.0: return 30
    if ratio >= 4.0: return 26
    if ratio >= 3.0: return 23
    if ratio >= 2.0: return 18
    if ratio >= 1.5: return 12
    if ratio >= 1.2: return 7
    return 2


def _score_technical(signal: SignalResult) -> int:
    """패턴 + MA 정배열 + RSI 구간 → 점수 (max 25)"""
    base = {
        "breakout": 20,
        "pullback": 17,
        "volume_surge": 12,
        "none": 4,
    }[signal.pattern]

    bonus = 0
    if signal.ma_aligned:
        bonus += 3
    if 35.0 <= signal.rsi <= 65.0:  # 과매수/과매도 아닌 구간
        bonus += 2

    return min(base + bonus, 25)


def calculate_score(signal: SignalResult, news_score: int = 0) -> ScoreResult:
    vol_amt = _score_volume_amount(signal.volume_rank)
    vol_surge = _score_volume_surge(signal.volume_ratio)
    technical = _score_technical(signal)
    news = min(max(news_score, 0), 15)

    return ScoreResult(
        ticker=signal.ticker,
        name=signal.name,
        total_score=vol_amt + vol_surge + technical + news,
        volume_amount_score=vol_amt,
        volume_surge_score=vol_surge,
        technical_score=technical,
        news_score=news,
        pattern=signal.pattern,
        volume_ratio=signal.volume_ratio,
        ma_aligned=signal.ma_aligned,
        rsi=signal.rsi,
        resistance_level=signal.resistance_level,
        support_level=signal.support_level,
    )
