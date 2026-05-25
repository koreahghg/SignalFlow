import os
from datetime import date

import httpx

RISK_COLORS = {
    "low": 0x2ECC71,     # 초록
    "medium": 0xF39C12,  # 주황
    "high": 0xE74C3C,    # 빨강
}

RISK_LABELS = {
    "low": "낮음 🟢",
    "medium": "중간 🟡",
    "high": "높음 🔴",
}


def _build_embed(stock) -> dict:
    color = RISK_COLORS.get(stock.risk_level, 0x95A5A6)
    stop_loss_pct = round(
        (stock.entry_price - stock.stop_loss_price) / stock.entry_price * 100, 1
    )
    target1_pct = round(
        (stock.target1_price - stock.entry_price) / stock.entry_price * 100, 1
    )
    target2_pct = round(
        (stock.target2_price - stock.entry_price) / stock.entry_price * 100, 1
    )

    return {
        "title": f"📈 {stock.name} ({stock.ticker})",
        "description": stock.reason,
        "color": color,
        "fields": [
            {"name": "🎯 진입가", "value": f"**{stock.entry_price:,}원**", "inline": True},
            {"name": "🛑 손절가", "value": f"{stock.stop_loss_price:,}원  (-{stop_loss_pct}%)", "inline": True},
            {"name": "⏰ 강제매도", "value": stock.force_sell_time, "inline": True},
            {"name": "✅ 1차 익절", "value": f"{stock.target1_price:,}원  (+{target1_pct}%)", "inline": True},
            {"name": "🚀 2차 익절", "value": f"{stock.target2_price:,}원  (+{target2_pct}%)", "inline": True},
            {"name": "⚠️ 위험도", "value": RISK_LABELS.get(stock.risk_level, stock.risk_level), "inline": True},
            {"name": "🏷️ 테마", "value": stock.theme, "inline": False},
            {"name": "📰 뉴스 요약", "value": stock.news_analysis[:300] or "—", "inline": False},
            {"name": "📊 거래량 분석", "value": stock.volume_analysis[:300] or "—", "inline": False},
        ],
    }


def send_daily_recommendations(stocks: list) -> None:
    """오늘의 추천 종목 리스트를 Discord webhook으로 전송."""
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        raise ValueError("DISCORD_WEBHOOK_URL 환경변수가 설정되지 않았습니다.")
    if not stocks:
        raise ValueError("전송할 추천 종목이 없습니다.")

    today = date.today().strftime("%Y년 %m월 %d일")

    header_payload = {
        "content": f"## 📋 SignalFlow 오늘의 추천 종목  |  {today}",
        "embeds": [],
    }

    stock_payloads = [
        {"embeds": [_build_embed(s)]}
        for s in stocks
    ]

    footer_payload = {
        "content": (
            "> ⚠️ **투자 주의**: 본 추천은 알고리즘 기반 참고용이며 투자 손익은 본인 책임입니다."
        ),
        "embeds": [],
    }

    with httpx.Client(timeout=10) as client:
        for payload in [header_payload, *stock_payloads, footer_payload]:
            resp = client.post(webhook_url, json=payload)
            resp.raise_for_status()
