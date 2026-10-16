from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "test.db"
    monkeypatch.setenv("TRIADS_DB_PATH", str(path))
    return path


@pytest.fixture
def client(db_path):
    with TestClient(app) as test_client:
        yield test_client


def test_defaults_on_an_empty_database(client):
    assert client.get("/api/settings").json() == {
        "learn_key": 0,
        "learn_quality": "major",
        "learn_string_set": 2,
        "bpm": 60,
        "show_labels": True,
        "mode": "learn",
        "comp_key": 7,
        "comp_progression": "I-V-vi-IV",
        "comp_string_set": 2,
        "comp_instrument": "piano",
        "comp_bpm": 80,
    }


def test_settings_survive_a_reload(client):
    """Every learning and comping choice comes back as it was saved."""
    payload = {
        "learn_key": 9,
        "learn_quality": "minor",
        "learn_string_set": 0,
        "bpm": 84,
        "show_labels": False,
        "mode": "comp",
        "comp_key": 3,
        "comp_progression": "blues",
        "comp_string_set": 1,
        "comp_instrument": "guitar",
        "comp_bpm": 132,
    }
    assert client.put("/api/settings", json=payload).json() == payload
    assert client.get("/api/settings").json() == payload


def test_a_database_left_in_drill_mode_opens_in_learning_mode(db_path):
    """The Pi's database last saved mode=drill and still has the drill's tables."""
    conn = sqlite3.connect(db_path)
    conn.executescript(
        """
        CREATE TABLE preference (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE practice_event (id INTEGER PRIMARY KEY, root_pc INTEGER);
        INSERT INTO preference VALUES ('mode', 'drill'), ('comp_key', '5');
        INSERT INTO practice_event (root_pc) VALUES (3);
        """
    )
    conn.commit()
    conn.close()

    with TestClient(app) as client:
        settings = client.get("/api/settings").json()

    assert settings["mode"] == "learn"
    assert settings["comp_key"] == 5
    conn = sqlite3.connect(db_path)
    assert conn.execute("SELECT COUNT(*) FROM practice_event").fetchone()[0] == 1
    conn.close()


@pytest.mark.parametrize(
    "field, value",
    [
        ("learn_key", 12),
        ("learn_quality", "diminished"),
        ("learn_string_set", 4),
        ("comp_bpm", 200),
        ("comp_instrument", "banjo"),
        ("mode", "drill"),
        ("comp_progression", ""),
    ],
)
def test_rejects_out_of_range_settings(client, field, value):
    settings = client.get("/api/settings").json()
    settings[field] = value
    assert client.put("/api/settings", json=settings).status_code == 422


def test_concurrent_requests_share_no_connection(client):
    """FastAPI hands sync endpoints to a threadpool; connections must survive it."""
    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(lambda _: client.get("/api/settings"), range(12)))

    assert [r.status_code for r in responses] == [200] * 12


def test_only_fingerprinted_assets_are_cached_forever(tmp_path):
    """Icons and the manifest keep their names across builds, so a forever-cache
    would pin a browser to the old ones."""
    (tmp_path / "ui" / "assets").mkdir(parents=True)
    (tmp_path / "ui" / "index.html").write_text("<!doctype html>")
    (tmp_path / "ui" / "favicon.svg").write_text("<svg/>")
    (tmp_path / "ui" / "assets" / "index-abc123.js").write_text("")

    from app.main import UiFiles

    ui = FastAPI()
    ui.mount("/", UiFiles(directory=tmp_path / "ui", html=True))
    with TestClient(ui) as client:
        assert client.get("/").headers["cache-control"] == "no-cache"
        assert client.get("/favicon.svg").headers["cache-control"] == "no-cache"
        assert "immutable" in client.get("/assets/index-abc123.js").headers["cache-control"]
