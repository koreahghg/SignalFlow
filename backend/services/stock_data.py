# TODO: 주식 데이터 수집 서비스
# 옵션 1) KIS (한국투자증권) Open API — 실시간 시세, 거래대금 상위
# 옵션 2) FinanceDataReader — 무료, 일봉 데이터 (pip install finance-datareader)


def get_top_volume_stocks(limit: int = 20) -> list[dict]:
    """거래대금 상위 종목 조회"""
    raise NotImplementedError("KIS API 연동 필요")


def get_daily_candles(ticker: str, days: int = 20) -> list[dict]:
    """일봉 데이터 조회 (날짜, 시가, 고가, 저가, 종가, 거래량)"""
    raise NotImplementedError("KIS API 연동 필요")


def get_recent_news(ticker: str) -> list[dict]:
    """종목 관련 최근 뉴스 조회"""
    raise NotImplementedError("뉴스 API 연동 필요")
