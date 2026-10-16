"""All SQL lives here, so the routes stay about HTTP and the rules stay testable."""

from __future__ import annotations

import sqlite3

from .schemas import Settings

DEFAULTS = Settings()


def _preferences(conn: sqlite3.Connection) -> dict[str, str]:
    rows = conn.execute("SELECT key, value FROM preference").fetchall()
    return {row["key"]: row["value"] for row in rows}


def get_settings(conn: sqlite3.Connection) -> Settings:
    prefs = _preferences(conn)
    # The old drill mode is gone. A database that last saved it opens on
    # learning mode, which is what replaced it.
    mode = prefs.get("mode", DEFAULTS.mode)
    return Settings(
        learn_key=int(prefs.get("learn_key", DEFAULTS.learn_key)),
        learn_quality=prefs.get("learn_quality", DEFAULTS.learn_quality),
        learn_string_set=int(prefs.get("learn_string_set", DEFAULTS.learn_string_set)),
        bpm=int(prefs.get("bpm", DEFAULTS.bpm)),
        show_labels=prefs.get("show_labels", "1") == "1",
        mode=mode if mode in ("learn", "comp") else DEFAULTS.mode,
        comp_key=int(prefs.get("comp_key", DEFAULTS.comp_key)),
        comp_progression=prefs.get("comp_progression", DEFAULTS.comp_progression),
        comp_string_set=int(prefs.get("comp_string_set", DEFAULTS.comp_string_set)),
        comp_instrument=prefs.get("comp_instrument", DEFAULTS.comp_instrument),
        comp_bpm=int(prefs.get("comp_bpm", DEFAULTS.comp_bpm)),
    )


def save_settings(conn: sqlite3.Connection, settings: Settings) -> Settings:
    conn.executemany(
        "INSERT INTO preference (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [
            ("learn_key", str(settings.learn_key)),
            ("learn_quality", settings.learn_quality),
            ("learn_string_set", str(settings.learn_string_set)),
            ("bpm", str(settings.bpm)),
            ("show_labels", "1" if settings.show_labels else "0"),
            ("mode", settings.mode),
            ("comp_key", str(settings.comp_key)),
            ("comp_progression", settings.comp_progression),
            ("comp_string_set", str(settings.comp_string_set)),
            ("comp_instrument", settings.comp_instrument),
            ("comp_bpm", str(settings.comp_bpm)),
        ],
    )
    return get_settings(conn)
