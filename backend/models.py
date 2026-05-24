from sqlalchemy import Column, String, Integer, Text, Index
from db import Base


class StockRecommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True)
    date = Column(String, nullable=False)          # YYYY-MM-DD
    ticker = Column(String, nullable=False)
    name = Column(String, nullable=False)
    entry_price = Column(Integer, nullable=False)
    stop_loss_price = Column(Integer, nullable=False)
    target1_price = Column(Integer, nullable=False)
    target2_price = Column(Integer, nullable=False)
    force_sell_time = Column(String, nullable=False)  # HH:mm
    reason = Column(Text, nullable=False)
    theme = Column(String, nullable=False)
    volume_analysis = Column(Text, nullable=False)
    news_analysis = Column(Text, nullable=False)
    risk_level = Column(String, nullable=False)    # low | medium | high

    __table_args__ = (
        Index("ix_recommendations_date", "date"),
        Index("ix_recommendations_ticker", "ticker"),
    )
