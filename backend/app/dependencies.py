"""Shared FastAPI dependencies."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator

from . import db


def get_connection() -> Iterator[sqlite3.Connection]:
    """One transactional connection per request."""
    with db.session() as conn:
        yield conn
