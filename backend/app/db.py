"""SQLite connection handling and schema management."""

from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "triads.db"

# Older databases also hold setting_selection and practice_event tables from
# the drill. Nothing reads them any more, but they are left in place rather
# than dropped, so the practice history survives on the Pi.
SCHEMA = """
-- One row per preference. A missing key means the default in schemas.Settings.
CREATE TABLE IF NOT EXISTS preference (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


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
    """Create the schema if it is missing."""
    with connect(path) as conn:
        conn.executescript(SCHEMA)


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
