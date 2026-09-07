#!/usr/bin/env bash
# Run the API and the Vite dev server together. Ctrl-C stops both.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

(cd "$root/backend" && uv run uvicorn app.main:app --reload --port 8000) &
(cd "$root/frontend" && npm run dev) &

wait
