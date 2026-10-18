"""QC: re-transcribe the *rendered* MP4's audio and measure subtitle sync.

Compares each caption word's start time with the time the recogniser hears
that word in the final file, after the full mix/encode chain.

usage: qc_sync.py <video.mp4> <captions.json> <out.json>
"""
import sys

import numpy as np

from align import ASR_SR, align_words, chunk_points, transcribe
from common import load_json, read_audio, save_json


def main():
    video, caps_path, out = sys.argv[1:4]
    audio, _ = read_audio(video, ASR_SR)
    asr = []
    for a, b in chunk_points(audio):
        words, _ = transcribe(audio[a:b], offset=a / ASR_SR)
        asr += words
    caps = load_json(caps_path)
    words = [w for g in caps for w in g["words"]]
    times, coverage, _ = align_words([w["text"] for w in words], asr)
    deltas = [abs(w["start"] - t[0]) for w, t in zip(words, times) if t[0] is not None]
    # caption group visibility must contain each word's spoken onset
    inside = 0
    total = 0
    for g in caps:
        for w in g["words"]:
            total += 1
            if g["start"] - 0.05 <= w["start"] <= g["end"]:
                inside += 1
    res = {
        "asrWords": len(asr),
        "captionWords": len(words),
        "matched": len(deltas),
        "coverage": round(coverage, 4),
        "medianOffset": round(float(np.median(deltas)), 3) if deltas else None,
        "p95Offset": round(float(np.percentile(deltas, 95)), 3) if deltas else None,
        "maxOffset": round(float(np.max(deltas)), 3) if deltas else None,
        "wordsInsideGroupWindow": round(inside / max(1, total), 4),
    }
    save_json(out, res)
    print(res)


if __name__ == "__main__":
    main()
