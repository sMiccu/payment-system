from __future__ import annotations

from decimal import Decimal
from typing import List, Dict, Any

from django.core.exceptions import ValidationError

from control.models import DurationRate
from ..base import PricingStrategy, PricingResult, calc_played_minutes, BreakInterval


class DurationRateStrategy(PricingStrategy):
    def quote(
        self,
        *,
        store,
        is_member: bool,
        start_dt,
        end_dt,
        breaks: List[BreakInterval],
    ) -> PricingResult:
        # 料金刻みを取得
        rates = (
            DurationRate.objects
            .filter(store=store)
            .order_by("minutes")
        )
        if not rates.exists():
            raise ValidationError("料金刻み（DurationRate）が設定されていません。")

        # 分刻み集合（Decimal）と minutes -> rate の辞書
        minutes_set: List[Decimal] = []
        minutes_to_price: Dict[Decimal, Decimal] = {}
        for r in rates:
            m = Decimal(str(r.minutes))
            if m not in minutes_set:
                minutes_set.append(m)
            unit = Decimal(r.membership_price if is_member else r.general_price)
            minutes_to_price[m] = unit
        minutes_set.sort()

        played_minutes = calc_played_minutes(start_dt, end_dt, breaks)
        if played_minutes <= 0:
            return PricingResult(played_minutes=Decimal("0.00"), subtotal=Decimal("0"), breakdown=[])

        max_step = minutes_set[-1]
        min_step = minutes_set[0]

        # 分解: 最大刻みのフルブロック + 余りは minutes_set で天井繰り上げ
        # Decimal 同士の除算 → 商の整数部と余りを計算
        full_blocks = (played_minutes // max_step)  # Decimal の // は床
        remainder = played_minutes - (full_blocks * max_step)

        breakdown: List[Dict[str, Any]] = []
        subtotal = Decimal("0")

        if full_blocks > 0:
            unit = minutes_to_price[max_step]
            line_total = unit * int(full_blocks)
            subtotal += line_total
            breakdown.append({
                "minutes": max_step,
                "count": int(full_blocks),
                "unit_price": unit,
                "line_total": line_total,
            })

        if remainder > 0:
            # remainder をカバーできる最小の刻みを選択（なければ最大刻み）
            ceil_step = None
            for s in minutes_set:
                if s >= remainder:
                    ceil_step = s
                    break
            if ceil_step is None:
                ceil_step = max_step
            unit = minutes_to_price.get(ceil_step)
            if unit is None:
                raise ValidationError(f"料金が未設定の刻みがあります: {ceil_step}")
            line_total = unit * 1
            subtotal += line_total
            breakdown.append({
                "minutes": ceil_step,
                "count": 1,
                "unit_price": unit,
                "line_total": line_total,
            })
        elif full_blocks == 0:
            # played が最小刻み未満かつ remainder==0（ほぼ 0 より大きく丸め誤差で 0 になったケース）の保険
            unit = minutes_to_price[min_step]
            line_total = unit * 1
            subtotal += line_total
            breakdown.append({
                "minutes": min_step,
                "count": 1,
                "unit_price": unit,
                "line_total": line_total,
            })

        return PricingResult(
            played_minutes=played_minutes,
            subtotal=subtotal,
            breakdown=breakdown,
        )


