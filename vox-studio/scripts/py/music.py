"""Stage: original procedural music bed (additive synthesis, no samples).

A restrained documentary cue: i–VI–III–VII in D minor at 96 BPM, a soft pulse,
a sub, a warm pad and a quiet marimba-like arpeggio. Every part keeps a floor
from the first second, so the opening never reads as "no music". Everything is
synthesised here, so the bed is royalty-free and commercially usable.

usage: music.py <out.wav> --seconds 45 [--bpm 96] [--seed 3]
"""
import argparse

import numpy as np

from common import SR, log, write_wav

A4 = 440.0
NOTE = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "Bb": 1, "B": 2}


def hz(name, octave):
    return A4 * 2 ** ((NOTE[name] + 12 * (octave - 4)) / 12)


# (root, chord tones as (name, octave)) — Dm, Bb, F, C
PROGRESSION = [
    ("D", [("D", 3), ("F", 3), ("A", 3), ("D", 4)]),
    ("Bb", [("Bb", 2), ("D", 3), ("F", 3), ("Bb", 3)]),
    ("F", [("F", 3), ("A", 3), ("C", 4), ("F", 4)]),
    ("C", [("C", 3), ("E", 3), ("G", 3), ("C", 4)]),
]


def adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    env = np.full(n, s, dtype=np.float32)
    a = min(a, n)
    env[:a] = np.linspace(0, 1, a, dtype=np.float32)
    d = min(d, n - a)
    env[a : a + d] = np.linspace(1, s, d, dtype=np.float32)
    r = min(r, n)
    env[n - r :] *= np.linspace(1, 0, r, dtype=np.float32)
    return env


def additive(freq, n, harmonics, rolloff=1.0, detune=0.0, rng=None, sr=SR):
    t = np.arange(n, dtype=np.float32) / sr
    out = np.zeros(n, dtype=np.float32)
    for h in range(1, harmonics + 1):
        f = freq * h
        if f > sr / 2.2:
            break
        ph = rng.random() * 2 * np.pi if rng is not None else 0.0
        out += np.sin(2 * np.pi * f * (1 + detune) * t + ph) / h**rolloff
    return out


def place(buf, sig, start):
    s = int(start * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--seconds", type=float, required=True)
    ap.add_argument("--bpm", type=float, default=96)
    ap.add_argument("--seed", type=int, default=3)
    args = ap.parse_args()
    rng = np.random.default_rng(args.seed)

    total = args.seconds + 1.5
    n = int(total * SR)
    beat = 60 / args.bpm
    bar = 4 * beat
    pad, sub, pulse, arp, hat = (np.zeros(n, dtype=np.float32) for _ in range(5))

    # arrangement curves (0..1) over absolute time, floors keep every part present
    tt = np.arange(n) / SR
    frac = tt / args.seconds

    def curve(points):
        xs, ys = zip(*points)
        return np.interp(frac, xs, ys).astype(np.float32)

    k = 0
    t = 0.0
    while t < total:
        root, tones = PROGRESSION[k % len(PROGRESSION)]
        length = 2 * bar
        m = int(length * SR) + int(1.2 * SR)
        # pad: two detuned additive voices per tone, slow attack
        for name, octv in tones:
            f = hz(name, octv)
            v = additive(f, m, 10, rolloff=1.4, detune=0.0025, rng=rng) + additive(f, m, 10, rolloff=1.4, detune=-0.0025, rng=rng)
            place(pad, v * adsr(m, 0.9, 0.5, 0.75, 1.4) * 0.06, t)
        # sub: root, whole-note pulses
        for b in range(2):
            m2 = int(bar * SR)
            s = additive(hz(root, 1 if NOTE[root] > -5 else 2), m2, 2, rolloff=2.0)
            place(sub, s * adsr(m2, 0.04, 0.4, 0.6, 0.5) * 0.22, t + b * bar)
        # arpeggio: 8th notes through the chord, marimba-ish (sine + 4th partial, fast decay)
        seq = [0, 1, 2, 3, 2, 1, 2, 3]
        for i in range(16):
            name, octv = tones[seq[i % 8]]
            f = hz(name, octv + 1)
            m3 = int(0.45 * SR)
            tn = np.arange(m3) / SR
            tone = np.sin(2 * np.pi * f * tn) + 0.25 * np.sin(2 * np.pi * f * 4 * tn) * np.exp(-tn * 30)
            tone *= np.exp(-tn * 9) * (0.9 + 0.2 * rng.random())
            place(arp, tone.astype(np.float32) * (0.05 if i % 2 == 0 else 0.035), t + i * beat / 2)
        # pulse: soft kick on every beat, hat on offbeats
        for i in range(8):
            m4 = int(0.32 * SR)
            tn = np.arange(m4) / SR
            fsw = 46 + 70 * np.exp(-tn * 28)
            kick = np.sin(2 * np.pi * np.cumsum(fsw) / SR) * np.exp(-tn * 11)
            place(pulse, kick.astype(np.float32) * 0.32, t + i * beat)
            m5 = int(0.05 * SR)
            noise = rng.normal(0, 1, m5).astype(np.float32)
            noise = np.diff(noise, prepend=0)  # crude high-pass
            place(hat, noise * np.exp(-np.arange(m5) / SR * 90).astype(np.float32) * 0.012, t + i * beat + beat / 2)
        t += length
        k += 1

    mix = (
        pad * curve([(0, 0.7), (0.15, 1.0), (0.85, 1.0), (1.0, 1.15)])
        + sub * curve([(0, 0.55), (0.2, 1.0), (1.0, 1.0)])
        + pulse * curve([(0, 0.45), (0.12, 0.9), (0.5, 1.0), (0.93, 1.0), (1.0, 0.0)])
        + hat * curve([(0, 0.0), (0.2, 0.8), (0.9, 1.0), (1.0, 0.0)])
        + arp * curve([(0, 0.6), (0.15, 1.0), (0.9, 1.0), (1.0, 0.5)])
    )
    # simple stereo-free bus: soft clip + fade out over the last 2.5s
    fade = np.clip((total - tt) / 2.5, 0, 1).astype(np.float32)
    fade_in = np.clip(tt / 0.4, 0, 1).astype(np.float32)
    mix = np.tanh(mix * 1.4) / 1.4 * fade * fade_in
    mix = mix[: int(args.seconds * SR)]
    mix = mix / (np.max(np.abs(mix)) or 1) * 0.8
    write_wav(args.out, mix, SR)
    log(f"music: {args.seconds:.2f}s bed written to {args.out}")


if __name__ == "__main__":
    main()
