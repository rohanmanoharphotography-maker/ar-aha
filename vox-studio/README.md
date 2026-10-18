# vox-studio

An automated production system that turns a **topic, a script, or an existing voiceover** into a finished, quality-checked editorial explainer video. The look is premium, paper-textured motion graphics in the spirit of Vox-style documentary explainers. It is original: no Vox branding, footage or assets.

Everything you see is drawn by code (React/SVG in [Remotion](https://remotion.dev)). Narration, alignment, music and sound effects are produced locally, and no paid API is required.

```
topic / script / voiceover
   → storyboard (hand-directed pack · Claude-written · or auto)
   → Kokoro TTS narration (auto-fitted to the target duration)
   → Parakeet ASR alignment → word timings → captions + SRT
   → scene plan (every cue lands on a spoken word)
   → original synthesised music + SFX → ducked mix → −16 LUFS
   → Remotion render → delivery encode (H.264 High / yuv420p BT.709 / AAC)
   → automatic QC (ffprobe, decode, black/freeze/silence, loudness, ASR subtitle-sync, contact sheet)
```

Demo: [`output/cold-chain/final-video.mp4`](output/cold-chain/final-video.mp4). It is a 45 s, 1080×1920 explainer on how vaccines are kept safe through the cold chain.

## Setup

Requirements: Node 18+, Python 3.10+, FFmpeg. Chromium is auto-detected; otherwise Remotion downloads one.

```bash
npm install
npm run setup          # creates .venv, installs Python deps, downloads ~1 GB of local models from GitHub releases
npm run setup -- --check   # doctor only
```

## Usage

```bash
# From a topic. Uses a storyboard pack in input/ if one matches, otherwise Claude writes one (needs ANTHROPIC_API_KEY)
npm run make-video -- --topic "How vaccines stay safe" --duration 60 --format vertical --style editorial --output output/final-video.mp4

# From an existing script (one beat per line, or prose split by sentence)
npm run make-video -- --script input/script.txt --duration 45 --format vertical

# From an existing script + recorded voiceover (the recording is preserved; video is synced to it)
npm run make-video -- --script input/script.txt --voice input/narration.wav --format vertical
```

| Flag | Meaning |
|---|---|
| `--topic "<text>"` | Topic. Matched against `input/*/storyboard.json` packs, else LLM-written |
| `--script <file>` | Script text. A `storyboard.json` next to it with the same beats is used; otherwise an auto-storyboard is built |
| `--storyboard <file>` | Use a hand-directed storyboard directly |
| `--voice <file>` | Supplied narration (wav/mp3/m4a…). Skips TTS; ASR recovers beat and word timing |
| `--duration <s>` | Target length. TTS rate is auto-fitted (0.85–1.12×); QC checks ±6% |
| `--format` | `vertical` 1080×1920 (default) · `landscape` 1920×1080 · `portrait` 1080×1350 (also `9:16`, `16:9`, `4:5`) |
| `--style` | `editorial` (the only style currently implemented) |
| `--voice-name` | Kokoro voice id (default `am_michael`; e.g. `bm_george`, `af_heart`) |
| `--output <file>` | Final MP4 path (default `output/<slug>/final-video.mp4`) |
| `--no-captions` | Don't burn captions (the SRT is still written) |
| `--reuse-audio` | Keep the existing narration; rebuild everything else |
| `--skip-render` | Stop after the plan and mix (fast iteration) |
| `--keep-master` | Keep the lossless-ish Remotion master next to the delivery file |
| `--crf <n>` | Delivery encode quality (default 21, max-rate 12 Mbps) |

Other commands:

```bash
npm run studio                                  # Remotion Studio on the last built video (live preview and tuning)
npm run stills -- output/cold-chain/plan.json   # one still per scene + contact sheet, without a full render
npm run qc -- output/cold-chain/final-video.mp4 output/cold-chain/plan.json
npm run typecheck
```

## What each stage writes

| Stage | Artefacts |
|---|---|
| Storyboard | `output/<slug>/storyboard.json`, `script.txt`, `sources.md` (fact-check list) |
| Voiceover | `audio/<slug>/narration_raw.wav`, `tts.json` (voice, rate, beat windows) |
| Alignment | `audio/<slug>/timing.json` (per-word times), `captions.json`, `transcript.txt`, `subtitles/<slug>/subtitles.srt` |
| Plan | `output/<slug>/plan.json` (the exact Remotion props), `audio/<slug>/sfx_plan.json`, `src/generated/current.json` |
| Audio | `audio/<slug>/music.wav`, `music_ducked.wav`, `sfx.wav`, `voice_master.wav`, `mix.wav`, `mix.json`; `output/<slug>/narration.wav` |
| Render | `output/<slug>/final-video.mp4` |
| QC | `output/<slug>/qc-report.json`, `qc-subtitle-sync.json`, `contact-sheet.jpg`, `thumbnail.jpg`, `qc/*.png` |
| Report | `output/<slug>/production-report.md` / `.json` |

## Project layout

```
src/
  Root.tsx                     composition registry (props-driven; calculateMetadata sets size/length)
  compositions/Explainer.tsx   scene sequencing, torn-paper transitions, grain, captions, audio
  components/                  reusable building blocks
    Typography.tsx               AnimatedTitle, KineticText, Counter, Marker (highlighter), Kicker, Stamp
    Charts.tsx                   LineChart (band/threshold/live dot), BarChart, Meter
    ImageReveal.tsx              editorial collage card: torn mask reveal, paper-cut stroke, halftone
    Camera.tsx                   documentary camera (push/drift/punch) + ParallaxLayer
    MapRoute.tsx                 stylised map, route draw-on, stop pins, riding marker
    Timeline.tsx                 horizontal/vertical progress with checkmarks
    Subtitles.tsx                editorial burned-in captions
    Paper.tsx                    paper background, halftone fields, film grain, vignette
  scenes/                      scene templates (storyboard `type` → component, see scenes/index.ts)
    hook range split route travel logger indicator fridge excursion closer   (directed)
    title kinetic stat image chart timeline map                             (generic / auto-storyboard)
  illustrations/               code-drawn paper-cut SVG art (vial, thermometer, fridge, truck, …)
  animations/motion.ts         springs, draw-on, torn edges, easing helpers
  lib/                         theme tokens, layout/safe-areas, schema/types, fonts
scripts/
  make-video.mjs               the CLI / orchestrator
  qc.mjs  stills.mjs  setup.mjs
  lib/plan.mjs                 storyboard × timing → frames; SFX cue sheet
  lib/storyboard.mjs           topic packs, auto-storyboard from a script
  py/                          tts.py align.py textures.py music.py sfx.py mix.py qc_sync.py write_storyboard.py
input/<slug>/storyboard.json   hand-directed storyboard packs
assets/                        Remotion public dir: textures/, sfx/, build/ (staged mix)
```

### Storyboard format

```jsonc
{
  "slug": "cold-chain", "title": "The Cold Chain", "targetDuration": 45, "voice": "am_michael",
  "keywords": ["two", "eight", "cold chain"],          // caption highlights (yellow)
  "beats": [{ "id": 1, "text": "One spoken sentence or clause." }],
  "scenes": [{
    "id": "range", "type": "range", "beats": [2],
    "props": { "min": 2, "max": 8, "unit": "°C", "cues": { "min": "two", "max": "eight" } }
  }],
  "sources": [{ "claim": "...", "source": "...", "url": "..." }]
}
```

`cues` name the **spoken word** each animation lands on. Frame numbers are never typed by hand, so re-voicing or changing the rate retimes everything automatically.

## Design system

- **Palette:** paper `#ECE6D9`, ink `#151515`, cold blue `#1F5FD1`, ice `#9FCBEA`, warning red `#E04329`, highlighter `#F7C948`. There is no other colour.
- **Type:** Inter (a Helvetica-like grotesque) for headlines and captions, Playfair Display italic for editorial asides, IBM Plex Mono for labels and data. All OFL and bundled via Fontsource.
- **Motion:** elements spring up, they don't fade. Entrances are staggered. Charts and routes draw on. Every scene has a slow camera push and drift, plus parallax layers. Transitions are a torn paper sheet rising over the previous scene.
- **Texture:** procedural paper, drifting halftone fields, animated film grain and vignette. Every illustration is "paper-cut" with an offset colour silhouette and a soft drop shadow.
- **Safe areas (9:16):** the top 190 px, bottom 560 px and side margins are kept clear for platform UI. Captions sit in the band above the bottom UI. Scenes are composed on a 1000×1160 stage that scales into the safe area of every format.

## Credits and licences

| Component | Source | Licence |
|---|---|---|
| Remotion | remotion.dev | [Remotion licence](https://remotion.dev/license): free for individuals, non-profits and companies of up to 3 people; larger companies need a company licence |
| Kokoro-82M (TTS) | hexgrad / thewh1teagle/kokoro-onnx | Apache-2.0 |
| Parakeet-TDT 0.6B v2 (ASR) | NVIDIA via k2-fsa/sherpa-onnx | CC-BY-4.0 |
| Inter, Playfair Display, IBM Plex Mono | Fontsource | SIL OFL 1.1 |
| Music, SFX, textures, illustrations | generated by this project's code | original; yours to use |

Techniques adapted from the reviewed reference skills:

- [jaredcassoutt/vox-editorial](https://github.com/jaredcassoutt/vox-editorial) (MIT): the locked visual system, layer model, spring entrances, word-cued timing, narration mastering chain, >250 Hz music-separation rule, stills-before-render QC and vertical safe zones.
- [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) (MIT): reviewed for motion vocabulary; no code was copied.
- [CK42BB/vox-explainer-skill](https://github.com/CK42BB/vox-explainer-skill) (MIT): its pipeline needs a paid Atlas Cloud API, so it was not used.
- [santmun/video-vox](https://github.com/santmun/video-vox): it has no licence file, so none of its code or SFX are included. It also depends on paid Kie.ai and ElevenLabs keys.

## Known limitations

- **Topic → script** without a storyboard pack needs Anthropic credentials. The LLM path (`scripts/py/write_storyboard.py`) is implemented but was not exercised in the build environment, which had no key. Machine-written scripts must be fact-checked using their `sources` list before publishing.
- **Auto-storyboards** for arbitrary scripts use the generic templates (kinetic type, stat counters, titles, image cards). They are serviceable, but the bespoke scene templates are what make the demo look directed. For a premium result, write a storyboard pack.
- **No AI image or video generation** is wired in, because no authorised provider was reachable. `ImageReveal` and the `image` scene accept any local image (`assets/images/...`), so licensed photos can be dropped in.
- **Landscape and portrait** formats scale the vertical stage into the safe area. They work, but they leave side margins rather than recomposing scenes for 16:9.
- **Voice quality:** Kokoro is a strong open TTS voice, but it is not a human narrator. For flagship pieces, record a voiceover and pass `--voice`.
