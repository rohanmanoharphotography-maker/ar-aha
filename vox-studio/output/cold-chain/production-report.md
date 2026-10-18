# Production report — The Cold Chain

Generated 2026-10-18T20:09:05.496Z in 502s. Command: `npm run make-video -- --topic "How vaccines are kept safe through the cold chain" --duration "45" --format "vertical" --style "editorial" --output "output/cold-chain/final-video.mp4"`

## Stages

| # | Stage | Status | Detail |
|---|---|---|---|
| 1 | Script & storyboard | done | topic pack input/cold-chain/storyboard.json |
| 2 | Textures & SFX | done | procedural paper, grain, 7 synthesised SFX |
| 3 | Voiceover | done | Kokoro am_michael @ 1.114x, 43.76s speech |
| 4 | Alignment & subtitles | done | 47 caption groups, ASR word coverage 96.0% |
| 5 | Scene plan | done | 10 scenes, 1361 frames |
| 6 | Music & mix | done | original synthesised bed, 35 SFX, voice/music separation 20 dB, -16 LUFS |
| 7 | Render | done | Remotion master in 293s |
| 8 | Delivery encode | done | output/cold-chain/final-video.mp4 (62.6 MB) in 103s |
| 9 | Quality control | passed | 18/18 checks |

## Quality control

| Check | Result | Detail |
|---|---|---|
| MP4 exists | ✅ pass | 62.6 MB |
| Resolution | ✅ pass | 1080×1920 (expected 1080×1920) |
| Frame rate | ✅ pass | 30.00 fps |
| Video codec | ✅ pass | h264 High yuv420p |
| Audio stream | ✅ pass | aac 48000 Hz 2ch |
| Duration matches plan | ✅ pass | 45.38s (plan 45.37s) |
| Duration vs target | ✅ pass | 45.38s vs 45s target (±2.7s) |
| Decodes cleanly | ✅ pass | no decoder errors |
| No black segments | ✅ pass | none ≥0.3s |
| No frozen video (>3s) | ✅ pass | motion throughout |
| No audio dropouts | ✅ pass | no silence ≥1.5s |
| Loudness | ✅ pass | -16.1 LUFS integrated (target −16) |
| All scenes present | ✅ pass | 10 scenes, 100–178 frames each |
| Assets present | ✅ pass | textures, grain, mix |
| Representative frames extracted | ✅ pass | 10 frames → output/cold-chain/contact-sheet.jpg |
| Frames have content | ✅ pass | every scene frame has full tonal range |
| Subtitle sync vs speech | ✅ pass | 95% words matched; onset error median 35 ms, p95 116 ms |
| SRT export | ✅ pass | output/cold-chain/subtitles.srt |

## Audio

- Narration: 43.76s of speech, total 45.36s
- Music bed level: -18.99 dB; voice sits 20 dB above music above 250 Hz (target 18–22 dB)
- Loudness normalised to −16 LUFS integrated, −1.5 dBTP

## Outputs

- video: `output/cold-chain/final-video.mp4`
- subtitles: `output/cold-chain/subtitles.srt`
- narration: `output/cold-chain/narration.wav`
- storyboard: `output/cold-chain/storyboard.json`
- script: `output/cold-chain/script.txt`
- plan: `output/cold-chain/plan.json`
- contactSheet: `output/cold-chain/contact-sheet.jpg`
- thumbnail: `output/cold-chain/thumbnail.jpg`

## Limitations

- Narration is synthetic (Kokoro am_michael); for flagship releases record a human voiceover and pass --voice.
- Scenes damage, logger, excursion show illustrative (not measured) traces/meters; each is labelled on screen as illustrative.
- Automated QC checks format, sync, loudness and blank frames; cropping/overflow is judged by reviewing contact-sheet.jpg (done for this run only if stated in the delivery notes).

## Manual review (this run)

- Reviewed the contact sheet, per-scene stills and a mid-transition frame. Inside the safe area there is no text overflow, clipping or element collision. The excursion scene carries its "Illustrative scenario" label.
- Checked the script's claims against the CDC Vaccine Storage & Handling Toolkit and the WHO VVM guidance (see `sources.md`). No statistics are stated, and the charts and meters are labelled illustrative on screen.
