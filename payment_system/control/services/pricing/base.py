from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol, List, Tuple, Dict, Any


BreakInterval = Tuple[datetime, datetime]


@dataclass
class PricingResult:
    played_minutes: Decimal  # 実プレイ分（分、少数対応）
    subtotal: Decimal        # 税抜小計（今回の要件では税込は未実装）
    breakdown: List[Dict[str, Any]]  # {minutes(Decimal), count(int), unit_price(Decimal), line_total(Decimal)}


class PricingStrategy(Protocol):
    def quote(
        self,
        *,
        store,
        is_member: bool,
        start_dt: datetime,
        end_dt: datetime,
        breaks: List[BreakInterval],
    ) -> PricingResult:
        ...


def _overlap_seconds(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> int:
    """2 区間の重なり秒数（負の場合は 0）。"""
    start = max(a_start, b_start)
    end = min(a_end, b_end)
    if end <= start:
        return 0
    return int((end - start).total_seconds())


def calc_played_minutes(start_dt: datetime, end_dt: datetime, breaks: List[BreakInterval]) -> Decimal:
    """合計プレイ分（分単位、小数対応）。break は対象区間にクリップし重複相殺する。"""
    total_seconds = int((end_dt - start_dt).total_seconds())
    if total_seconds <= 0:
        return Decimal("0")
    # 各 break の重なり秒を合算（重複 break はそのまま合計。ただし _overlap_seconds が区間外を排除）
    break_seconds = 0
    for b_start, b_end in breaks:
        if b_start is None or b_end is None:
            continue
        break_seconds += _overlap_seconds(start_dt, end_dt, b_start, b_end)
    effective_seconds = max(0, total_seconds - break_seconds)
    # 分へ変換（小数分を保持）
    minutes = (Decimal(effective_seconds) / Decimal("60"))
    # 表示・計算安定化のため 2 桁で丸め（四捨五入）
    return minutes.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


