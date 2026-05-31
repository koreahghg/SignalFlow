"""관리자 API 연결 테스트 엔드포인트."""
import logging
import os
import time

from fastapi import APIRouter, Depends

from deps import require_internal_secret

router = APIRouter(prefix="/api/test", tags=["Test"])
logger = logging.getLogger(__name__)


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/ai", dependencies=[Depends(require_internal_secret)])
def test_ai():
    """AI 프로바이더 연결 테스트 (최소 토큰 호출)."""
    from services.ai_analysis import _auto_detect_provider

    provider = _auto_detect_provider()
    if provider == "fallback":
        return {"ok": False, "provider": "fallback", "message": "AI API 키 없음 — fallback 모드", "latency_ms": 0}

    start = time.perf_counter()
    try:
        if provider == "groq":
            from groq import Groq
            client = Groq(api_key=os.environ["GROQ_API_KEY"])
            resp = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "한 단어로 응답: 테스트"}],
                max_tokens=5,
            )
            message = resp.choices[0].message.content or "ok"
        elif provider == "claude":
            import anthropic
            client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
            resp = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=5,
                messages=[{"role": "user", "content": "한 단어로 응답: 테스트"}],
            )
            message = resp.content[0].text if resp.content else "ok"
        else:
            return {"ok": False, "provider": provider, "message": f"{provider} 테스트 미구현", "latency_ms": 0}

        latency = int((time.perf_counter() - start) * 1000)
        return {"ok": True, "provider": provider, "message": message, "latency_ms": latency}
    except Exception as e:
        logger.error("AI 테스트 실패: %s", e, exc_info=True)
        latency = int((time.perf_counter() - start) * 1000)
        return {"ok": False, "provider": provider, "message": "AI 연결 실패", "latency_ms": latency}
