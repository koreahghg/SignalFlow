import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from datetime import date as date_type

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import distinct

import models
import schemas
from db import engine, get_db
from deps import require_internal_secret
from routers import stock as stock_router
from routers import volume as volume_router
from routers import backtest as backtest_router
from routers import websocket as ws_router
from routers import notify as notify_router

models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.price_feed import price_feed_task
    task = asyncio.create_task(price_feed_task())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="SignalFlow API", version="0.1.0", lifespan=lifespan)

_origins = ["http://localhost:3000"]
if _frontend_url := os.getenv("FRONTEND_URL"):
    _origins.append(_frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router.router)
app.include_router(volume_router.router)
app.include_router(backtest_router.router)
app.include_router(ws_router.router)
app.include_router(notify_router.router)


@app.get("/api/recommendations/today", response_model=list[schemas.StockRecommendationSchema])
def get_today(db: Session = Depends(get_db)):
    today = date_type.today().isoformat()
    return (
        db.query(models.StockRecommendation)
        .filter(models.StockRecommendation.date == today)
        .order_by(models.StockRecommendation.id)
        .all()
    )


@app.get("/api/recommendations", response_model=list[schemas.StockRecommendationSchema])
def get_by_date(date: str, db: Session = Depends(get_db)):
    return (
        db.query(models.StockRecommendation)
        .filter(models.StockRecommendation.date == date)
        .order_by(models.StockRecommendation.id)
        .all()
    )


@app.get("/api/recommendations/history", response_model=list[schemas.DailyRecommendationSchema])
def get_history(db: Session = Depends(get_db)):
    from collections import defaultdict
    recent_dates_sq = (
        db.query(models.StockRecommendation.date)
        .distinct()
        .order_by(models.StockRecommendation.date.desc())
        .limit(30)
        .subquery()
    )
    stocks = (
        db.query(models.StockRecommendation)
        .filter(models.StockRecommendation.date.in_(db.query(recent_dates_sq)))
        .order_by(models.StockRecommendation.date.desc(), models.StockRecommendation.id)
        .all()
    )
    grouped: dict = defaultdict(list)
    for s in stocks:
        grouped[s.date].append(s)
    return [
        {"date": d, "stocks": grouped[d], "marketCondition": ""}
        for d in sorted(grouped, reverse=True)
    ]


@app.get("/api/stocks/{ticker}", response_model=list[schemas.StockRecommendationSchema])
def get_stock_history(ticker: str, db: Session = Depends(get_db)):
    return (
        db.query(models.StockRecommendation)
        .filter(models.StockRecommendation.ticker == ticker)
        .order_by(models.StockRecommendation.date.desc())
        .all()
    )


@app.get("/api/stocks/{ticker}/candles")
def get_stock_candles(
    ticker: str,
    days: int = Query(default=60, ge=10, le=200),
):
    """종목 일봉 캔들 데이터. FinanceDataReader 기반."""
    try:
        from services.stock_data import get_daily_candles
        candles = get_daily_candles(ticker, days=days)
        return [
            {
                "date": c.date,
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
            }
            for c in candles
        ]
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("캔들 조회 실패: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="데이터 조회 중 오류가 발생했습니다.")


@app.post("/api/recommendations", response_model=schemas.StockRecommendationSchema, status_code=201,
          dependencies=[Depends(require_internal_secret)])
def create_recommendation(body: schemas.StockRecommendationCreate, db: Session = Depends(get_db)):
    rec = models.StockRecommendation(
        id=str(uuid.uuid4()),
        date=body.date,
        ticker=body.ticker,
        name=body.name,
        entry_price=body.entryPrice,
        stop_loss_price=body.stopLossPrice,
        target1_price=body.target1Price,
        target2_price=body.target2Price,
        force_sell_time=body.forceSellTime,
        reason=body.reason,
        theme=body.theme,
        volume_analysis=body.volumeAnalysis,
        news_analysis=body.newsAnalysis,
        risk_level=body.riskLevel,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec
