"""Stage: voiceover generation with Kokoro (local ONNX, Apache-2.0 weights).

Generates one clip per beat, then joins them with short pauses. When the
storyboard has a target duration, the speaking rate is auto-fitted so the
narration lands inside it (one corrective pass).

usage: tts.py <storyboard.json> <out_dir> [--voice am_michael] [--speed 1.0]
writes: <out_dir>/beats/beat_NN.wav, <out_dir>/narration_raw.wav, <out_dir>/tts.json
"""
import argparse

import numpy as np

from common import MODELS, load_json, log, save_json, write_wav

GAP = 0.30   # pause between beats (s)
LEAD = 0.35  # silence before the first word (s)
TAIL = 1.6   # hold after the last word (s), the closing card needs it
MIN_SPEED, MAX_SPEED = 0.85, 1.12  # beyond this a narrator sounds rushed or sleepy


def synth_all(kokoro, beats, voice, speed):
    clips, sr = [], 24000
    for b in beats:
        samples, sr = kokoro.create(b["text"], voice=voice, speed=speed, lang="en-us")
        samples = trim_silence(np.asarray(samples, dtype=np.float32), sr)
        clips.append(samples)
    return clips, sr


def trim_silence(a, sr, thresh=0.01, pad=0.04):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(pad * sr))
    e = min(len(a), idx[-1] + int(pad * sr))
    return a[s:e]


def total_len(clips, sr, beats=None):
    pauses = sum(b.get("pauseAfter", 0) for b in beats or [])
    return LEAD + sum(len(c) for c in clips) / sr + GAP * (len(clips) - 1) + pauses


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("out_dir")
    ap.add_argument("--voice", default=None)
    ap.add_argument("--speed", type=float, default=None)
    args = ap.parse_args()

    from kokoro_onnx import Kokoro

    sb = load_json(args.storyboard)
    beats = sb["beats"]
    voice = args.voice or sb.get("voice") or "am_michael"
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    if voice not in kokoro.get_voices():
        raise SystemExit(f"Unknown Kokoro voice '{voice}'. Available: {', '.join(kokoro.get_voices())}")

    speed = args.speed or 1.0
    clips, sr = synth_all(kokoro, beats, voice, speed)
    target = sb.get("targetDuration")
    if target and not args.speed:
        # Kokoro's rate is not linear in `speed`, so refit iteratively.
        budget = target - TAIL
        for _ in range(3):
            got = total_len(clips, sr, beats)
            if abs(got - budget) <= 0.5:
                break
            fixed = LEAD + GAP * (len(clips) - 1) + sum(b.get("pauseAfter", 0) for b in beats)
            new_speed = float(np.clip(speed * (got - fixed) / max(budget - fixed, 1), MIN_SPEED, MAX_SPEED))
            if abs(new_speed - speed) < 0.005:
                break
            log(f"tts: {got:.2f}s vs budget {budget:.2f}s -> refit speed {speed:.3f} -> {new_speed:.3f}")
            speed = new_speed
            clips, sr = synth_all(kokoro, beats, voice, speed)
        got = total_len(clips, sr, beats)
        if abs(got - budget) > 1.5:
            log(f"tts: WARNING narration {got:.1f}s cannot meet {budget:.1f}s within natural speed range; shorten the script")

    out = []
    t = LEAD
    parts = [np.zeros(int(LEAD * sr), dtype=np.float32)]
    for b, c in zip(beats, clips):
        write_wav(f"{args.out_dir}/beats/beat_{b['id']:02d}.wav", c, sr)
        dur = len(c) / sr
        out.append({"id": b["id"], "start": round(t, 3), "end": round(t + dur, 3)})
        parts.append(c)
        gap = GAP + float(b.get("pauseAfter", 0))  # practice pauses are silent holds
        parts.append(np.zeros(int(gap * sr), dtype=np.float32))
        t += dur + gap
    narration = np.concatenate(parts[:-1])
    peak = np.max(np.abs(narration)) or 1.0
    narration = narration / peak * 0.89
    write_wav(f"{args.out_dir}/narration_raw.wav", narration, sr)
    meta = {
        "engine": "kokoro-onnx v1.0",
        "voice": voice,
        "speed": round(speed, 3),
        "sampleRate": sr,
        "lead": LEAD,
        "gap": GAP,
        "tail": TAIL,
        "speechEnd": out[-1]["end"],
        "duration": round(out[-1]["end"] + TAIL, 3),
        "beats": out,
    }
    save_json(f"{args.out_dir}/tts.json", meta)
    log(f"tts: voice={voice} speed={speed:.3f} narration={meta['speechEnd']:.2f}s total={meta['duration']:.2f}s")


if __name__ == "__main__":
    main()
