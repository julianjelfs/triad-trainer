"""Choosing what to drill next: least-practised first, oldest breaks the tie.

A drill covers every enabled inversion of one chord on one string set, so it is
scored on the total across those inversions rather than on any single shape.
"""

from __future__ import annotations

import random
from itertools import product

from .schemas import DrillItem, ItemStat, Settings

StatsByItem = dict[tuple[int, str, int, str], ItemStat]


def candidates(settings: Settings) -> list[DrillItem]:
    if not settings.inversions:
        return []
    return [
        DrillItem(root_pc=root, quality=quality, string_set=string_set)
        for root, quality, string_set in product(settings.roots, settings.qualities, settings.sets)
    ]


def _score(drill: DrillItem, settings: Settings, stats: StatsByItem) -> tuple[int, str]:
    """Total laps' worth of practice, and the date of the most recent one."""
    total = 0
    latest = ""
    for inversion in settings.inversions:
        stat = stats.get((drill.root_pc, drill.quality, drill.string_set, inversion))
        if stat:
            total += stat.count
            latest = max(latest, stat.last_practised_at or "")
    return total, latest


def choose_next(
    settings: Settings,
    stats: StatsByItem,
    rng: random.Random | None = None,
) -> DrillItem | None:
    """None means the settings rule out every combination."""
    pool = candidates(settings)
    if not pool:
        return None

    scored = [(drill, _score(drill, settings, stats)) for drill in pool]
    lowest = min(count for _, (count, _last) in scored)
    # One lap's worth of headroom, so the choice stays varied without letting
    # well-drilled chords back in ahead of ones you have never played.
    window = len(settings.inversions)
    within_window = [drill for drill, (count, _last) in scored if count <= lowest + window]
    return (rng or random).choice(within_window)
