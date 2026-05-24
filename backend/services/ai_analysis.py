import os

# TODO: AI 분석 서비스 — Claude API 또는 OpenAI API


def analyze_stock(
    ticker: str,
    name: str,
    candles: list[dict],
    news: list[dict],
) -> dict:
    """
    종목 분석 결과 반환.
    {
        entryPrice, stopLossPrice, target1Price, target2Price,
        forceSellTime, reason, volumeAnalysis, newsAnalysis, riskLevel
    }
    """
    # Claude API 예시 (연동 후 구현):
    # import anthropic
    # client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    raise NotImplementedError("Claude/OpenAI API 연동 필요")


def generate_daily_recommendations(top_stocks: list[dict]) -> list[dict]:
    """거래대금 상위 종목 중 오늘 추천 3개 선정 + 분석"""
    raise NotImplementedError
