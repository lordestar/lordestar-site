#!/usr/bin/env python3
"""Generate placeholder photo-like images for the lordestar gallery.

The output is intentionally abstract so the site can ship with a cohesive photo
wall and the owner can replace each file with a real photo of the same name.
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "photos")
W, H = 720, 480

PALETTES = [
    ("#f08a6f", "#20120e", "#7fc8c0"),
    ("#7fc8c0", "#0f1e1c", "#f0e9d6"),
    ("#e8c176", "#241a0c", "#f08a6f"),
    ("#b7a6f5", "#17132a", "#7fc8c0"),
    ("#eda6c3", "#241019", "#e8c176"),
    ("#9bd3ad", "#0f2017", "#f0e9d6"),
    ("#8fb9e8", "#101a29", "#f08a6f"),
    ("#f0e9d6", "#1d1a16", "#7fc8c0"),
    ("#f08a6f", "#2a120c", "#e8c176"),
    ("#7fc8c0", "#0e2320", "#eda6c3"),
    ("#b7a6f5", "#1d1830", "#e8c176"),
    ("#eda6c3", "#2a101a", "#8fb9e8"),
]


def hex_to_rgb(value: str):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def grain(draw, size, amount=26):
    for _ in range(int(W * H / 900)):
        x = random.randrange(W)
        y = random.randrange(H)
        v = random.randint(-amount, amount)
        draw.point((x, y), fill=(v, v, v, random.randint(18, 42)))


def make_image(index):
    rng = random.Random(index * 7919)
    accent, deep, glow = (hex_to_rgb(c) for c in PALETTES[index % len(PALETTES)])

    img = Image.new("RGB", (W, H), deep)
    base = ImageDraw.Draw(img, "RGBA")

    # Vertical wash from a lighter top to the deep base.
    for y in range(H):
        t = y / H
        color = lerp(lerp(deep, accent, 0.12), deep, t * 0.92)
        base.line((0, y, W, y), fill=color)

    # Soft horizon glow.
    horizon = H * (0.42 + rng.random() * 0.18)
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    for i in range(34, 0, -2):
        a = max(0, 46 - i * 2)
        gd.ellipse(
            (W * 0.28 - i * 6, horizon - i * 3.4, W * 0.72 + i * 6, horizon + i * 3.4),
            fill=(*glow, a),
        )
    img = Image.alpha_composite(img.convert("RGBA"), glow_layer)
    draw = ImageDraw.Draw(img, "RGBA")

    # Sun / moon disc.
    disc = (W * (0.28 + rng.random() * 0.44), horizon - H * (0.10 + rng.random() * 0.12))
    dr = int(H * (0.05 + rng.random() * 0.05))
    draw.ellipse(
        (disc[0] - dr, disc[1] - dr, disc[0] + dr, disc[1] + dr),
        fill=(*glow, 120),
    )

    # Sparse translucent shapes: bands, arcs, rings.
    for _ in range(3 + index % 3):
        cx = rng.randrange(W)
        cy = rng.randrange(H)
        rr = rng.randrange(18, 90)
        color = lerp(accent, glow, rng.random())
        if rng.random() < 0.5:
            draw.ellipse(
                (cx - rr, cy - rr, cx + rr, cy + rr),
                outline=(*color, rng.randint(26, 70)),
                width=2 + rng.randint(0, 3),
            )
        else:
            draw.line(
                (cx - rr, cy, cx + rr, cy + int(rr * 0.4)),
                fill=(*color, rng.randint(22, 60)),
                width=2 + rng.randint(0, 2),
            )

    grain(draw, img.size)
    img = img.filter(ImageFilter.GaussianBlur(0.5))

    # Slight vignette to keep the wall moody and legible behind text.
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-W * 0.35, -H * 0.45, W * 1.35, H * 1.45), fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(90))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    img = Image.composite(img, dark, vignette)

    return img.convert("RGB")


def main():
    os.makedirs(OUT, exist_ok=True)
    for i in range(12):
        name = f"galaxy-{i + 1:02d}.jpg"
        make_image(i).save(os.path.join(OUT, name), quality=84, optimize=True)
        print(name)


if __name__ == "__main__":
    main()
