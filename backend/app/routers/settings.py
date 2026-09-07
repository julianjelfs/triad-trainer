"""Which qualities, string sets, inversions and roots are in play."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends

from .. import repository
from ..dependencies import get_connection
from ..schemas import Settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=Settings)
def read_settings(conn: sqlite3.Connection = Depends(get_connection)) -> Settings:
    return repository.get_settings(conn)


@router.put("", response_model=Settings)
def write_settings(
    settings: Settings, conn: sqlite3.Connection = Depends(get_connection)
) -> Settings:
    return repository.save_settings(conn, settings)
