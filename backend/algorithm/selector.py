"""
후보 종목에서 상위 3개를 선정하고 최종 Recommendation을 생성.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .signals import Candle, analyze_signals
from .scorer import calculate_score, ScoreResult
from .price_calculator import (
    calc_entry_price,
    calc_stop_loss,
    calc_targets,
    calc_force_sell_time,
    calc_risk_level,
)


@dataclass
class Recommendation:
    ticker: str
    name: str
    score: int
    score_breakdown: Dict[str, int]
    pattern: str
    entry_price: int
    stop_loss_price: int
    target1_price: int
    target2_price: int
    force_sell_time: str
    risk_level: str
    volume_ratio: float
    rsi: float
    ma_aligned: bool


def select_top3(candidates: List[Dict]) -> List[Recommendation]:
    """
    candidates 형식:
      [{ ticker, name, candles: List[Candle], volume_rank: int, news_score: int }]

    패턴이 감지된 종목만 점수를 매기고, 상위 3개를 반환한다.
    """
    scored: List[ScoreResult] = []
    candle_map: Dict[str, List[Candle]] = {}

    for c in candidates:
        candles: List[Candle] = c["candles"]
        if len(candles) < 20:
            continue

        candle_map[c["ticker"]] = candles
        signal = analyze_signals(
            ticker=c["ticker"],
            name=c["name"],
            candles=candles,
            volume_rank=c["volume_rank"],
        )

        if signal.pattern == "none":
            continue

        scored.append(calculate_score(signal, news_score=c.get("news_score", 0)))

    scored.sort(key=lambda x: x.total_score, reverse=True)

    result: List[Recommendation] = []
    for s in scored[:3]:
        candles = candle_map[s.ticker]
        last_close = candles[-1].close

        entry = calc_entry_price(last_close, s.pattern, s.resistance_level)
        stop = calc_stop_loss(entry, s.support_level)
        t1, t2 = calc_targets(entry, s.pattern)
        force_sell = calc_force_sell_time(s.total_score)
        risk = calc_risk_level(s.total_score, s.volume_ratio, s.rsi)

        result.append(Recommendation(
            ticker=s.ticker,
            name=s.name,
            score=s.total_score,
            score_breakdown={
                "volume_amount": s.volume_amount_score,
                "volume_surge": s.volume_surge_score,
                "technical": s.technical_score,
                "news": s.news_score,
            },
            pattern=s.pattern,
            entry_price=entry,
            stop_loss_price=stop,
            target1_price=t1,
            target2_price=t2,
            force_sell_time=force_sell,
            risk_level=risk,
            volume_ratio=s.volume_ratio,
            rsi=s.rsi,
            ma_aligned=s.ma_aligned,
        ))

    return result
