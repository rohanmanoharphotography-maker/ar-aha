"""Stage: narration mastering, SFX placement, ducked music, loudness.

The narration chain follows the documentary mastering notes in
jaredcassoutt/vox-editorial (MIT): HPF 85 Hz, -2 dB @ 350 Hz, +2.5 dB @ 3 kHz,
-3 dB @ 6.8 kHz de-ess, 3:1 compression, -16 LUFS integrated.

The music level is set from the measured separation above 250 Hz (what a phone
speaker reproduces), targeting ~20 dB under the voice while it speaks, then
side-chain ducked so it swells back in the gaps.

usage: mix.py <narration> <music.wav> <sfx_plan.json> <out_dir> --duration 45.3
writes: voice_master.wav, music_ducked.wav, sfx.wav, mix.wav, mix.json
"""
import argparse
import json
import subprocess

import numpy as np

from common import SR, ffmpeg, load_json, log, read_audio, save_json, write_wav
from sfx import render

TARGET_SEP_DB = 20.0


def highpass_fft(x, fc=250.0):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec[f < fc] = 0
    return np.fft.irfft(spec, n=len(x))


def envelope(x, attack=0.03, release=0.35):
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(x**2, np.ones(win) / win, mode="same"))
    env = np.zeros_like(rms)
    a, r = np.exp(-1 / (attack * SR / win)), np.exp(-1 / (release * SR / win))
    # run the follower on a decimated signal for speed, then upsample
    dec = rms[::win]
    out = np.zeros_like(dec)
    lvl = 0.0
    for i, v in enumerate(dec):
        c = a if v > lvl else r
        lvl = c * lvl + (1 - c) * v
        out[i] = lvl
    env = np.interp(np.arange(len(x)), np.arange(len(dec)) * win, out)
    return env


def db(x):
    return 20 * np.log10(max(float(np.sqrt(np.mean(x**2))), 1e-9))


def loudnorm(src, dst, target=-16.0):
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", src, "-af", f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    txt = p.stderr[p.stderr.rindex("{") : p.stderr.rindex("}") + 1]
    m = json.loads(txt)
    af = (
        f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
        f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    )
    ffmpeg("-i", src, "-af", af, "-ar", SR, "-ac", 2, "-c:a", "pcm_s24le", dst)
    return float(m["input_i"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("narration")
    ap.add_argument("music")
    ap.add_argument("sfx_plan")
    ap.add_argument("out_dir")
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--no-master", action="store_true", help="keep a supplied recording untouched apart from loudness")
    args = ap.parse_args()
    out = args.out_dir

    vm = f"{out}/voice_master.wav"
    if args.no_master:
        ffmpeg("-i", args.narration, "-ac", 1, "-ar", SR, vm)
    else:
        chain = (
            "highpass=f=85,equalizer=f=350:t=q:w=1.0:g=-2,equalizer=f=3000:t=q:w=1.0:g=2.5,"
            "equalizer=f=6800:t=q:w=2.0:g=-3,acompressor=threshold=0.125:ratio=3:attack=8:release=120:makeup=1.6"
        )
        ffmpeg("-i", args.narration, "-af", chain, "-ac", 1, "-ar", SR, vm)

    n = int(args.duration * SR)
    voice, _ = read_audio(vm, SR)
    music, _ = read_audio(args.music, SR)
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    music = np.pad(music, (0, max(0, n - len(music))))[:n]

    env = envelope(voice)
    speaking = env > (np.max(env) * 0.12)
    duck = 1.0 - 0.5 * np.clip(env / (np.percentile(env[speaking], 60) if speaking.any() else 1), 0, 1)  # up to ~-6 dB

    v_hp = highpass_fft(voice)
    m_hp = highpass_fft(music * duck)
    sep = db(v_hp[speaking]) - db(m_hp[speaking])
    gain_db = sep - TARGET_SEP_DB
    music_out = music * duck * (10 ** (gain_db / 20))
    final_sep = db(v_hp[speaking]) - db(highpass_fft(music_out)[speaking])

    sfx_bus = np.zeros(n, dtype=np.float32)
    plan = load_json(args.sfx_plan) if args.sfx_plan != "-" else []
    cache = {}
    for ev in plan:
        name = ev["name"]
        if name not in cache:
            cache[name] = render(name)
        sig = cache[name] * float(ev.get("gain", 1.0))
        s = int(max(0, ev["t"]) * SR)
        e = min(n, s + len(sig))
        if s < n:
            sfx_bus[s:e] += sig[: e - s]
    # keep the effects ~10 dB under the voice peak level
    sfx_bus *= 0.55

    mix = voice + music_out + sfx_bus
    peak = np.max(np.abs(mix)) or 1
    if peak > 0.98:
        mix = mix / peak * 0.98
    write_wav(f"{out}/music_ducked.wav", music_out.astype(np.float32), SR)
    write_wav(f"{out}/sfx.wav", sfx_bus, SR)
    write_wav(f"{out}/premix.wav", mix.astype(np.float32), SR)
    measured = loudnorm(f"{out}/premix.wav", f"{out}/mix.wav")
    info = {
        "duration": args.duration,
        "musicGainDb": round(gain_db, 2),
        "voiceOverMusicAbove250HzDb": round(final_sep, 2),
        "premixLufs": measured,
        "targetLufs": -16,
        "sfxEvents": len(plan),
    }
    save_json(f"{out}/mix.json", info)
    log(f"mix: music gain {gain_db:+.1f} dB, separation >250Hz {final_sep:.1f} dB, {len(plan)} sfx, loudnorm -16 LUFS")


if __name__ == "__main__":
    main()
