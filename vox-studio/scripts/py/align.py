"""Stage: speech alignment + subtitles.

Transcribes narration with NVIDIA Parakeet-TDT 0.6B v2 (int8, via sherpa-onnx,
CC-BY-4.0 weights) to get token timestamps, aligns them to the script words and
writes word-level timing, caption groups and an SRT.

Two modes:
  * TTS mode   – tts.json lists per-beat clip windows; each beat is aligned inside
                 its own window (robust, exact beat boundaries).
  * voice mode – a supplied recording; the whole file is transcribed and beat
                 boundaries are recovered from the alignment.

usage: align.py <storyboard.json> <audio.wav> <out_dir> [--tts tts.json]
writes: <out_dir>/timing.json, <out_dir>/captions.json, <out_dir>/subtitles.srt, <out_dir>/transcript.txt
"""
import argparse
import difflib
import re

import numpy as np

from common import MODELS, load_json, log, read_audio, save_json

ASR_SR = 16000
_UNITS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
_TENS = "twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_words(n):
    """Spoken English for a non-negative integer (to the millions)."""
    n = int(n)
    if n < 20:
        return [_UNITS[n]]
    if n < 100:
        t, u = divmod(n, 10)
        return [_TENS[t - 2]] + ([_UNITS[u]] if u else [])
    if n < 1000:
        h, r = divmod(n, 100)
        return [_UNITS[h], "hundred"] + (["and"] + num_words(r) if r else [])
    if n < 1_000_000:
        th, r = divmod(n, 1000)
        return num_words(th) + ["thousand"] + ((["and"] if r < 100 else []) + num_words(r) if r else [])
    m, r = divmod(n, 1_000_000)
    return num_words(m) + ["million"] + (num_words(r) if r else [])


# US spellings / ASR shorthands → script forms
_SPELL = {"meters": "metres", "meter": "metre", "centimeters": "centimetres", "centimeter": "centimetre",
          "kilometers": "kilometres", "traveling": "travelling", "mv": ["m", "v"], "kg": ["kilograms"],
          "colour": "color", "colours": "colors"}


def norm_tokens(word):
    """Normalise a word for matching; numbers (incl. decimals, 10,000, 2kg) expand to their spoken form."""
    w = word.lower().replace("’", "'").replace("-", " ")
    out = []
    for part in w.split():
        part = re.sub(r"[^a-z0-9'%°.,]", "", part).strip(".,")
        m = re.fullmatch(r"(\d[\d,]*)(?:\.(\d+))?([a-z]*)", part)
        if m:
            out += num_words(m.group(1).replace(",", ""))
            if m.group(2):
                out += ["point"] + [_UNITS[int(d)] for d in m.group(2)]
            if m.group(3):
                sp = _SPELL.get(m.group(3), m.group(3))
                out += sp if isinstance(sp, list) else [sp]
            continue
        part = part.replace(".", "").replace(",", "")
        if not part:
            continue
        sp = _SPELL.get(part, part)
        out += sp if isinstance(sp, list) else [sp]
    return out


_recognizer = None


def recognizer():
    global _recognizer
    if _recognizer is None:
        import sherpa_onnx

        d = MODELS / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"
        _recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=str(d / "encoder.int8.onnx"),
            decoder=str(d / "decoder.int8.onnx"),
            joiner=str(d / "joiner.int8.onnx"),
            tokens=str(d / "tokens.txt"),
            model_type="nemo_transducer",
            num_threads=4,
        )
    return _recognizer


def transcribe(audio, offset=0.0):
    """Return [(word, start, end)] with absolute times."""
    r = recognizer()
    s = r.create_stream()
    s.accept_waveform(ASR_SR, audio)
    r.decode_stream(s)
    toks, ts = s.result.tokens, s.result.timestamps
    words = []
    def glued_number(tok):
        # the recogniser emits digits without a leading space ("at400", "kilograms.10");
        # start a new word unless the digit continues a number ("2." + "01")
        if not words or not tok[:1].isdigit():
            return False
        prev = words[-1][0]
        return not (prev[-1:].isdigit() or (prev.endswith(".") and prev[-2:-1].isdigit()) or prev.endswith(","))

    for tok, t in zip(toks, ts):
        if tok.startswith(" ") or not words or glued_number(tok):
            if tok.strip() == "":
                continue
            words.append([tok.strip(), t + offset, None])
        else:
            words[-1][0] += tok
    dur = len(audio) / ASR_SR
    for i, w in enumerate(words):
        nxt = words[i + 1][1] if i + 1 < len(words) else offset + dur
        w[2] = min(nxt, w[1] + 0.9)
    return [tuple(w) for w in words], s.result.text.strip()


