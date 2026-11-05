"""Erzeugt die App-Icons (PNG) ohne zusätzliche Bibliotheken.

Aufruf im Projektordner:  python3 tools/make_icons.py
Motiv: ein heller Haken auf ruhigem Grün.
"""

import math
import struct
import zlib
from pathlib import Path

BACKGROUND = (79, 125, 109)   # Grün wie in der App
FOREGROUND = (247, 244, 239)  # helles Creme

# Haken als zwei Linien, Koordinaten relativ zur Icon-Größe (0..1)
POINTS = [(0.30, 0.52), (0.44, 0.66), (0.71, 0.37)]
STROKE = 0.075  # halbe Linienbreite


def distance_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def render(size):
    rows = []
    segments = list(zip(POINTS, POINTS[1:]))
    for y in range(size):
        row = bytearray([0])  # PNG-Filter "keiner"
        for x in range(size):
            px, py = (x + 0.5) / size, (y + 0.5) / size
            d = min(distance_to_segment(px, py, *a, *b) for a, b in segments)
            # weiche Kante über etwa einen Pixel
            cover = max(0.0, min(1.0, (STROKE - d) * size + 0.5))
            row += bytes(round(bg + (fg - bg) * cover) for bg, fg in zip(BACKGROUND, FOREGROUND))
        rows.append(bytes(row))
    return b"".join(rows)


def png(size):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8 Bit, RGB
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(render(size), 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for size in (180, 192, 512):
        (out / f"icon-{size}.png").write_bytes(png(size))
        print(f"icons/icon-{size}.png")
