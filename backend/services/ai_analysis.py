"""
AI 뉴스 분석 서비스.

지원 프로바이더:
  claude   — Anthropic Claude Haiku (기본값, 저렴)
  openai   — OpenAI GPT-4o-mini (저렴)
  fallback — 키워드 기반 분석 (API 키 없을 때 자동 선택)

비용 절감 전략:
  1. Claude 시스템 프롬프트 캐싱 (cache_control: ephemeral)
     → 반복 호출 시 입력 토큰 ~90% 절감
  2. 배치 처리: 전체 후보 종목을 API 호출 1번으로 분석
  3. 인메모리 캐시: 동일 뉴스 조합은 재분석 없이 캐시 반환
  4. 뉴스 없는 종목은 API 호출 스킵 → 키워드 분석으로 처리
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional


# ── 결과 타입 ──────────────────────────────────────────────────────────────────

@dataclass
class NewsAnalysisResult:
    sentiment: Literal["positive", "negative", "neutral"] = "neutral"
    sentiment_score: float = 0.0           # -1.0(매우부정) ~ 1.0(매우긍정)
    themes: List[str] = field(default_factory=list)  # ["AI", "반도체", ...]
    impact_score: int = 0                  # 0~25, algorithm/scorer에 주입
    reason: str = ""                       # 추천 이유 (한국어 2~3문장)
    news_analysis: str = ""               # 뉴스 분석 요약 (한국어 1~2문장)


# ── 프롬프트 ──────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """당신은 한국 주식 단타 매매 뉴스 분석 전문가입니다.
주어진 종목 정보와 뉴스를 분석하여 단타 매매 관점의 인사이트를 제공합니다.

분석 기준:
- 뉴스의 단기(당일~2일) 주가 영향을 평가합니다
- 거래량 급증을 유발할 수 있는 테마/이슈에 집중합니다
- 기관/외국인 매수 유발 가능성을 고려합니다
- 시장 전체 분위기보다 개별 종목 모멘텀에 초점을 맞춥니다

반드시 JSON 형식으로만 응답하세요. 추가 설명 없이 순수 JSON만 출력하세요."""

_USER_PROMPT_TEMPLATE = """\
다음 종목들의 뉴스를 분석해 주세요:

{stocks_data}

각 종목에 대해 아래 JSON 구조로 응답하세요:
{{
  "results": [
    {{
      "ticker": "종목코드",
      "sentiment": "positive|negative|neutral",
      "sentiment_score": -1.0~1.0 사이 숫자,
      "themes": ["테마1", "테마2"],
      "impact_score": 0~25 사이 정수,
      "reason": "단타 추천 이유 2~3문장 (한국어)",
      "news_analysis": "뉴스 분석 요약 1~2문장 (한국어)"
    }}
  ]
}}

