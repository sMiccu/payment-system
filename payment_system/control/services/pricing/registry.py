from __future__ import annotations

from typing import Type, Dict

from .strategies.duration_rate import DurationRateStrategy


_STRATEGIES: Dict[str, Type] = {
    "duration_rate": DurationRateStrategy,
}


def get_strategy_for_store(store):
    key = getattr(store, "pricing_logic", None) or "duration_rate"
    Strategy = _STRATEGIES.get(str(key), DurationRateStrategy)
    return Strategy()


