"""Render the three-dot mark to PNG app icons. No dependencies beyond zlib.

Usage: python3 scripts/make-icons.py frontend/public

The colours and circles match the wordmark in App.svelte and favicon.svg.
"""
import math
import struct
import sys
import zlib
from pathlib import Path

out = Path(sys.argv[1])

PAPER = (0xF5, 0xEC, 0xDA)
# Same circles as the wordmark's 24-unit viewBox: do, mi, so.
CIRCLES = [
    (6.0, 17.0, 4.2, (0xC9, 0x3C, 0x25)),
    (12.0, 7.5, 4.2, (0xF0, 0xB0, 0x2A)),
    (18.0, 17.0, 4.2, (0x2A, 0x6A, 0xA8)),
]
# Centre of the mark's bounding box, and its larger side.
CX, CY, SPAN = 12.0, 12.25, 20.4


def render(size: int, mark_fraction: float) -> bytes:
    scale = size * mark_fraction / SPAN
    rows = []
    for py in range(size):
        row = bytearray([0])  # filter: none
        for px in range(size):
            r, g, b = PAPER
            # Pixel centre in mark units.
            x = (px + 0.5 - size / 2) / scale + CX
            y = (py + 0.5 - size / 2) / scale + CY
            for cx, cy, rad, colour in CIRCLES:
                # Signed distance in pixels gives a one-pixel anti-aliased edge.
                d = (math.hypot(x - cx, y - cy) - rad) * scale
                cover = min(1.0, max(0.0, 0.5 - d))
                if cover:
                    r = round(r + (colour[0] - r) * cover)
                    g = round(g + (colour[1] - g) * cover)
                    b = round(b + (colour[2] - b) * cover)
            row += bytes((r, g, b))
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


# Home-screen icons are full-bleed paper; the launcher crops the corners. The
# mark stays inside the central 60% so a circular mask never clips it.
for name, size in [("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)]:
    (out / name).write_bytes(render(size, 0.6))
    print(name)
