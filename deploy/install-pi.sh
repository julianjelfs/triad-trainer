#!/usr/bin/env bash
# Install (or re-install) Triad Trainer on the Pi. Run it ON the Pi:
#
#   cd ~/triad-trainer && ./deploy/install-pi.sh
#
# Safe to re-run: never touches the database. It does not build the frontend (that
# happens on the laptop, via `triad-trainer rebuild`) and it does not configure Caddy:
# one Caddyfile serves both apps and it lives in the recipe-for-disaster repo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ "$(id -un)" = root ] && { echo "run this as your normal user, not root" >&2; exit 1; }

echo "==> backend dependencies"
"$HOME/.local/bin/uv" --version >/dev/null 2>&1 || { echo "uv is not installed: https://astral.sh/uv" >&2; exit 1; }
(cd "$ROOT/backend" && "$HOME/.local/bin/uv" sync -q)

echo "==> systemd units"
sudo cp "$ROOT/deploy/triads.service" /etc/systemd/system/triads.service
sudo cp "$ROOT/deploy/triads-backup.service" /etc/systemd/system/triads-backup.service
sudo cp "$ROOT/deploy/triads-backup.timer" /etc/systemd/system/triads-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now triads.service >/dev/null
sudo systemctl enable --now triads-backup.timer >/dev/null

echo "==> waiting for the app"
for _ in $(seq 1 40); do
	curl -sf -m 1 http://127.0.0.1:8000/api/health >/dev/null && break
	sleep 0.5
done
curl -sf -m 3 http://127.0.0.1:8000/api/health >/dev/null \
	|| { echo "the app did not come up; see: sudo journalctl -u triads -n 50" >&2; exit 1; }

echo
echo "installed."
printf "  app        : %s\n" "$(systemctl is-active triads)"
printf "  next backup: %s\n" "$(systemctl list-timers triads-backup --no-pager 2>/dev/null | awk 'NR==2 {print $1, $2, $3}')"
echo
echo "Caddy still needs the triads block uncommented in the recipe-for-disaster repo."
