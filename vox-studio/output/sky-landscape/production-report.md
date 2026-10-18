# Production report — Why the sky is blue

Generated 2026-10-18T19:58:14.630Z in 236s. Command: `npm run make-video -- --script "input/examples/script.txt" --title "Why the sky is blue" --slug "sky-landscape" --duration "20" --format "landscape"`

## Stages

| # | Stage | Status | Detail |
|---|---|---|---|
| 1 | Script & storyboard | done | auto-storyboard from script (generic scene templates) |
| 2 | Textures & SFX | done | procedural paper, grain, 7 synthesised SFX |
| 3 | Voiceover | done | Kokoro am_michael @ 1.12x, 20.98s speech |
| 4 | Alignment & subtitles | done | 22 caption groups, ASR word coverage 97.7% |
| 5 | Scene plan | done | 4 scenes, 677 frames |
| 6 | Music & mix | done | original synthesised bed, 7 SFX, voice/music separation 20 dB, -16 LUFS |
| 7 | Render | done | Remotion master in 134s |
| 8 | Delivery encode | done | output/sky-landscape/final-video.mp4 (29.8 MB) in 44s |
| 9 | Quality control | passed with warnings | 17/18 checks, 1 warning |

## Quality control

| Check | Result | Detail |
|---|---|---|
| MP4 exists | ✅ pass | 29.8 MB |
| Resolution | ✅ pass | 1920×1080 (expected 1920×1080) |
| Frame rate | ✅ pass | 30.00 fps |
| Video codec | ✅ pass | h264 High yuv420p |
| Audio stream | ✅ pass | aac 48000 Hz 2ch |
| Duration matches plan | ✅ pass | 22.57s (plan 22.57s) |
| Duration vs target | ⚠️ warning | 22.57s vs 20s target (±2.5s) — length fixed by the supplied script/voice |
| Decodes cleanly | ✅ pass | no decoder errors |
| No black segments | ✅ pass | none ≥0.3s |
| No frozen video (>3s) | ✅ pass | motion throughout |
| No audio dropouts | ✅ pass | no silence ≥1.5s |
| Loudness | ✅ pass | -16.1 LUFS integrated (target −16) |
| All scenes present | ✅ pass | 4 scenes, 122–227 frames each |
| Assets present | ✅ pass | textures, grain, mix |
| Representative frames extracted | ✅ pass | 4 frames → output/sky-landscape/contact-sheet.jpg |
| Frames have content | ✅ pass | every scene frame has full tonal range |
| Subtitle sync vs speech | ✅ pass | 98% words matched; onset error median 29 ms, p95 132 ms |
| SRT export | ✅ pass | output/sky-landscape/subtitles.srt |

## Audio

- Narration: 20.98s of speech, total 22.58s
- Music bed level: -18.6 dB; voice sits 20 dB above music above 250 Hz (target 18–22 dB)
- Loudness normalised to −16 LUFS integrated, −1.5 dBTP

## Outputs

- video: `output/sky-landscape/final-video.mp4`
- subtitles: `output/sky-landscape/subtitles.srt`
- narration: `output/sky-landscape/narration.wav`
- storyboard: `output/sky-landscape/storyboard.json`
- script: `output/sky-landscape/script.txt`
- plan: `output/sky-landscape/plan.json`
- contactSheet: `output/sky-landscape/contact-sheet.jpg`
- thumbnail: `output/sky-landscape/thumbnail.jpg`

## Limitations

- QC warning — Duration vs target: 22.57s vs 20s target (±2.5s) — length fixed by the supplied script/voice
- Narration is synthetic (Kokoro am_michael); for flagship releases record a human voiceover and pass --voice.
- Storyboard has no `sources` list — on-screen claims have not been fact-checked by this pipeline.
- Automated QC checks format, sync, loudness and blank frames; cropping/overflow is judged by reviewing contact-sheet.jpg (done for this run only if stated in the delivery notes).
