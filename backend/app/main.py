"""Triad Trainer API."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import db
from .routers import practice, settings

DEFAULT_UI_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.initialise()
    yield


app = FastAPI(title="Triad Trainer", version="0.1.0", lifespan=lifespan)

# The Vite dev server proxies /api, so this only matters if the frontend is
# ever served from a different origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings.router)
app.include_router(practice.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def ui_directory() -> Path:
    override = os.environ.get("TRIADS_UI_DIR")
    return Path(override) if override else DEFAULT_UI_DIR


# Serve the built frontend from the API itself, so the installed app is one
# process on one port and the browser has a single origin to deal with. Mounted
# last so every /api route above still wins. Missing in a source checkout that
# has not been built yet, which is fine: run the Vite dev server instead.
_ui = ui_directory()
if _ui.is_dir():
    app.mount("/", StaticFiles(directory=_ui, html=True), name="ui")
