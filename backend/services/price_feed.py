"""Background task: polls KIS API for subscribed tickers and broadcasts price updates."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, time as time_type
from typing import Any

logger = logging.getLogger(__name__)

_MARKET_OPEN = time_type(9, 0)
_MARKET_CLOSE = time_type(15, 35)

POLL_INTERVAL = 5    # seconds during market hours
IDLE_INTERVAL = 30   # seconds outside market hours

# ticker → last known price snapshot
_last_prices: dict[str, dict[str, Any]] = {}


def is_market_open() -> bool:
    now = datetime.now().time()
    return _MARKET_OPEN <= now <= _MARKET_CLOSE


def _price_changed(ticker: str, new_price: int) -> bool:
    """Return True if price moved by ≥10 won OR ≥0.1%."""
    last = _last_prices.get(ticker)
    if last is None:
        return True
    prev = last.get("current_price", 0)
    if prev == 0:
        return True
    abs_diff = abs(new_price - prev)
    return abs_diff >= 10 or (abs_diff / prev * 100) >= 0.1


async def _fetch_price(ticker: str) -> dict[str, Any] | None:
    try:
        from services.kis_stock import get_current_price
        return await asyncio.to_thread(get_current_price, ticker)
    except Exception as exc:
        logger.debug("KIS price fetch failed %s: %s", ticker, exc)
        return None


async def _broadcast_price(ticker: str, data: dict[str, Any]) -> None:
    from websocket_manager import manager

    _last_prices[ticker] = data
    now = datetime.now().strftime("%H:%M:%S")
    await manager.broadcast_to_ticker(ticker, {
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
            "timestamp": now,
        },
    })


def get_cached_price(ticker: str) -> dict[str, Any] | None:
    return _last_prices.get(ticker)


async def price_feed_task() -> None:
    """Infinite loop: batch-fetch prices for all subscribed tickers."""
    from websocket_manager import manager

    logger.info("Price feed task started")
    while True:
        tickers = manager.get_subscribed_tickers()
        if tickers and is_market_open():
            results = await asyncio.gather(
                *[_fetch_price(t) for t in tickers],
                return_exceptions=True,
            )
            for ticker, result in zip(tickers, results):
                if isinstance(result, dict):
                    new_price = result.get("current_price", 0)
                    if _price_changed(ticker, new_price):
                        await _broadcast_price(ticker, result)
            await asyncio.sleep(POLL_INTERVAL)
        else:
            await asyncio.sleep(IDLE_INTERVAL)
