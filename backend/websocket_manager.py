"""WebSocket connection & subscription manager."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # websocket → set of subscribed tickers
        self._connections: dict[WebSocket, set[str]] = {}
        # ticker → set of websockets
        self._subscriptions: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections[ws] = set()
        logger.info("WS connected id=%s total=%d", id(ws), len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            tickers = self._connections.pop(ws, set())
            for ticker in tickers:
                subs = self._subscriptions.get(ticker)
                if subs:
                    subs.discard(ws)
                    if not subs:
                        del self._subscriptions[ticker]
        logger.info("WS disconnected id=%s remaining=%d", id(ws), len(self._connections))

    async def subscribe(self, ws: WebSocket, tickers: list[str]) -> None:
        async with self._lock:
            if ws not in self._connections:
                return
            for ticker in tickers:
                self._connections[ws].add(ticker)
                if ticker not in self._subscriptions:
                    self._subscriptions[ticker] = set()
                self._subscriptions[ticker].add(ws)

    async def unsubscribe(self, ws: WebSocket, tickers: list[str]) -> None:
        async with self._lock:
            if ws not in self._connections:
                return
            for ticker in tickers:
                self._connections[ws].discard(ticker)
                subs = self._subscriptions.get(ticker)
                if subs:
                    subs.discard(ws)
                    if not subs:
                        del self._subscriptions[ticker]

    def get_subscribed_tickers(self) -> set[str]:
        return set(self._subscriptions.keys())

    async def broadcast_to_ticker(self, ticker: str, message: dict[str, Any]) -> None:
        payload = json.dumps(message, ensure_ascii=False)
        async with self._lock:
            ws_set = set(self._subscriptions.get(ticker, set()))
        dead: list[WebSocket] = []
        for ws in ws_set:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    async def send_to(self, ws: WebSocket, message: dict[str, Any]) -> None:
        try:
            await ws.send_text(json.dumps(message, ensure_ascii=False))
        except Exception:
            await self.disconnect(ws)

    @property
    def connection_count(self) -> int:
        return len(self._connections)


manager = ConnectionManager()
