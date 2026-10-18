# Production report — Where Does the Bullet's Energy Go?

Generated 2026-10-18T23:20:14.854Z in 3003s. Command: `npm run make-video -- --topic "Energy loss when a bullet is fired into a block of wood" --format "landscape" --reuse-audio --output "output/bullet-energy/final-video.mp4"`

## Stages

| # | Stage | Status | Detail |
|---|---|---|---|
| 1 | Script & storyboard | done | topic pack input/bullet-energy/storyboard.json |
| 2 | Textures & SFX | done | procedural paper, grain, 7 synthesised SFX |
| 3 | Voiceover | reused | audio/bullet-energy/narration_raw.wav |
| 4 | Alignment & subtitles | done | 205 caption groups, ASR word coverage 99.5% |
| 5 | Scene plan | done | 12 scenes, 7120 frames |
| 6 | Music & mix | done | original synthesised bed, 77 SFX, voice/music separation 20 dB, -16 LUFS |
| 7 | Render | done | 12 chunks (12 rendered this run) in 2038s |
| 8 | Delivery encode | done | output/bullet-energy/final-video.mp4 (85.1 MB after re-encode at 3 Mbps, CRF 23; QC re-run on the final file) in 621s |
| 9 | Quality control | passed | 17/17 checks |

## Quality control

| Check | Result | Detail |
|---|---|---|
| MP4 exists | ✅ pass | 85.1 MB |
| Resolution | ✅ pass | 1920×1080 (expected 1920×1080) |
| Frame rate | ✅ pass | 30.00 fps |
| Video codec | ✅ pass | h264 High yuv420p |
| Audio stream | ✅ pass | aac 48000 Hz 2ch |
| Duration matches plan | ✅ pass | 237.33s (plan 237.33s) |
| Decodes cleanly | ✅ pass | no decoder errors |
| No black segments | ✅ pass | none ≥0.3s |
| No frozen video (>3s) | ✅ pass | motion throughout |
| No audio dropouts | ✅ pass | no silence ≥1.5s |
| Loudness | ✅ pass | -16 LUFS integrated (target −16) |
| All scenes present | ✅ pass | 12 scenes, 291–1154 frames each |
| Assets present | ✅ pass | textures, grain, mix |
| Representative frames extracted | ✅ pass | 12 frames → output/bullet-energy/contact-sheet.jpg |
| Frames have content | ✅ pass | every scene frame has full tonal range |
| Subtitle sync vs speech | ✅ pass | 99% words matched; onset error median 36 ms, p95 146 ms |
| SRT export | ✅ pass | output/bullet-energy/subtitles.srt |

## Audio

- Narration: 235.74s of speech, total 237.34s
- Music bed level: -18.09 dB; voice sits 20 dB above music above 250 Hz (target 18–22 dB)
- Loudness normalised to −16 LUFS integrated, −1.5 dBTP

## Outputs

- video: `output/bullet-energy/final-video.mp4`
- subtitles: `output/bullet-energy/subtitles.srt`
- narration: `output/bullet-energy/narration.wav`
- storyboard: `output/bullet-energy/storyboard.json`
- script: `output/bullet-energy/script.txt`
- plan: `output/bullet-energy/plan.json`
- contactSheet: `output/bullet-energy/contact-sheet.jpg`
- thumbnail: `output/bullet-energy/thumbnail.jpg`

## Limitations

- Narration is synthetic (Kokoro bm_george); for flagship releases record a human voiceover and pass --voice.
- Automated QC checks format, sync, loudness and blank frames; cropping/overflow is judged by reviewing contact-sheet.jpg (done for this run only if stated in the delivery notes).
