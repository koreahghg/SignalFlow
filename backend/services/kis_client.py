"""
한국투자증권 Open API HTTP 클라이언트.

토큰 생명주기:
  - 최초 요청 시 발급 (POST /oauth2/tokenP)
  - 파일 캐시(.kis_token_cache.json)에 저장 → 재시작 후 재사용
  - 만료 1시간 전 자동 재발급
  - Thread-safe: threading.Lock

환경변수 (backend/.env):
  KIS_APP_KEY       앱 키 (필수)
  KIS_APP_SECRET    앱 시크릿 (필수)
  KIS_IS_VIRTUAL    모의투자 여부 — "true" | "false" (기본: true)
"""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests

# ── 기본 설정 ────────────────────────────────────────────────────────────────

_IS_VIRTUAL = os.getenv("KIS_IS_VIRTUAL", "true").lower() != "false"

BASE_URL = (
    "https://openapivts.koreainvestment.com:29443"
    if _IS_VIRTUAL
    else "https://openapi.koreainvestment.com:9443"
)

_TOKEN_CACHE_FILE = Path(__file__).parent.parent / ".kis_token_cache.json"

# ── 토큰 캐시 ────────────────────────────────────────────────────────────────

_lock = threading.Lock()

_token_cache: dict[str, Any] = {
    "access_token": None,
    "expires_at": None,   # datetime
}


def _load_token_from_file() -> None:
    if not _TOKEN_CACHE_FILE.exists():
        return
    try:
        data = json.loads(_TOKEN_CACHE_FILE.read_text())
        expires_at = datetime.fromisoformat(data["expires_at"])
        if expires_at > datetime.now() + timedelta(hours=1):
            _token_cache["access_token"] = data["access_token"]
            _token_cache["expires_at"] = expires_at
    except Exception:
        pass


def _save_token_to_file(token: str, expires_at: datetime) -> None:
    try:
        _TOKEN_CACHE_FILE.write_text(
            json.dumps({"access_token": token, "expires_at": expires_at.isoformat()})
        )
    except Exception:
        pass


def _issue_token() -> str:
    app_key = os.getenv("KIS_APP_KEY", "")
    app_secret = os.getenv("KIS_APP_SECRET", "")
    if not app_key or not app_secret:
        raise RuntimeError(
            "KIS_APP_KEY / KIS_APP_SECRET 환경변수가 설정되지 않았습니다. "
            "backend/.env 파일을 확인하세요."
        )

    resp = requests.post(
        f"{BASE_URL}/oauth2/tokenP",
        json={
            "grant_type": "client_credentials",
            "appkey": app_key,
            "appsecret": app_secret,
        },
        timeout=10,
    )
    resp.raise_for_status()
    body = resp.json()

    token: str = body["access_token"]
    # KIS는 token_expired 필드로 만료 시각 반환 ("YYYY-MM-DD HH:MM:SS")
    raw_exp: str = body.get("access_token_token_expired", "")
    try:
        expires_at = datetime.strptime(raw_exp, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        expires_at = datetime.now() + timedelta(hours=24)

    _token_cache["access_token"] = token
    _token_cache["expires_at"] = expires_at
    _save_token_to_file(token, expires_at)
    return token


def get_token() -> str:
    with _lock:
        if _token_cache["access_token"] is None:
            _load_token_from_file()

        if (
            _token_cache["access_token"] is None
            or _token_cache["expires_at"] <= datetime.now() + timedelta(hours=1)
        ):
            return _issue_token()

        return _token_cache["access_token"]


# ── 공통 HTTP 헬퍼 ───────────────────────────────────────────────────────────

def _headers(tr_id: str) -> dict[str, str]:
    app_key = os.getenv("KIS_APP_KEY", "")
    app_secret = os.getenv("KIS_APP_SECRET", "")
    return {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {get_token()}",
        "appkey": app_key,
        "appsecret": app_secret,
        "tr_id": tr_id,
        "custtype": "P",  # 개인
    }


def get(path: str, tr_id: str, params: dict[str, str]) -> dict[str, Any]:
    resp = requests.get(
        f"{BASE_URL}{path}",
        headers=_headers(tr_id),
        params=params,
        timeout=10,
    )
    resp.raise_for_status()
    body = resp.json()
    rt_cd = body.get("rt_cd", "1")
    if rt_cd != "0":
        msg = body.get("msg1", "알 수 없는 오류")
        raise RuntimeError(f"KIS API 오류 [{rt_cd}]: {msg}")
    return body
