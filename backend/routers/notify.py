from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import require_internal_secret
from services.discord_notifier import send_daily_recommendations

router = APIRouter(prefix="/api/notify", tags=["Notify"])


@router.post("/discord", dependencies=[Depends(require_internal_secret)])
def notify_discord(db: Session = Depends(get_db)):
    """오늘의 추천 종목을 Discord webhook으로 전송."""
    today = date_type.today().isoformat()
    stocks = (
        db.query(models.StockRecommendation)
        .filter(models.StockRecommendation.date == today)
        .order_by(models.StockRecommendation.id)
        .all()
    )
    if not stocks:
        raise HTTPException(status_code=404, detail=f"{today} 추천 종목이 없습니다.")

    try:
        send_daily_recommendations(stocks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord 전송 실패: {e}")

    return {"sent": len(stocks), "date": today}


@router.post("/discord/test", dependencies=[Depends(require_internal_secret)])
def notify_discord_test():
    """Discord 연결 테스트용 메시지 전송."""
    import os
    import httpx

    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="DISCORD_WEBHOOK_URL 환경변수가 설정되지 않았습니다.")

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(webhook_url, json={"content": "✅ SignalFlow Discord 연결 테스트 성공!"})
            resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discord 전송 실패: {e}")

    return {"ok": True}
