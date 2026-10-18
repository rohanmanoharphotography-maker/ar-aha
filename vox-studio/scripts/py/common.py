"""Shared helpers for the Python side of the pipeline."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "models"
SR = 48000  # mix sample rate


def load_json(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(p, data):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def log(*a):
    print("[py]", *a, file=sys.stderr, flush=True)


def ffmpeg(*args):
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)]
    subprocess.run(cmd, check=True)


def read_audio(path, sr=None):
    """Read any audio file as mono float32, optionally resampled with ffmpeg."""
    import numpy as np
    import soundfile as sf

    path = str(path)
    if sr is None:
        a, file_sr = sf.read(path, dtype="float32", always_2d=True)
        return a.mean(axis=1), file_sr
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32).copy(), sr


def write_wav(path, audio, sr):
    import soundfile as sf

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sr, subtype="PCM_24")


def env(name, default=None):
    return os.environ.get(name, default)
