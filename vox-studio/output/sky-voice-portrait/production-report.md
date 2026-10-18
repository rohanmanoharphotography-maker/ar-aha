# Production report — Why the sky is blue

Generated 2026-10-18T20:00:43.196Z in 148s. Command: `npm run make-video -- --script "input/examples/script.txt" --voice "/tmp/claude-0/narration_test.wav" --title "Why the sky is blue" --slug "sky-voice-portrait" --format "4:5"`

## Stages

| # | Stage | Status | Detail |
|---|---|---|---|
| 1 | Script & storyboard | done | auto-storyboard from script (generic scene templates) |
| 2 | Textures & SFX | done | procedural paper, grain, 7 synthesised SFX |
| 3 | Voiceover | done | supplied recording /tmp/claude-0/narration_test.wav |
| 4 | Alignment & subtitles | done | 22 caption groups, ASR word coverage 98.3% |
| 5 | Scene plan | done | 4 scenes, 644 frames |
| 6 | Music & mix | done | original synthesised bed, 7 SFX, voice/music separation 20 dB, -16 LUFS |
| 7 | Render | done | Remotion master in 94s |
| 8 | Delivery encode | done | output/sky-voice-portrait/final-video.mp4 (12.4 MB) in 26s |
| 9 | Quality control | passed | 17/17 checks |

## Quality control

| Check | Result | Detail |
|---|---|---|
| MP4 exists | ✅ pass | 12.4 MB |
| Resolution | ✅ pass | 1080×1350 (expected 1080×1350) |
| Frame rate | ✅ pass | 30.00 fps |
| Video codec | ✅ pass | h264 High yuv420p |
| Audio stream | ✅ pass | aac 48000 Hz 2ch |
| Duration matches plan | ✅ pass | 21.48s (plan 21.47s) |
| Decodes cleanly | ✅ pass | no decoder errors |
| No black segments | ✅ pass | none ≥0.3s |
| No frozen video (>3s) | ✅ pass | motion throughout |
| No audio dropouts | ✅ pass | no silence ≥1.5s |
| Loudness | ✅ pass | -16.1 LUFS integrated (target −16) |
| All scenes present | ✅ pass | 4 scenes, 116–235 frames each |
| Assets present | ✅ pass | textures, grain, mix |
| Representative frames extracted | ✅ pass | 4 frames → output/sky-voice-portrait/contact-sheet.jpg |
| Frames have content | ✅ pass | every scene frame has full tonal range |
| Subtitle sync vs speech | ✅ pass | 98% words matched; onset error median 0 ms, p95 8 ms |
| SRT export | ✅ pass | output/sky-voice-portrait/subtitles.srt |

## Audio

- Narration: 19.86s of speech, total 21.46s
- Music bed level: -17.81 dB; voice sits 20 dB above music above 250 Hz (target 18–22 dB)
- Loudness normalised to −16 LUFS integrated, −1.5 dBTP

## Outputs

- video: `output/sky-voice-portrait/final-video.mp4`
- subtitles: `output/sky-voice-portrait/subtitles.srt`
- narration: `output/sky-voice-portrait/narration.wav`
- storyboard: `output/sky-voice-portrait/storyboard.json`
- script: `output/sky-voice-portrait/script.txt`
- plan: `output/sky-voice-portrait/plan.json`
- contactSheet: `output/sky-voice-portrait/contact-sheet.jpg`
- thumbnail: `output/sky-voice-portrait/thumbnail.jpg`

## Limitations

- Storyboard has no `sources` list — on-screen claims have not been fact-checked by this pipeline.
- Automated QC checks format, sync, loudness and blank frames; cropping/overflow is judged by reviewing contact-sheet.jpg (done for this run only if stated in the delivery notes).