def chunk_points(audio, max_len=22.0):
    """Split long audio at quiet points so the recogniser sees <= max_len s."""
    n = len(audio)
    hop = int(0.02 * ASR_SR)
    env = np.sqrt(np.convolve(audio**2, np.ones(hop) / hop, mode="same"))
    cuts, start = [0], 0
    while n - start > max_len * ASR_SR:
        lo, hi = start + int((max_len - 6) * ASR_SR), start + int(max_len * ASR_SR)
        cut = lo + int(np.argmin(env[lo:hi]))
        cuts.append(cut)
        start = cut
    cuts.append(n)
    return list(zip(cuts[:-1], cuts[1:]))


def align_words(script_words, asr_words):
    """Map every script word to a (start, end) using the ASR word times."""
    s_norm, s_owner = [], []
    for i, w in enumerate(script_words):
        for t in norm_tokens(w):
            s_norm.append(t)
            s_owner.append(i)
    a_norm, a_owner = [], []
    for j, (w, _, _) in enumerate(asr_words):
        for t in norm_tokens(w):
            a_norm.append(t)
            a_owner.append(j)
    sm = difflib.SequenceMatcher(a=s_norm, b=a_norm, autojunk=False)
    times = [[None, None] for _ in script_words]
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            si, aj = s_owner[blk.a + k], a_owner[blk.b + k]
            st, en = asr_words[aj][1], asr_words[aj][2]
            if times[si][0] is None or st < times[si][0]:
                times[si][0] = st
            if times[si][1] is None or en > times[si][1]:
                times[si][1] = en
    matched = sum(1 for t in times if t[0] is not None)
    return times, matched / max(1, len(script_words)), sm.ratio()


def fill_gaps(times, lo, hi):
    """Interpolate unmatched words between matched neighbours (by position)."""
    n = len(times)
    known = [i for i, t in enumerate(times) if t[0] is not None]
    if not known:
        step = (hi - lo) / max(n, 1)
        return [[lo + i * step, lo + (i + 1) * step] for i in range(n)]
    out = [list(t) for t in times]
    anchors = [(-1, lo)] + [(i, times[i][0]) for i in known] + [(n, hi)]
    for (ia, ta), (ib, tb) in zip(anchors[:-1], anchors[1:]):
        gap = ib - ia - 1
        if gap <= 0:
            continue
        a_end = out[ia][1] if ia >= 0 else ta
        step = max(0.05, (tb - a_end) / (gap + 1))
        for g in range(gap):
            k = ia + 1 + g
            out[k] = [a_end + g * step, a_end + (g + 1) * step]
    for i in range(n - 1):  # no overlaps, end before next start
        out[i][1] = min(out[i][1], out[i + 1][0]) if out[i + 1][0] > out[i][0] else out[i][1]
    return out


def split_words(text):
    return [w for w in re.split(r"\s+", text.strip()) if w]


def keyword_mask(words, keywords):
    norm = [re.sub(r"[^a-z0-9°]", "", w.lower()) for w in words]
    mask = [False] * len(words)
    for kw in keywords or []:
        k = [re.sub(r"[^a-z0-9°]", "", x.lower()) for x in kw.split()]
        k = [x for x in k if x]
        for i in range(len(norm) - len(k) + 1):
            if norm[i : i + len(k)] == k:
                for j in range(i, i + len(k)):
                    mask[j] = True
    return mask


