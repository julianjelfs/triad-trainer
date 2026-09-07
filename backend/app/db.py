"""SQLite connection handling and schema management."""

from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "triads.db"

SCHEMA = """
-- One row per enabled option. A missing row means the option is switched off.
CREATE TABLE IF NOT EXISTS setting_selection (
    category TEXT NOT NULL,
    value    TEXT NOT NULL,
    PRIMARY KEY (category, value)
);

-- Scalar preferences that are not on/off lists (bpm, label visibility, ...).
CREATE TABLE IF NOT EXISTS preference (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Append-only log: one row per shape the player marked as done.
CREATE TABLE IF NOT EXISTS practice_event (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    root_pc      INTEGER NOT NULL,
    quality      TEXT    NOT NULL,
    string_set   INTEGER NOT NULL,
    inversion    TEXT    NOT NULL,
    practised_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS practice_event_item
    ON practice_event (root_pc, quality, string_set, inversion);
"""

# Everything on, which is what the original single-file app started with.
DEFAULT_SELECTIONS: dict[str, list[str]] = {
    "quality": ["major"],
    "set": ["0", "1", "2", "3"],
    "inversion": ["root", "first", "second"],
    "root": [str(pc) for pc in range(12)],
}

DEFAULT_PREFERENCES: dict[str, str] = {
    "bpm": "60",
    "show_labels": "1",
}


def database_path() -> Path:
    """Location of the SQLite file, overridable with TRIADS_DB_PATH."""
    override = os.environ.get("TRIADS_DB_PATH")
    return Path(override) if override else DEFAULT_DB_PATH


def connect(path: Path | None = None) -> sqlite3.Connection:
    target = path or database_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    # FastAPI runs sync endpoints and their dependencies on a threadpool, and
    # not always the same thread, so the same-thread guard has to come off. Each
    # request still gets its own connection, used by one thread at a time.
    conn = sqlite3.connect(target, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def initialise(path: Path | None = None) -> None:
    """Create the schema and seed defaults if the database is empty."""
    with connect(path) as conn:
        conn.executescript(SCHEMA)
        seeded = conn.execute("SELECT COUNT(*) AS n FROM setting_selection").fetchone()["n"]
        if seeded == 0:
            conn.executemany(
                "INSERT INTO setting_selection (category, value) VALUES (?, ?)",
                [(cat, val) for cat, vals in DEFAULT_SELECTIONS.items() for val in vals],
            )
        conn.executemany(
            "INSERT OR IGNORE INTO preference (key, value) VALUES (?, ?)",
            DEFAULT_PREFERENCES.items(),
        )


@contextmanager
def session(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    """Transactional connection; commits on success, rolls back on error."""
    conn = connect(path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