impact_score 기준:
  0~ 5: 뉴스 없음 또는 주가 무관
  6~12: 약한 모멘텀 (일반 공시, 소규모 계약)
 13~18: 중간 모멘텀 (실적 개선, 테마 수혜)
 19~25: 강한 모멘텀 (대형 계약 수주, 정책 직접 수혜, 급등 테마 진입)"""


# ── 인메모리 캐시 ─────────────────────────────────────────────────────────────

_cache: Dict[str, NewsAnalysisResult] = {}


def _news_cache_key(ticker: str, news: List[dict]) -> str:
    titles = sorted(n.get("title", "") for n in news)
    raw = ticker + "|" + "|".join(titles)
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def _get_cached(ticker: str, news: List[dict]) -> Optional[NewsAnalysisResult]:
    return _cache.get(_news_cache_key(ticker, news))


def _set_cached(ticker: str, news: List[dict], result: NewsAnalysisResult) -> None:
    _cache[_news_cache_key(ticker, news)] = result


def clear_cache() -> None:
    _cache.clear()


# ── 키워드 기반 폴백 ──────────────────────────────────────────────────────────

_POSITIVE_KW = [
    "급등", "상승", "매수", "수주", "계약", "특허", "출시", "흑자",
    "신고가", "호재", "성장", "확대", "신기술", "AI", "반도체", "주목",
]
_NEGATIVE_KW = [
    "하락", "급락", "매도", "손실", "취소", "리콜", "적자", "소송",
    "제재", "우려", "위험", "약세", "감소", "철수", "악재",
]
_THEME_MAP: Dict[str, List[str]] = {
    "AI": ["AI", "인공지능", "GPT", "LLM", "딥러닝"],
    "반도체": ["반도체", "HBM", "메모리", "파운드리", "TSMC"],
    "2차전지": ["배터리", "2차전지", "전기차", "EV", "양극재"],
    "바이오": ["바이오", "신약", "임상", "FDA", "허가"],
    "방산": ["방산", "K2", "무기", "군납", "방위"],
    "원전": ["원전", "SMR", "핵", "원자력"],
    "로봇": ["로봇", "자동화", "협동로봇"],
    "게임": ["게임", "메타버스", "IP"],
}


def _fallback_analysis(ticker: str, name: str, news: List[dict]) -> NewsAnalysisResult:
    if not news:
        return NewsAnalysisResult(
            sentiment="neutral",
            sentiment_score=0.0,
            themes=[],
            impact_score=0,
            reason=f"{name}에 관련 뉴스가 없어 기술적 분석 기반으로 추천합니다.",
            news_analysis="관련 뉴스 없음",
        )

    all_text = " ".join(n.get("title", "") for n in news)
    pos = sum(1 for kw in _POSITIVE_KW if kw in all_text)
    neg = sum(1 for kw in _NEGATIVE_KW if kw in all_text)

    if pos > neg:
        sentiment: Literal["positive", "negative", "neutral"] = "positive"
        score = min(pos * 0.2, 1.0)
    elif neg > pos:
        sentiment = "negative"
        score = -min(neg * 0.2, 1.0)
    else:
        sentiment = "neutral"
        score = 0.0

    themes = [
        theme for theme, kws in _THEME_MAP.items()
        if any(kw in all_text for kw in kws)
    ]

    impact = min(len(news) * 2 + pos * 3, 25) if pos >= neg else max(0, len(news) * 1 - neg)

    theme_str = f", 테마: {', '.join(themes)}" if themes else ""
    sentiment_label = {"positive": "긍정", "negative": "부정", "neutral": "중립"}[sentiment]

    return NewsAnalysisResult(
        sentiment=sentiment,
        sentiment_score=round(score, 2),
        themes=themes,
        impact_score=impact,
        reason=f"{name} — {sentiment_label} 뉴스 {len(news)}건 감지{theme_str}.",
        news_analysis=f"뉴스 {len(news)}건 키워드 분석: {sentiment_label}",
    )


# ── JSON 파싱 헬퍼 ────────────────────────────────────────────────────────────

def _parse_ai_response(raw: str) -> List[dict]:
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()
    data = json.loads(cleaned)
    return data.get("results", [])


def _build_stocks_text(stocks: List[dict]) -> str:
    lines: List[str] = []
    for s in stocks:
        news_lines = "\n".join(f"  - {n['title']}" for n in s.get("news", [])[:8])
        lines.append(f"[{s['ticker']}] {s['name']}\n뉴스:\n{news_lines or '  - 없음'}\n")
    return "\n".join(lines)


def _items_to_results(items: List[dict], stocks: List[dict]) -> Dict[str, NewsAnalysisResult]:
    results: Dict[str, NewsAnalysisResult] = {}
    item_map = {item.get("ticker", ""): item for item in items}

    for s in stocks:
        item = item_map.get(s["ticker"])
        if item:
            results[s["ticker"]] = NewsAnalysisResult(
                sentiment=item.get("sentiment", "neutral"),
                sentiment_score=float(item.get("sentiment_score", 0.0)),
                themes=item.get("themes", []),
                impact_score=int(item.get("impact_score", 0)),
                reason=item.get("reason", ""),
                news_analysis=item.get("news_analysis", ""),
            )
        else:
            results[s["ticker"]] = _fallback_analysis(
                s["ticker"], s["name"], s.get("news", [])
            )

    return results


# ── Claude 분석 ───────────────────────────────────────────────────────────────

def _analyze_with_claude(stocks: List[dict]) -> Dict[str, NewsAnalysisResult]:
    import anthropic  # noqa: PLC0415

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    user_prompt = _USER_PROMPT_TEMPLATE.format(stocks_data=_build_stocks_text(stocks))

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=[{
            "type": "text",
            "text": _SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},  # 반복 호출 시 토큰 절감
        }],
        messages=[{"role": "user", "content": user_prompt}],
    )

    items = _parse_ai_response(response.content[0].text)
    return _items_to_results(items, stocks)


# ── OpenAI 분석 ───────────────────────────────────────────────────────────────

def _analyze_with_openai(stocks: List[dict]) -> Dict[str, NewsAnalysisResult]:
    from openai import OpenAI  # noqa: PLC0415

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    user_prompt = _USER_PROMPT_TEMPLATE.format(stocks_data=_build_stocks_text(stocks))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=2048,
    )

    items = _parse_ai_response(response.choices[0].message.content or "")
    return _items_to_results(items, stocks)


# ── Groq 분석 ────────────────────────────────────────────────────────────────

def _analyze_with_groq(stocks: List[dict]) -> Dict[str, NewsAnalysisResult]:
    from groq import Groq  # noqa: PLC0415

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    user_prompt = _USER_PROMPT_TEMPLATE.format(stocks_data=_build_stocks_text(stocks))

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=2048,
        temperature=0.1,
    )

    items = _parse_ai_response(response.choices[0].message.content or "")
    return _items_to_results(items, stocks)


# ── Gemini 분석 ───────────────────────────────────────────────────────────────

def _analyze_with_gemini(stocks: List[dict]) -> Dict[str, NewsAnalysisResult]:
    from google import genai  # noqa: PLC0415
    from google.genai import types  # noqa: PLC0415

    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    user_prompt = _USER_PROMPT_TEMPLATE.format(stocks_data=_build_stocks_text(stocks))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=2048,
        ),
    )

    items = _parse_ai_response(response.text)
    return _items_to_results(items, stocks)


# ── 공개 API ──────────────────────────────────────────────────────────────────

def _auto_detect_provider() -> str:
    if os.environ.get("GROQ_API_KEY"):
        return "groq"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "claude"
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("GOOGLE_API_KEY"):
        return "gemini"
    return "fallback"


def analyze_stocks_news(
    stocks: List[dict],
    provider: str = "auto",
) -> Dict[str, NewsAnalysisResult]:
    """
    여러 종목 뉴스를 배치로 분석한다. API 호출은 1번만 수행.

    Args:
        stocks:   [{ ticker, name, news: [{title, url, published_at}] }]
        provider: "auto" | "claude" | "openai" | "gemini" | "fallback"

    Returns:
        { ticker: NewsAnalysisResult }
    """
    if provider == "auto":
        provider = _auto_detect_provider()

    # 캐시 히트 분리
    results: Dict[str, NewsAnalysisResult] = {}
    uncached: List[dict] = []

    for s in stocks:
        cached = _get_cached(s["ticker"], s.get("news", []))
        if cached is not None:
            results[s["ticker"]] = cached
        else:
            uncached.append(s)

    if not uncached:
        return results

    # 뉴스 없는 종목 → API 호출 없이 폴백 처리
    has_news = [s for s in uncached if s.get("news")]
    no_news = [s for s in uncached if not s.get("news")]

    for s in no_news:
        r = _fallback_analysis(s["ticker"], s["name"], [])
        results[s["ticker"]] = r
        _set_cached(s["ticker"], [], r)

    if not has_news:
        return results

    if provider == "fallback":
        for s in has_news:
            r = _fallback_analysis(s["ticker"], s["name"], s.get("news", []))
            results[s["ticker"]] = r
            _set_cached(s["ticker"], s.get("news", []), r)
        return results

    # AI 분석 (실패 시 폴백)
    try:
        _provider_map = {
            "claude": _analyze_with_claude,
            "openai": _analyze_with_openai,
            "gemini": _analyze_with_gemini,
            "groq": _analyze_with_groq,
        }
        ai_fn = _provider_map.get(provider, _analyze_with_gemini)
        ai_results = ai_fn(has_news)
        for s in has_news:
            r = ai_results.get(s["ticker"]) or _fallback_analysis(
                s["ticker"], s["name"], s.get("news", [])
            )
            results[s["ticker"]] = r
            _set_cached(s["ticker"], s.get("news", []), r)
    except Exception as exc:
        print(f"  [경고] AI 분석 실패 ({provider}): {exc} — 키워드 분석으로 대체")
        for s in has_news:
            r = _fallback_analysis(s["ticker"], s["name"], s.get("news", []))
            results[s["ticker"]] = r
            _set_cached(s["ticker"], s.get("news", []), r)

    return results
