Example inputs for the three CLI modes:

- `script.txt`: a plain four-sentence script (no storyboard), so it exercises the auto-storyboard.
- `narration.wav`: a voiceover for `script.txt`, recorded for testing with a *different* voice (Kokoro `bf_emma`, unhurried pace). It stands in for a human recording when testing `--voice`.

```bash
npm run make-video -- --script input/examples/script.txt --duration 20 --format landscape
npm run make-video -- --script input/examples/script.txt --voice input/examples/narration.wav --format 4:5
```
