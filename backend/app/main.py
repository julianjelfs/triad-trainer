"""Triad Trainer API."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .routers import practice, settings


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
