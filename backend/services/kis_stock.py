"""
한국투자증권 Open API 주식 데이터 조회.

공식 문서: https://apiportal.koreainvestment.com/apiservice
"""
from __future__ import annotations

import os
from typing import Any

from services.kis_client import get, _IS_VIRTUAL


# ── TR_ID 분기 (모의투자 vs 실전) ───────────────────────────────────────────

def _tr(real: str, virtual: str) -> str:
    return virtual if _IS_VIRTUAL else real


# ── 현재가 조회 ───────────────────────────────────────────────────────────────

def get_current_price(ticker: str) -> dict[str, Any]:
    """
    주식 현재가 조회.

    Args:
        ticker: 6자리 종목코드 (예: "005930")

    Returns:
        {
            ticker, name, current_price, open_price, high_price, low_price,
            prev_close, change, change_rate, volume, trading_value,
            market_cap, per, pbr
        }
    """
    body = get(
        "/uapi/domestic-stock/v1/quotations/inquire-price",
        tr_id="FHKST01010100",
        params={
            "fid_cond_mrkt_div_code": "J",  # 주식·ETF·ETN
            "fid_input_iscd": ticker,
        },
    )
    o = body["output"]

    current = int(o.get("stck_prpr", 0))
    prev_close = int(o.get("stck_sdpr", 0))  # 전일 종가
    change = current - prev_close
    change_rate = float(o.get("prdy_ctrt", 0))

    return {
        "ticker": ticker,
        "name": o.get("hts_kor_isnm", ""),
        "current_price": current,
        "open_price": int(o.get("stck_oprc", 0)),
        "high_price": int(o.get("stck_hgpr", 0)),
        "low_price": int(o.get("stck_lwpr", 0)),
        "prev_close": prev_close,
        "change": change,
        "change_rate": change_rate,
        "volume": int(o.get("acml_vol", 0)),
        "trading_value": int(o.get("acml_tr_pbmn", 0)),  # 누적 거래대금 (원)
        "market_cap": int(o.get("hts_avls", 0)) * 100_000_000,  # 억 → 원
        "per": float(o.get("per", 0) or 0),
        "pbr": float(o.get("pbr", 0) or 0),
    }


# ── 거래량 순위 ───────────────────────────────────────────────────────────────

def get_volume_rank(
    market: str = "0",
    limit: int = 30,
) -> list[dict[str, Any]]:
    """
    거래량 순위 조회 (당일 누적).

    Args:
        market: "0"=전체, "1"=코스피, "2"=코스닥
        limit:  상위 N개 (최대 40)

    Returns:
        [{ rank, ticker, name, current_price, change_rate, volume, trading_value }]
    """
    body = get(
        "/uapi/domestic-stock/v1/ranking/volume",
        tr_id=_tr("FHPST01710000", "FHPST01710000"),
        params={
            "fid_cond_mrkt_div_code": "J",
            "fid_cond_scr_div_code": "20171",
            "fid_input_iscd": "0000",     # 전 종목
            "fid_div_cls_code": "0",      # 전체
            "fid_blng_cls_code": market,
            "fid_trgt_cls_code": "111111111",
            "fid_trgt_exls_cls_code": "000000",
            "fid_input_price_1": "",
            "fid_input_price_2": "",
            "fid_vol_cnt": "",
            "fid_input_date_1": "",
        },
    )

    result = []
    for item in body.get("output", [])[:limit]:
        result.append({
            "rank": int(item.get("data_rank", 0)),
            "ticker": item.get("mksc_shrn_iscd", ""),
            "name": item.get("hts_kor_isnm", ""),
            "current_price": int(item.get("stck_prpr", 0)),
            "change_rate": float(item.get("prdy_ctrt", 0)),
            "volume": int(item.get("acml_vol", 0)),
            "trading_value": int(item.get("acml_tr_pbmn", 0)),
        })
    return result


# ── 거래대금 순위 ─────────────────────────────────────────────────────────────

def get_trading_value_rank(
    market: str = "0",
    limit: int = 30,
) -> list[dict[str, Any]]:
    """
    거래대금 순위 조회 (당일 누적).

    Args:
        market: "0"=전체, "1"=코스피, "2"=코스닥
        limit:  상위 N개 (최대 40)

    Returns:
        [{ rank, ticker, name, current_price, change_rate, volume, trading_value }]
    """
    body = get(
        "/uapi/domestic-stock/v1/ranking/trading-value",
        tr_id=_tr("FHPST01720000", "FHPST01720000"),
        params={
            "fid_cond_mrkt_div_code": "J",
            "fid_cond_scr_div_code": "20172",
            "fid_input_iscd": "0000",
            "fid_div_cls_code": "0",
            "fid_blng_cls_code": market,
            "fid_trgt_cls_code": "111111111",
            "fid_trgt_exls_cls_code": "000000",
            "fid_input_price_1": "",
            "fid_input_price_2": "",
            "fid_vol_cnt": "",
            "fid_input_date_1": "",
        },
    )

    result = []
    for item in body.get("output", [])[:limit]:
        result.append({
            "rank": int(item.get("data_rank", 0)),
            "ticker": item.get("mksc_shrn_iscd", ""),
            "name": item.get("hts_kor_isnm", ""),
            "current_price": int(item.get("stck_prpr", 0)),
            "change_rate": float(item.get("prdy_ctrt", 0)),
            "volume": int(item.get("acml_vol", 0)),
            "trading_value": int(item.get("acml_tr_pbmn", 0)),
        })
    return result


# ── 계좌 잔고 조회 (선택 기능) ────────────────────────────────────────────────

def get_account_balance() -> dict[str, Any]:
    """
    주식 계좌 잔고 조회.

    Returns:
        {
            total_eval_amount,  # 총평가금액
            total_purchase,     # 총매입금액
            total_profit,       # 평가손익
            holdings: [{ ticker, name, qty, avg_price, current_price, profit_rate }]
        }
    """
    cano_full = os.getenv("KIS_ACCOUNT_NO", "")
    if "-" not in cano_full:
        raise ValueError("KIS_ACCOUNT_NO 형식이 올바르지 않습니다. 예: 50123456-01")
    cano, acnt_prdt_cd = cano_full.split("-", 1)

    body = get(
        "/uapi/domestic-stock/v1/trading/inquire-balance",
        tr_id=_tr("TTTC8434R", "VTTC8434R"),
        params={
            "CANO": cano,
            "ACNT_PRDT_CD": acnt_prdt_cd,
            "AFHR_FLPR_YN": "N",
            "OFL_YN": "",
            "INQR_DVSN": "02",
            "UNPR_DVSN": "01",
            "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N",
            "PRCS_DVSN": "01",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": "",
        },
    )

    summary = body.get("output2", [{}])[0] if body.get("output2") else {}
    holdings = []
    for item in body.get("output1", []):
        qty = int(item.get("hldg_qty", 0))
        if qty == 0:
            continue
        holdings.append({
            "ticker": item.get("pdno", ""),
            "name": item.get("prdt_name", ""),
            "qty": qty,
            "avg_price": int(item.get("pchs_avg_pric", 0) or 0),
            "current_price": int(item.get("prpr", 0)),
            "profit_rate": float(item.get("evlu_pfls_rt", 0) or 0),
        })

    return {
        "total_eval_amount": int(summary.get("tot_evlu_amt", 0) or 0),
        "total_purchase": int(summary.get("pchs_amt_smtl_amt", 0) or 0),
        "total_profit": int(summary.get("evlu_pfls_smtl_amt", 0) or 0),
        "holdings": holdings,
    }
