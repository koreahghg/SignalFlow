"""
KIS Open API 분봉(1분봉) 데이터 조회.

엔드포인트: /uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice
TR_ID: FHKST03010200

반환: 최대 30개 분봉 (지정 시각 기준 역순)
여러 번 호출해 전체 당일 데이터 수집 가능.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List

from services.kis_client import get
from algorithm.volume_detector import MinuteCandle


def get_minute_candles(
    ticker: str,
    end_time: str = "",
) -> List[MinuteCandle]:
    """
    종목 1분봉 데이터 조회.

    Args:
        ticker:    6자리 종목코드
        end_time:  HHMMSS 기준 시각 (해당 시각 이전 데이터 반환). 기본값: 현재 시각

    Returns:
        시간 오름차순 MinuteCandle 리스트 (최대 30개)
    """
    if not end_time:
        end_time = datetime.now().strftime("%H%M%S")

    body = get(
        "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
        tr_id="FHKST03010200",
        params={
            "FID_ETC_CLS_CODE": "0",
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": ticker,
            "FID_INPUT_HOUR_1": end_time,
            "FID_PW_DATA_INCU_YN": "Y",
        },
    )

    candles: List[MinuteCandle] = []
    for item in body.get("output2", []):
        raw_time = str(item.get("stck_cntg_hour", ""))
        if len(raw_time) < 6:
            continue
        hh, mm = raw_time[:2], raw_time[2:4]

        candles.append(MinuteCandle(
            time=f"{hh}:{mm}",
            open=int(item.get("stck_oprc", 0) or 0),
            high=int(item.get("stck_hgpr", 0) or 0),
            low=int(item.get("stck_lwpr", 0) or 0),
            close=int(item.get("stck_prpr", 0) or 0),
            volume=int(item.get("cntg_vol", 0) or 0),
            trading_value=int(item.get("acml_tr_pbmn", 0) or 0),
        ))

    # API는 역순 반환 → 오름차순으로 뒤집기
    return list(reversed(candles))


def get_today_all_minute_candles(ticker: str) -> List[MinuteCandle]:
    """
    당일 전체 분봉 수집 (최대 ~390개).
    30개씩 역방향으로 여러 번 호출해 9:00부터 현재까지 수집.

    Returns:
        시간 오름차순 MinuteCandle 리스트
    """
    all_candles: List[MinuteCandle] = []
    seen_times: set[str] = set()

    # 현재 시각부터 역방향으로 최대 13번 조회 (390분 / 30개)
    end_time = datetime.now().strftime("%H%M%S")

    for _ in range(13):
        batch = get_minute_candles(ticker, end_time)
        if not batch:
            break

        new_candles = [c for c in batch if c.time not in seen_times]
        if not new_candles:
            break

        # 9:00 이전 데이터는 제외
        new_candles = [c for c in new_candles if c.time >= "09:00"]
        for c in new_candles:
            seen_times.add(c.time)

        all_candles = new_candles + all_candles

        earliest = batch[0].time.replace(":", "")
        if earliest <= "0905":
            break

        # 다음 배치: 현재 배치의 가장 이른 시각 이전 데이터 요청
        earliest_raw = batch[0].time.replace(":", "") + "00"
        end_time = earliest_raw

    return sorted(all_candles, key=lambda c: c.time)
