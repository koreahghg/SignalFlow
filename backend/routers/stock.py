"""
KIS 주식 데이터 엔드포인트.

GET /api/kis/price/{ticker}         현재가
GET /api/kis/rank/volume            거래량 순위
GET /api/kis/rank/trading-value     거래대금 순위
GET /api/kis/account/balance        계좌 잔고 (KIS_ACCOUNT_NO 필요)
"""
from fastapi import APIRouter, HTTPException, Query

from services import kis_stock

router = APIRouter(prefix="/api/kis", tags=["KIS"])


def _kis_error(e: Exception) -> HTTPException:
    import logging
    logging.getLogger(__name__).error("KIS API 오류: %s", e, exc_info=True)
    msg = str(e)
    status = 503 if "환경변수" in msg or "API 오류" in msg else 502
    detail = msg if "환경변수" in msg else "KIS API 요청 중 오류가 발생했습니다."
    return HTTPException(status_code=status, detail=detail)


@router.get("/price/{ticker}")
def price(ticker: str):
    """종목 현재가 조회. ticker: 6자리 종목코드 (예: 005930)"""
    if not ticker.isdigit() or len(ticker) != 6:
        raise HTTPException(status_code=422, detail="ticker는 6자리 숫자여야 합니다.")
    try:
        return kis_stock.get_current_price(ticker)
    except Exception as e:
        raise _kis_error(e)


@router.get("/rank/volume")
def volume_rank(
    market: str = Query(default="0", pattern="^[012]$"),
    limit: int = Query(default=20, ge=1, le=40),
):
    """거래량 순위. market: 0=전체 1=코스피 2=코스닥"""
    try:
        return kis_stock.get_volume_rank(market=market, limit=limit)
    except Exception as e:
        raise _kis_error(e)


@router.get("/rank/trading-value")
def trading_value_rank(
    market: str = Query(default="0", pattern="^[012]$"),
    limit: int = Query(default=20, ge=1, le=40),
):
    """거래대금 순위. market: 0=전체 1=코스피 2=코스닥"""
    try:
        return kis_stock.get_trading_value_rank(market=market, limit=limit)
    except Exception as e:
        raise _kis_error(e)


@router.get("/account/balance")
def account_balance():
    """계좌 잔고 조회. KIS_ACCOUNT_NO 환경변수 필요."""
    try:
        return kis_stock.get_account_balance()
    except Exception as e:
        raise _kis_error(e)
