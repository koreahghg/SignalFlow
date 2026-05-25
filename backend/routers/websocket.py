"""WebSocket endpoint for real-time stock price streaming."""
from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket_manager import manager
from services.price_feed import get_cached_price

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_price_message(ticker: str, data: dict) -> dict:
    return {
        "type": "price_update",
        "data": {
            "ticker": ticker,
            "name": data.get("name", ""),
            "currentPrice": data.get("current_price", 0),
            "change": data.get("change", 0),
            "changeRate": data.get("change_rate", 0.0),
            "volume": data.get("volume", 0),
            "tradingValue": data.get("trading_value", 0),
            "highPrice": data.get("high_price", 0),
            "lowPrice": data.get("low_price", 0),
            "prevClose": data.get("prev_close", 0),
            "timestamp": datetime.now().strftime("%H:%M:%S"),
        },
    }


@router.websocket("/ws/stocks")
async def ws_stocks(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to(ws, {"type": "error", "message": "invalid JSON"})
                continue

            msg_type = msg.get("type")

            if msg_type == "subscribe":
                tickers = msg.get("tickers", [])
                if not isinstance(tickers, list):
                    await manager.send_to(ws, {"type": "error", "message": "tickers must be list"})
                    continue
                await manager.subscribe(ws, tickers)
                await manager.send_to(ws, {"type": "subscribed", "tickers": tickers})
                # Push cached prices immediately so UI doesn't wait for next poll cycle
                for ticker in tickers:
                    cached = get_cached_price(ticker)
                    if cached:
                        await manager.send_to(ws, _build_price_message(ticker, cached))

            elif msg_type == "unsubscribe":
                tickers = msg.get("tickers", [])
                if isinstance(tickers, list):
                    await manager.unsubscribe(ws, tickers)

            elif msg_type == "ping":
                await manager.send_to(ws, {"type": "pong"})

            else:
                await manager.send_to(ws, {"type": "error", "message": f"unknown type: {msg_type}"})

    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)
