"""Original synthesised sound-effect library (royalty-free, made here).

usage: sfx.py <out_dir>  -> whoosh.wav pop.wav tick.wav riser.wav alert.wav ding.wav stamp.wav
Also importable: render(name) -> np.ndarray at common.SR.
"""
import sys
from pathlib import Path

import numpy as np

from common import SR, log, write_wav


def _bandpass_sweep(noise, f0, f1, q=2.0, frame=1024):
    """Overlap-add FFT band-pass whose centre glides from f0 to f1."""
    hop = frame // 2
    win = np.hanning(frame).astype(np.float32)
    out = np.zeros(len(noise) + frame, dtype=np.float32)
    freqs = np.fft.rfftfreq(frame, 1 / SR)
    frames = max(1, (len(noise) - frame) // hop + 1)
    for i in range(frames):
        seg = noise[i * hop : i * hop + frame]
        if len(seg) < frame:
            seg = np.pad(seg, (0, frame - len(seg)))
        fc = f0 * (f1 / f0) ** (i / max(1, frames - 1))
        bw = fc / q
        mask = np.exp(-0.5 * ((freqs - fc) / bw) ** 2)
        spec = np.fft.rfft(seg * win) * mask
        out[i * hop : i * hop + frame] += np.fft.irfft(spec).astype(np.float32) * win
    return out[: len(noise)]


def render(name, rng=None):
    rng = rng or np.random.default_rng(11)
    if name == "whoosh":
        n = int(0.7 * SR)
        t = np.arange(n) / SR
        sig = _bandpass_sweep(rng.normal(0, 1, n).astype(np.float32), 300, 2400, q=1.6)
        env = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 1.6
        return (sig * env * 0.5).astype(np.float32)
    if name == "pop":
        n = int(0.14 * SR)
        t = np.arange(n) / SR
        f = 380 + 520 * np.exp(-t * 45)
        sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32)
        return (sig * 0.55).astype(np.float32)
    if name == "tick":
        n = int(0.05 * SR)
        t = np.arange(n) / SR
        sig = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 140) + rng.normal(0, 0.15, n) * np.exp(-t * 300)
        return (sig * 0.35).astype(np.float32)
    if name == "riser":
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        noise = _bandpass_sweep(rng.normal(0, 1, n).astype(np.float32), 200, 5000, q=2.5)
        tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (t * 1.6)) / SR) * 0.15
        env = (t / 1.2) ** 2.2
        return ((noise * 0.5 + tone) * env).astype(np.float32)
    if name == "alert":
        out = []
        for f in (880, 660, 880, 660):
            n = int(0.12 * SR)
            t = np.arange(n) / SR
            out.append((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t * 200) * np.exp(-t * 6))
            out.append(np.zeros(int(0.03 * SR)))
        return (np.concatenate(out) * 0.28).astype(np.float32)
    if name == "ding":
        n = int(0.9 * SR)
        t = np.arange(n) / SR
        sig = sum(a * np.sin(2 * np.pi * 1318.5 * r * t) * np.exp(-t * d) for a, r, d in [(1, 1, 5), (0.5, 2.76, 9), (0.25, 5.4, 14)])
        return (sig * np.minimum(1, t * 400) * 0.22).astype(np.float32)
    if name == "stamp":
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        thump = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 18)
        slap = _bandpass_sweep(rng.normal(0, 1, n).astype(np.float32), 1200, 700, q=1.2) * np.exp(-t * 35)
        return ((thump * 0.8 + slap * 0.9) * 0.6).astype(np.float32)
    raise KeyError(name)


NAMES = ["whoosh", "pop", "tick", "riser", "alert", "ding", "stamp"]


def main():
    out = Path(sys.argv[1])
    for n in NAMES:
        write_wav(out / f"{n}.wav", render(n), SR)
    log(f"sfx: {len(NAMES)} effects written to {out}")


if __name__ == "__main__":
    main()
