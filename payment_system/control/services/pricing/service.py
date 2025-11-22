from __future__ import annotations

from datetime import datetime
from typing import List, Tuple

from django.db.models import Q
from django.utils import timezone

from customer.models import CustomerBreak
from .base import PricingResult, BreakInterval
from .registry import get_strategy_for_store


def collect_breaks_for_customer(*, customer, start_dt: datetime, end_dt: datetime) -> List[BreakInterval]:
    """
    指定区間と重なる休止を取得し、[start_dt, end_dt] にクリップした区間リストを返す。
    end_datetime が NULL（休止中）のものは now で補完する。
    """
    now = timezone.now()
    qs = CustomerBreak.objects.filter(
        customer=customer
    ).filter(
        Q(start_datetime__lt=end_dt) & (Q(end_datetime__gt=start_dt) | Q(end_datetime__isnull=True))
    ).order_by("start_datetime")

    breaks: List[Tuple[datetime, datetime]] = []
    for b in qs:
        b_start = b.start_datetime or start_dt
        b_end = b.end_datetime or now
        # クリップ
        s = max(start_dt, b_start)
        e = min(end_dt, b_end)
        if e > s:
            breaks.append((s, e))
    return breaks


def quote_amount(
    *,
    store,
    is_member: bool,
    start_dt: datetime,
    end_dt: datetime,
    breaks: List[BreakInterval],
) -> PricingResult:
    strategy = get_strategy_for_store(store)
    return strategy.quote(
        store=store,
        is_member=is_member,
        start_dt=start_dt,
        end_dt=end_dt,
        breaks=breaks,
    )


