"""
네이버 금융 종목 뉴스 스크래퍼.

네트워크 오류나 파싱 실패 시 빈 리스트 반환 (에러 전파 없음).
"""
from __future__ import annotations

from typing import List

import requests
from bs4 import BeautifulSoup

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": "https://finance.naver.com",
}
_TIMEOUT = 8
_BASE_URL = "https://finance.naver.com"


def fetch_stock_news(ticker: str, limit: int = 10) -> List[dict]:
    """
    네이버 금융에서 종목 관련 최신 뉴스를 가져온다.

    Returns:
        [{ title, url, published_at }]
        published_at 형식: "YYYY.MM.DD HH:mm"
    """
    url = f"{_BASE_URL}/item/news_news.naver?code={ticker}&page=1"
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        resp.encoding = "euc-kr"
        resp.raise_for_status()
    except Exception:
        return []

    try:
        soup = BeautifulSoup(resp.text, "html.parser")
        table = soup.find("table", class_="type5")
        if table is None:
            return []

        result: List[dict] = []
        for tr in table.find_all("tr"):
            title_td = tr.find("td", class_="title")
            date_td = tr.find("td", class_="date")
            if title_td is None or date_td is None:
                continue

            a = title_td.find("a")
            if a is None:
                continue

            title = a.get_text(strip=True)
            if not title:
                continue

            href = a.get("href", "")
            full_url = f"{_BASE_URL}{href}" if href.startswith("/") else href
            published_at = date_td.get_text(strip=True)

            result.append({
                "title": title,
                "url": full_url,
                "published_at": published_at,
            })

            if len(result) >= limit:
                break

        return result
    except Exception:
        return []
