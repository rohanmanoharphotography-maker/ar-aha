"""Stage (optional): research-free scriptwriting from a topic with Claude.

Only runs when Anthropic credentials are configured (ANTHROPIC_API_KEY or an
`ant auth login` profile) and the `anthropic` package is installed. Produces a
storyboard.json using only the generic scene templates, with every factual
claim listed under `sources` for human fact-checking. The model is asked not
to state statistics it cannot attribute.

usage: write_storyboard.py --topic "..." --duration 45 --out storyboard.json [--audience ...]
"""
import argparse
import json
import re
import sys

from common import log, save_json

MODEL = "claude-opus-5-5"

SYSTEM = """You write scripts and storyboards for short, premium editorial explainer videos
(narrated, motion-graphics, Vox-inspired but original). Rules:
- Medically/scientifically accurate. Never invent statistics. Only use a number if it is a widely
  established fact you can attribute to a named authoritative source; otherwise speak qualitatively.
- Hook first: beat 1 states something surprising; the final beat pays it off.
- 8-11 beats, one idea per beat, about 2.6 spoken words per second of target duration in total.
- Plain spoken English, no lists, no stage directions inside narration.
Return ONLY a JSON object, no prose, matching this shape:
{"title": str, "slug": str (kebab-case), "topic": str, "voice": "am_michael",
 "keywords": [short phrases from the narration to highlight in captions],
 "beats": [{"id": int, "text": str}],
 "scenes": [{"id": str, "type": one of "title"|"kinetic"|"stat"|"timeline"|"image",
             "beats": [beat ids], "props": {...}}],
 "sources": [{"claim": str, "source": str, "url": str}]}
Scene props: title -> {"kicker", "lines": [<=3 short uppercase lines], "highlight": one word, "icon"?};
kinetic -> {"kicker", "icon"?}; stat -> {"kicker", "value": number, "suffix"?, "label", "source"};
timeline -> {"kicker", "title", "items": [{"label", "sub"?}]}; image -> {"kicker", "icon"}.
Allowed icons: vial, fridge, truck, box, logger, factory, warehouse, clinic, pharmacy, sun, snowflake, syringe, arm.
Use cues sparingly: props.cues maps a cue name ("title", "value", "start", "end") to a single word spoken in that scene."""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True)
    ap.add_argument("--duration", type=float, default=45)
    ap.add_argument("--audience", default="General public")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    try:
        import anthropic
    except ImportError:
        sys.exit("write_storyboard: the `anthropic` package is not installed (pip install anthropic)")

    client = anthropic.Anthropic()
    prompt = f"Topic: {args.topic}\nAudience: {args.audience}\nTarget duration: {args.duration:.0f} seconds."
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "high"},
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    if response.stop_reason == "refusal":
        sys.exit(f"write_storyboard: request declined ({getattr(response.stop_details, 'category', None)})")
    text = "".join(b.text for b in response.content if b.type == "text")
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        sys.exit("write_storyboard: model did not return JSON")
    sb = json.loads(m.group(0))
    for key in ("beats", "scenes"):
        if not sb.get(key):
            sys.exit(f"write_storyboard: storyboard missing '{key}'")
    sb.setdefault("targetDuration", args.duration)
    sb.setdefault("audience", args.audience)
    sb["generatedBy"] = MODEL
    save_json(args.out, sb)
    log(f"write_storyboard: {len(sb['beats'])} beats, {len(sb['scenes'])} scenes -> {args.out}")


if __name__ == "__main__":
    main()
