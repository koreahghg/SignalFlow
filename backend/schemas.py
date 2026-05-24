from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


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
