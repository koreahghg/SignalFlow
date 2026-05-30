import os
from fastapi import Header, HTTPException

_SECRET = os.getenv("INTERNAL_SECRET", "")


def require_internal_secret(x_internal_secret: str = Header(default="")):
    """POST 엔드포인트 내부 호출 전용 인증. INTERNAL_SECRET 환경변수 설정 시 활성화."""
    if _SECRET and x_internal_secret != _SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