def caption_groups(words, max_words=3, max_chars=18):
    """2–3 word groups that break on punctuation, never across beats."""
    groups, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x["text"] for x in cur)
        punct = re.search(r"[.,:;!?—]$", w["text"])
        if punct or len(cur) >= max_words or len(text) >= max_chars or w.get("lastInBeat"):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    # merge dangling single words into the previous group when it fits
    merged = []
    for g in groups:
        if (
            merged
            and len(g) == 1
            and not merged[-1][-1].get("lastInBeat")
            and len(merged[-1]) < max_words + 1
            and not re.search(r"[.!?]$", merged[-1][-1]["text"])
            and len(" ".join(x["text"] for x in merged[-1] + g)) <= max_chars + 4
        ):
            merged[-1] = merged[-1] + g
        else:
            merged.append(g)
    out = []
    for i, g in enumerate(merged):
        start = g[0]["start"]
        end = g[-1]["end"]
        nxt = merged[i + 1][0]["start"] if i + 1 < len(merged) else end + 0.6
        end = min(max(end + 0.15, start + 0.6), nxt)  # hold briefly, never overlap
        out.append(
            {
                "start": round(start, 3),
                "end": round(end, 3),
                "words": [{"text": x["text"], "highlight": x["highlight"], "start": x["start"], "end": x["end"]} for x in g],
            }
        )
    return out


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(path, groups):
    lines = []
    for i, g in enumerate(groups, 1):
        text = " ".join(w["text"] for w in g["words"])
        lines += [str(i), f"{srt_time(g['start'])} --> {srt_time(g['end'])}", text, ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("audio")
    ap.add_argument("out_dir")
    ap.add_argument("--tts", default=None)
    ap.add_argument("--tail", type=float, default=1.6)
    args = ap.parse_args()

    sb = load_json(args.storyboard)
    audio, _ = read_audio(args.audio, ASR_SR)
    total = len(audio) / ASR_SR
    beats_out, all_words, transcript = [], [], []
    match_scores = []

    if args.tts:
        tts = load_json(args.tts)
        win = {b["id"]: b for b in tts["beats"]}
        for b in sb["beats"]:
            w = win[b["id"]]
            s0, s1 = max(0, w["start"] - 0.05), min(total, w["end"] + 0.05)
            seg = audio[int(s0 * ASR_SR) : int(s1 * ASR_SR)]
            asr, text = transcribe(seg, offset=s0)
            transcript.append(text)
            sw = split_words(b["text"])
            times, cover, ratio = align_words(sw, asr)
            times = fill_gaps(times, w["start"], w["end"])
            times[-1][1] = max(times[-1][1], w["end"] - 0.02)
            times[-1][1] = min(times[-1][1], w["end"])
            match_scores.append(cover)
            beats_out.append({"id": b["id"], "start": w["start"], "end": w["end"], "text": b["text"]})
            for i, (word, (st, en)) in enumerate(zip(sw, times)):
                all_words.append({"text": word, "beat": b["id"], "start": round(st, 3), "end": round(en, 3), "lastInBeat": i == len(sw) - 1})
        speech_end = beats_out[-1]["end"]
        duration = max(total, tts.get("duration", total))
    else:
        asr = []
        for a, b in chunk_points(audio):
            words, text = transcribe(audio[a:b], offset=a / ASR_SR)
            asr += words
            transcript.append(text)
        sw_all, owner = [], []
        for b in sb["beats"]:
            for w in split_words(b["text"]):
                sw_all.append(w)
                owner.append(b["id"])
        times, cover, ratio = align_words(sw_all, asr)
        first = asr[0][1] if asr else 0.0
        last = asr[-1][2] if asr else total
        times = fill_gaps(times, first, last)
        match_scores.append(cover)
        for b in sb["beats"]:
            idx = [i for i, o in enumerate(owner) if o == b["id"]]
            beats_out.append({"id": b["id"], "start": round(times[idx[0]][0], 3), "end": round(times[idx[-1]][1], 3), "text": b["text"]})
            for k, i in enumerate(idx):
                all_words.append({"text": sw_all[i], "beat": b["id"], "start": round(times[i][0], 3), "end": round(times[i][1], 3), "lastInBeat": k == len(idx) - 1})
        speech_end = beats_out[-1]["end"]
        duration = max(total, speech_end + args.tail)

    mask = keyword_mask([w["text"] for w in all_words], sb.get("keywords"))
    for w, m in zip(all_words, mask):
        w["highlight"] = m

    coverage = float(np.mean(match_scores)) if match_scores else 0.0
    timing = {
        "duration": round(duration, 3),
        "speechEnd": round(speech_end, 3),
        "alignment": {"engine": "parakeet-tdt-0.6b-v2-int8 (sherpa-onnx)", "wordCoverage": round(coverage, 4)},
        "beats": beats_out,
        "words": all_words,
    }
    groups = caption_groups(all_words)
    save_json(f"{args.out_dir}/timing.json", timing)
    save_json(f"{args.out_dir}/captions.json", groups)
    write_srt(f"{args.out_dir}/subtitles.srt", groups)
    with open(f"{args.out_dir}/transcript.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(transcript) + "\n")
    log(f"align: {len(all_words)} words, {len(groups)} caption groups, ASR word coverage {coverage:.1%}")
    if coverage < 0.85:
        log("align: WARNING low ASR coverage — narration may not match the script")


if __name__ == "__main__":
    main()
