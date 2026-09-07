from __future__ import annotations

import random
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import ItemStat, Settings
from app.selection import choose_next


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("TRIADS_DB_PATH", str(tmp_path / "test.db"))
    with TestClient(app) as test_client:
        yield test_client


def test_defaults_are_seeded(client):
    settings = client.get("/api/settings").json()
    assert settings["qualities"] == ["major"]
    assert settings["roots"] == list(range(12))
    assert settings["bpm"] == 60


def test_settings_round_trip(client):
    payload = {
        "qualities": ["minor"],
        "sets": [1],
        "inversions": ["first"],
        "roots": [0, 7],
        "bpm": 84,
        "show_labels": False,
    }
    assert client.put("/api/settings", json=payload).json() == payload
    assert client.get("/api/settings").json() == payload


def test_next_drill_respects_settings(client):
    client.put(
        "/api/settings",
        json={
            "qualities": ["minor"],
            "sets": [2],
            "inversions": ["second"],
            "roots": [3],
            "bpm": 60,
            "show_labels": True,
        },
    )
    # A drill names the chord and string set; the inversions are its steps.
    assert client.get("/api/practice/next").json() == {
        "root_pc": 3,
        "quality": "minor",
        "string_set": 2,
    }


def test_next_drill_409_when_nothing_selected(client):
    client.put(
        "/api/settings",
        json={
            "qualities": [],
            "sets": [],
            "inversions": [],
            "roots": [],
            "bpm": 60,
            "show_labels": True,
        },
    )
    assert client.get("/api/practice/next").status_code == 409


def test_logging_a_lap_accumulates_stats(client):
    lap = [
        {"root_pc": 0, "quality": "major", "string_set": 0, "inversion": inversion}
        for inversion in ("first", "second", "root", "first")
    ]
    response = client.post("/api/practice/events", json=lap)
    assert response.status_code == 201
    assert len(response.json()) == 4

    stats = client.get("/api/practice/stats").json()
    assert stats["total"] == 4
    # The lap passed "first" twice, an octave apart, so it counts twice.
    counts = {item["inversion"]: item["count"] for item in stats["items"]}
    assert counts == {"root": 1, "second": 1, "first": 2}
    assert next(r for r in stats["by_root"] if r["root_pc"] == 0)["count"] == 4

    assert client.delete("/api/practice/events").status_code == 204
    assert client.get("/api/practice/stats").json()["total"] == 0


def test_rejects_out_of_range_root(client):
    response = client.put(
        "/api/settings",
        json={
            "qualities": ["major"],
            "sets": [0],
            "inversions": ["root"],
            "roots": [12],
            "bpm": 60,
            "show_labels": True,
        },
    )
    assert response.status_code == 422


def _stat(inversion: str, count: int) -> ItemStat:
    return ItemStat(
        root_pc=0,
        quality="major",
        string_set=0,
        inversion=inversion,
        count=count,
        last_practised_at="2026-01-01T00:00:00+00:00",
    )


def test_choose_next_prefers_least_practised():
    settings = Settings(
        qualities=["major"],
        sets=[0],
        inversions=["root", "first", "second"],
        roots=[0, 1],
        bpm=60,
        show_labels=True,
    )
    # Root 0 has three laps behind it, which is well outside the one-lap window.
    stats = {
        (0, "major", 0, inversion): _stat(inversion, 9)
        for inversion in ("root", "first", "second")
    }
    assert choose_next(settings, stats, rng=random.Random(1)).root_pc == 1


def test_choose_next_scores_a_drill_across_its_inversions():
    settings = Settings(
        qualities=["major"],
        sets=[0],
        inversions=["root", "first", "second"],
        roots=[0, 1],
        bpm=60,
        show_labels=True,
    )
    # One heavily drilled inversion still rules the whole chord out.
    stats = {(0, "major", 0, "root"): _stat("root", 20)}
    assert choose_next(settings, stats, rng=random.Random(0)).root_pc == 1


def test_choose_next_none_when_no_inversions_enabled():
    settings = Settings(
        qualities=["major"], sets=[0], inversions=[], roots=[0], bpm=60, show_labels=True
    )
    assert choose_next(settings, {}) is None


def test_concurrent_requests_share_no_connection(client):
    """FastAPI hands sync endpoints to a threadpool; connections must survive it."""
    with ThreadPoolExecutor(max_workers=8) as pool:
        paths = ["/api/settings", "/api/practice/stats", "/api/practice/next"] * 4
        responses = list(pool.map(lambda path: client.get(path), paths))

    assert [r.status_code for r in responses] == [200] * len(paths)
