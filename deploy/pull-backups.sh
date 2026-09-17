#!/usr/bin/env bash
# Pull the Pi's backups onto this laptop. Run daily by a launchd agent, and safe by hand.
set -euo pipefail

HOST="${TRIADS_PI_HOST:-julian_jelfs@pi.local}"
DEST="${TRIADS_BACKUP_DEST:-$HOME/Backups/triad-trainer}"
KEEP=30

mkdir -p "$DEST"
# No --delete: if the Pi loses its backups, this side should not lose them too.
rsync -az -e "ssh -o BatchMode=yes -o ConnectTimeout=10" "$HOST:~/triads-backups/" "$DEST/"
ls -1t "$DEST"/triads-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -I{} rm -f {}
echo "$(ls -1 "$DEST"/triads-*.db 2>/dev/null | wc -l | tr -d ' ') backups in $DEST"
