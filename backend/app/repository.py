"""All SQL lives here, so the routes stay about HTTP and the rules stay testable."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from .schemas import ItemStat, PracticeEvent, PracticeStats, RootStat, Settings, TriadItem

TOTAL_ROOTS = 12


def _selections(conn: sqlite3.Connection) -> dict[str, list[str]]:
    rows = conn.execute("SELECT category, value FROM setting_selection").fetchall()
    grouped: dict[str, list[str]] = {}
    for row in rows:
        grouped.setdefault(row["category"], []).append(row["value"])
    return grouped


def _preferences(conn: sqlite3.Connection) -> dict[str, str]:
    rows = conn.execute("SELECT key, value FROM preference").fetchall()
    return {row["key"]: row["value"] for row in rows}


def get_settings(conn: sqlite3.Connection) -> Settings:
    selections = _selections(conn)
    prefs = _preferences(conn)
    return Settings(
        qualities=sorted(selections.get("quality", [])),
        sets=sorted(int(v) for v in selections.get("set", [])),
        inversions=selections.get("inversion", []),
        roots=sorted(int(v) for v in selections.get("root", [])),
        bpm=int(prefs.get("bpm", 60)),
        show_labels=prefs.get("show_labels", "1") == "1",
    )


def save_settings(conn: sqlite3.Connection, settings: Settings) -> Settings:
    rows = [
        *(("quality", q) for q in settings.qualities),
        *(("set", str(s)) for s in settings.sets),
        *(("inversion", i) for i in settings.inversions),
        *(("root", str(r)) for r in settings.roots),
    ]
    conn.execute("DELETE FROM setting_selection")
    conn.executemany("INSERT INTO setting_selection (category, value) VALUES (?, ?)", rows)
    conn.executemany(
        "INSERT INTO preference (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [("bpm", str(settings.bpm)), ("show_labels", "1" if settings.show_labels else "0")],
    )
    return get_settings(conn)


def record_practice(conn: sqlite3.Connection, items: list[TriadItem]) -> list[PracticeEvent]:
    """Log a run of shapes. A lap of a drill arrives as one call, not one per bar."""
    practised_at = datetime.now(timezone.utc).isoformat()
    events = []
    for item in items:
        cursor = conn.execute(
            "INSERT INTO practice_event (root_pc, quality, string_set, inversion, practised_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (item.root_pc, item.quality, item.string_set, item.inversion, practised_at),
        )
        events.append(
            PracticeEvent(**item.model_dump(), id=cursor.lastrowid, practised_at=practised_at)
        )
    return events


def item_counts(conn: sqlite3.Connection) -> dict[tuple[int, str, int, str], ItemStat]:
    """Every combination that has ever been practised, keyed by its identity."""
    rows = conn.execute(
        "SELECT root_pc, quality, string_set, inversion, "
        "       COUNT(*) AS count, MAX(practised_at) AS last_practised_at "
        "FROM practice_event "
        "GROUP BY root_pc, quality, string_set, inversion"
    ).fetchall()
    return {
        (row["root_pc"], row["quality"], row["string_set"], row["inversion"]): ItemStat(
            root_pc=row["root_pc"],
            quality=row["quality"],
            string_set=row["string_set"],
            inversion=row["inversion"],
            count=row["count"],
            last_practised_at=row["last_practised_at"],
        )
        for row in rows
    }


def get_stats(conn: sqlite3.Connection, limit: int = 8) -> PracticeStats:
    stats = list(item_counts(conn).values())
    stats.sort(key=lambda s: (s.count, s.last_practised_at or ""))

    per_root = dict.fromkeys(range(TOTAL_ROOTS), 0)
    for stat in stats:
        per_root[stat.root_pc] += stat.count

    return PracticeStats(
        total=sum(stat.count for stat in stats),
        by_root=[RootStat(root_pc=pc, count=count) for pc, count in per_root.items()],
        items=stats[:limit],
    )


def reset_log(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM practice_event")
