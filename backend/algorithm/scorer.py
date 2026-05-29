"""
종합 추천 점수 계산 (100점 만점) — 5요인 모델.

요인별 배점:
  거래량 (Volume)       25점  — 거래대금 순위 + 거래량 급증 배율
  뉴스 (News)          20점  — AI 분석 impact_score 스케일링
  변동성 (Volatility)  15점  — ATR%가 단타 최적 구간(1.5~3.5%)에 있을수록 고점수
  테마 강도 (Theme)    20점  — AI 감지 테마 수 + 핫 테마 보너스
  수급 (Supply/Demand) 20점  — MA 정배열·RSI·패턴·모멘텀 복합 지표
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

from .signals import SignalResult

if TYPE_CHECKING:
    from services.ai_analysis import NewsAnalysisResult

# 핫 테마 목록 (보너스 +2점 기준)
_HOT_THEMES = {"AI", "반도체", "2차전지", "바이오", "방산", "원전", "로봇"}


# ── 보조 함수 ─────────────────────────────────────────────────────────────────

def _label(score: int, max_score: int) -> str:
    """점수 비율로 라벨 반환."""
    if max_score == 0:
        return "미흡"
    ratio = score / max_score
    if ratio >= 0.85:
        return "우수"
    if ratio >= 0.65:
        return "양호"
    if ratio >= 0.40:
        return "보통"
    return "미흡"


def _grade(total: int) -> str:
    """총점 → 등급."""
    if total >= 90:
        return "S"
    if total >= 80:
        return "A"
    if total >= 70:
        return "B"
    if total >= 60:
        return "C"
    return "D"


# ── 데이터클래스 ──────────────────────────────────────────────────────────────

@dataclass
class FactorScore:
    score: int
    max_score: int
    label: str    # "우수" | "양호" | "보통" | "미흡"
    reason: str   # 한국어 1문장


@dataclass
class ScoreResult:
    ticker: str
    name: str
    total_score: int   # 0-100
    grade: str         # "S" | "A" | "B" | "C" | "D"
    volume_factor: FactorScore       # max 25
    news_factor: FactorScore         # max 20
    volatility_factor: FactorScore   # max 15
    theme_factor: FactorScore        # max 20
    supply_demand_factor: FactorScore  # max 20
    # 가격 계산용 (기존 유지)
    pattern: str
    volume_ratio: float
    ma_aligned: bool
    rsi: float
    resistance_level: int
    support_level: int
    atr_pct: float


# ── 1. 거래량 요인 (max 25) ───────────────────────────────────────────────────

def _score_volume(signal: SignalResult) -> FactorScore:
    """거래대금 순위 sub-score(max 15) + 거래량 급증 sub-score(max 10)."""
    rank = signal.volume_rank
    if rank == 1:
        rank_score = 15
    elif rank <= 3:
        rank_score = 13
    elif rank <= 5:
        rank_score = 11
    elif rank <= 10:
        rank_score = 8
    elif rank <= 20:
        rank_score = 4
    else:
        rank_score = 1

    ratio = signal.volume_ratio
    if ratio >= 5.0:
        surge_score = 10
    elif ratio >= 4.0:
        surge_score = 9
    elif ratio >= 3.0:
        surge_score = 7
    elif ratio >= 2.0:
        surge_score = 5
    elif ratio >= 1.5:
        surge_score = 3
    elif ratio >= 1.2:
        surge_score = 2
    else:
        surge_score = 0

    score = rank_score + surge_score
    reason = f"거래대금 순위 {rank}위, 20일 평균 대비 {ratio:.1f}배 거래량"
    return FactorScore(score=score, max_score=25, label=_label(score, 25), reason=reason)


# ── 2. 뉴스 요인 (max 20) ─────────────────────────────────────────────────────

def _score_news(news_analysis: Optional["NewsAnalysisResult"]) -> FactorScore:
    """AI impact_score(0~15) → 0~20점 스케일링."""
    if news_analysis is None:
        return FactorScore(score=0, max_score=20, label="미흡", reason="뉴스 분석 결과 없음")

    raw = max(0, min(int(news_analysis.impact_score), 15))
    score = round(raw * 20 / 15)
    score = min(score, 20)

    detail = news_analysis.news_analysis or "뉴스 분석 결과 없음"
    reason = f"{detail} (뉴스 영향도 {raw}/15)"
    return FactorScore(score=score, max_score=20, label=_label(score, 20), reason=reason)


# ── 3. 변동성 요인 (max 15) ───────────────────────────────────────────────────

def _score_volatility(atr_pct: float) -> FactorScore:
    """ATR%가 단타 최적 구간(1.5~3.5%)에 가까울수록 높은 점수."""
    if atr_pct < 0.8:
        score = 3
        fit = "너무 낮음 — 움직임 없어 단타 불리"
        cls = "과소변동"
    elif atr_pct < 1.5:
        score = 8
        fit = "낮음 — 손절 좁지만 수익 제한"
        cls = "저변동"
    elif atr_pct < 2.5:
        score = 15
        fit = "최적 — 충분한 움직임, 통제 가능"
        cls = "최적"
    elif atr_pct < 3.5:
        score = 12
        fit = "양호 — 변동 크지만 단타 가능"
        cls = "중고변동"
    elif atr_pct < 5.0:
        score = 7
        fit = "높음 — 리스크 증가, 포지션 축소"
        cls = "고변동"
    else:
        score = 3
        fit = "과도 — 단타 비추"
        cls = "과도변동"

    reason = f"ATR {atr_pct:.2f}% ({cls}), {fit}"
    return FactorScore(score=score, max_score=15, label=_label(score, 15), reason=reason)


# ── 4. 테마 강도 요인 (max 20) ────────────────────────────────────────────────

def _theme_score_from_list(themes: list[str]) -> int:
    """themes 목록 → 0~20 점수 (보너스 포함, cap 20)."""
    n = len(themes)
    if n == 0:
        base = 2
    elif n == 1:
        base = 8
    elif n == 2:
        base = 14
    else:
        base = 18

    bonus = 2 if any(t in _HOT_THEMES for t in themes) else 0
    return min(base + bonus, 20)


def _score_theme(news_analysis: Optional["NewsAnalysisResult"]) -> FactorScore:
    """AI 감지 테마 수 + 핫 테마 보너스 → 0~20점."""
    if news_analysis is None:
        themes: list[str] = []
    else:
        themes = list(news_analysis.themes or [])

    score = _theme_score_from_list(themes)

    if not themes:
        reason = "감지된 테마 없음, 테마 모멘텀 부재"
    else:
        hot = [t for t in themes if t in _HOT_THEMES]
        theme_str = ", ".join(themes)
        hot_str = f" (핫 테마 포함: {', '.join(hot)})" if hot else ""
        reason = f"감지 테마: {theme_str}{hot_str}"

    return FactorScore(score=score, max_score=20, label=_label(score, 20), reason=reason)


# ── 5. 수급 요인 (max 20) ─────────────────────────────────────────────────────

def _score_supply_demand(signal: SignalResult) -> FactorScore:
    """MA 정배열 + RSI 구간 + 패턴 수급 + 가격 모멘텀 → 0~20점."""
    pts = 0
    parts: list[str] = []

    # MA 정배열
    if signal.ma_aligned:
        pts += 6
        parts.append("MA 정배열(+6)")
    else:
        parts.append("MA 역배열")

    # RSI 구간
    rsi = signal.rsi
    if 40.0 <= rsi <= 60.0:
        pts += 5
        parts.append(f"RSI {rsi:.0f} 중립건강(+5)")
    elif 30.0 <= rsi < 40.0 or 60.0 < rsi <= 70.0:
        pts += 3
        parts.append(f"RSI {rsi:.0f} 관심구간(+3)")
    elif 20.0 <= rsi < 30.0 or 70.0 < rsi <= 80.0:
        pts += 1
        parts.append(f"RSI {rsi:.0f} 경계구간(+1)")
    else:
        parts.append(f"RSI {rsi:.0f} 극단구간")

    # 패턴 수급 신호
    pattern_bonus = {
        "breakout": (5, "돌파 강매수(+5)"),
        "pullback": (3, "눌림 저가매수(+3)"),
        "volume_surge": (2, "거래량급증 진입(+2)"),
        "none": (0, "패턴 없음"),
    }
    p_pts, p_desc = pattern_bonus.get(signal.pattern, (0, "패턴 없음"))
    pts += p_pts
    parts.append(p_desc)

    # 가격 모멘텀
    if signal.volume_ratio >= 3.0 and signal.pattern != "none":
        pts += 4
        parts.append("강력 모멘텀(+4)")
    elif signal.volume_ratio >= 2.0:
        pts += 2
        parts.append("모멘텀(+2)")

    score = min(pts, 20)
    reason = ", ".join(parts)
    return FactorScore(score=score, max_score=20, label=_label(score, 20), reason=reason)


# ── 통합 계산 함수 ────────────────────────────────────────────────────────────

def calculate_score(
    signal: SignalResult,
    news_analysis: Optional["NewsAnalysisResult"] = None,
    atr_pct: float = 2.0,
) -> ScoreResult:
    """
    5요인 종합 점수 계산.

    Args:
        signal:        신호 분석 결과 (SignalResult)
        news_analysis: AI 뉴스 분석 결과 (없으면 None)
        atr_pct:       calc_atr_pct()로 계산한 ATR% 값

    Returns:
        ScoreResult (total_score 0~100, grade S/A/B/C/D)
    """
    volume_f = _score_volume(signal)
    news_f = _score_news(news_analysis)
    volatility_f = _score_volatility(atr_pct)
    theme_f = _score_theme(news_analysis)
    supply_f = _score_supply_demand(signal)

    total = (
        volume_f.score
        + news_f.score
        + volatility_f.score
        + theme_f.score
        + supply_f.score
    )

    return ScoreResult(
        ticker=signal.ticker,
        name=signal.name,
        total_score=total,
        grade=_grade(total),
        volume_factor=volume_f,
        news_factor=news_f,
        volatility_factor=volatility_f,
        theme_factor=theme_f,
        supply_demand_factor=supply_f,
        pattern=signal.pattern,
        volume_ratio=signal.volume_ratio,
        ma_aligned=signal.ma_aligned,
        rsi=signal.rsi,
        resistance_level=signal.resistance_level,
        support_level=signal.support_level,
        atr_pct=atr_pct,
    )
