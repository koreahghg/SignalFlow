from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Dict, List


class StockRecommendationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    ticker: str
    name: str
    entryPrice: int = Field(validation_alias="entry_price")
    stopLossPrice: int = Field(validation_alias="stop_loss_price")
    target1Price: int = Field(validation_alias="target1_price")
    target2Price: int = Field(validation_alias="target2_price")
    forceSellTime: str = Field(validation_alias="force_sell_time")
    reason: str
    theme: str
    volumeAnalysis: str = Field(validation_alias="volume_analysis")
    newsAnalysis: str = Field(validation_alias="news_analysis")
    riskLevel: str = Field(validation_alias="risk_level")


class StockRecommendationCreate(BaseModel):
    date: str
    ticker: str
    name: str
    entryPrice: int
    stopLossPrice: int
    target1Price: int
    target2Price: int
    forceSellTime: str
    reason: str
    theme: str
    volumeAnalysis: str
    newsAnalysis: str
    riskLevel: Literal["low", "medium", "high"]


class DailyRecommendationSchema(BaseModel):
    date: str
    stocks: list[StockRecommendationSchema]
    marketCondition: str


# ── 백테스트 ──────────────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    start_date: str   # YYYY-MM-DD
    end_date: str     # YYYY-MM-DD
    market: str = "KOSPI"   # KOSPI | KOSDAQ | ALL


class TradeResultOut(BaseModel):
    date: str
    ticker: str
    name: str
    pattern: str
    score: int
    entry_price: int
    exit_price: int
    exit_reason: str
    pnl_pct: float
    risk_reward_1: float
    atr_pct: float
    volatility: str


class PatternStatsOut(BaseModel):
    trades: int
    wins: int
    win_rate: float
    avg_return: float


class RiskRewardStatsOut(BaseModel):
    avg_rr1: float
    avg_rr2: float
    pct_rr1_above_2: float
    pct_rr2_above_35: float


class EquityPoint(BaseModel):
    date: str
    cum_return: float


class BacktestResponse(BaseModel):
    total_trades: int
    win_rate: float
    avg_return: float
    total_return: float
    max_drawdown: float
    by_pattern: Dict[str, PatternStatsOut]
    rr_stats: RiskRewardStatsOut
    exit_breakdown: Dict[str, int]
    equity_curve: List[EquityPoint]
    trades: List[TradeResultOut]
