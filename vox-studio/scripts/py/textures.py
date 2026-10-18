"""Stage: procedural paper texture + film grain (original, no third-party images).

usage: textures.py <out_dir>
writes: paper.jpg (2160x2160), paper-dark.jpg, grain_0..3.png (512x512, alpha)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from common import log


def smooth_noise(size, scale, rng):
    small = rng.random((max(2, size // scale), max(2, size // scale))).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0


def fibres(size, rng, count=2600):
    canvas = Image.new("L", (size, size), 0)
    px = canvas.load()
    for _ in range(count):
        x, y = rng.random() * size, rng.random() * size
        ang = rng.random() * np.pi
        length = 8 + rng.random() * 46
        val = int(30 + rng.random() * 70)
        for t in np.linspace(0, length, int(length)):
            xi, yi = int(x + np.cos(ang) * t) % size, int(y + np.sin(ang) * t) % size
            px[xi, yi] = max(px[xi, yi], val)
    return np.asarray(canvas.filter(ImageFilter.GaussianBlur(0.6)), dtype=np.float32) / 255.0


def paper(size, base, rng, dark=False):
    mott = 0.55 * smooth_noise(size, 180, rng) + 0.3 * smooth_noise(size, 40, rng) + 0.15 * smooth_noise(size, 9, rng)
    fine = rng.normal(0, 1, (size, size)).astype(np.float32)
    fib = fibres(size, rng)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size
    vignette = 1 - 0.10 * (((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 2.2)
    lum = (mott - 0.5) * 0.07 + fine * 0.012 - fib * (0.05 if not dark else -0.06)
    rgb = np.array(base, dtype=np.float32)[None, None, :] / 255.0
    out = rgb * (1 + lum[..., None]) * vignette[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def grain(size, rng):
    g = rng.normal(0.5, 0.22, (size, size)).astype(np.float32)
    g = np.clip(g, 0, 1)
    l = (g * 255).astype(np.uint8)
    a = (np.abs(g - 0.5) * 2 * 255).astype(np.uint8)
    return Image.merge("LA", (Image.fromarray(l), Image.fromarray(a)))


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(7)
    if not (out / "paper.jpg").exists():
        paper(2160, (236, 230, 217), rng).save(out / "paper.jpg", quality=88)
        paper(2160, (30, 33, 38), rng, dark=True).save(out / "paper-dark.jpg", quality=88)
    for i in range(4):
        p = out / f"grain_{i}.png"
        if not p.exists():
            grain(512, rng).save(p)
    log(f"textures: ready in {out}")


if __name__ == "__main__":
    main()
