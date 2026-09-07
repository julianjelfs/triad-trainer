"""The practice loop: ask for a drill, log the shapes you played, read the stats."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Body, Depends, HTTPException, status

from .. import repository, selection
from ..dependencies import get_connection
from ..schemas import DrillItem, PracticeEvent, PracticeStats, TriadItem

router = APIRouter(prefix="/api/practice", tags=["practice"])


@router.get("/next", response_model=DrillItem)
def next_drill(conn: sqlite3.Connection = Depends(get_connection)) -> DrillItem:
    settings = repository.get_settings(conn)
    drill = selection.choose_next(settings, repository.item_counts(conn))
    if drill is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No drills match the current settings.",
        )
    return drill


@router.post("/events", response_model=list[PracticeEvent], status_code=status.HTTP_201_CREATED)
def log_items(
    items: list[TriadItem] = Body(...), conn: sqlite3.Connection = Depends(get_connection)
) -> list[PracticeEvent]:
    return repository.record_practice(conn, items)


@router.get("/stats", response_model=PracticeStats)
def read_stats(
    limit: int = 8, conn: sqlite3.Connection = Depends(get_connection)
) -> PracticeStats:
    return repository.get_stats(conn, limit=limit)


@router.delete("/events", status_code=status.HTTP_204_NO_CONTENT)
def clear_log(conn: sqlite3.Connection = Depends(get_connection)) -> None:
    repository.reset_log(conn)
