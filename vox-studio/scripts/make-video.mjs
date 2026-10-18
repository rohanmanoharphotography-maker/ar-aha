#!/usr/bin/env node
// make-video: topic | script | voiceover  →  finished, QC'd MP4 + deliverables.
//
//   npm run make-video -- --topic "How vaccines stay safe" --duration 60 --format vertical --output output/final-video.mp4
//   npm run make-video -- --script input/script.txt --duration 45 --format vertical
//   npm run make-video -- --script input/script.txt --voice input/narration.wav --format vertical
//
// Every stage writes reusable artefacts; see README.md for the full map.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlan, buildSfxPlan } from "./lib/plan.mjs";
import { autoStoryboard, findTopicPack, scriptToBeats, slugify } from "./lib/storyboard.mjs";
import { runQc } from "./qc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PY = fs.existsSync(path.join(ROOT, ".venv/bin/python")) ? path.join(ROOT, ".venv/bin/python") : "python3";
const FORMATS = { vertical: [1080, 1920], landscape: [1920, 1080], portrait: [1080, 1350], "9:16": [1080, 1920], "16:9": [1920, 1080], "4:5": [1080, 1350] };
const FORMAT_ALIAS = { "9:16": "vertical", "16:9": "landscape", "4:5": "portrait", horizontal: "landscape", square: "portrait" };

const parseArgs = (argv) => {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) a[key] = true;
    else {
      a[key] = v;
      i++;
    }
  }
  return a;
};

const log = (...m) => console.log("\x1b[36m[make-video]\x1b[0m", ...m);
const step = (n, m) => console.log(`\n\x1b[1m── ${n}. ${m}\x1b[0m`);
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...opts.env } });
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} ${args.slice(0, 2).join(" ")} failed (exit ${r.status})`);
};
const py = (script, args) => run(PY, [path.join(ROOT, "scripts/py", script), ...args]);
const writeJson = (p, d) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
};
const rel = (p) => path.relative(ROOT, p);

export const findBrowser = () => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base).sort().reverse()) {
    const p = path.join(base, d, "chrome-linux", "headless_shell");
    if (d.startsWith("chromium_headless_shell") && fs.existsSync(p)) return p;
  }
  return null;
};

const checkModels = (needTts) => {
  const missing = [];
  if (needTts && !fs.existsSync(path.join(ROOT, "models/kokoro-v1.0.onnx"))) missing.push("Kokoro TTS model");
  if (!fs.existsSync(path.join(ROOT, "models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/encoder.int8.onnx"))) missing.push("Parakeet ASR model");
  if (missing.length) throw new Error(`Missing ${missing.join(" + ")}. Run \`npm run setup\` first.`);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.topic && !args.script && !args.storyboard)) {
    console.log(fs.readFileSync(path.join(ROOT, "README.md"), "utf8").split("## Usage")[1]?.split("\n## ")[0] ?? "see README.md");
    process.exit(args.help ? 0 : 1);
  }
  const t0 = Date.now();
  const format = FORMAT_ALIAS[args.format] ?? args.format ?? "vertical";
  if (!FORMATS[format]) throw new Error(`Unknown --format ${args.format}. Use vertical | landscape | portrait.`);
  const report = { started: new Date().toISOString(), args, stages: [], limitations: [] };
  const stage = (name, status, detail = "") => report.stages.push({ name, status, detail });

  // ── 1. storyboard ────────────────────────────────────────────────────────
  step(1, "Script & storyboard");
  let storyboard;
  let storyboardSource;
  if (args.storyboard) {
    storyboard = JSON.parse(fs.readFileSync(path.resolve(args.storyboard), "utf8"));
    storyboardSource = `hand-directed (${args.storyboard})`;
  } else if (args.script) {
    const text = fs.readFileSync(path.resolve(args.script), "utf8");
    const sibling = path.join(path.dirname(path.resolve(args.script)), "storyboard.json");
    const beats = scriptToBeats(text);
    const sib = fs.existsSync(sibling) ? JSON.parse(fs.readFileSync(sibling, "utf8")) : null;
    if (sib && sib.beats.map((b) => b.text.trim()).join(" ") === beats.map((b) => b.text).join(" ")) {
      storyboard = sib;
      storyboardSource = `hand-directed (${rel(sibling)}, matches script)`;
    } else {
      storyboard = autoStoryboard({ beats, title: args.title, topic: args.topic, duration: args.voice ? undefined : Number(args.duration) || 45 });
      storyboardSource = "auto-storyboard from script (generic scene templates)";
    }
  } else {
    const pack = findTopicPack(ROOT, args.topic);
    if (pack) {
      storyboard = JSON.parse(fs.readFileSync(pack, "utf8"));
      storyboardSource = `topic pack ${rel(pack)}`;
    } else {
      const out = path.join(ROOT, "input", slugify(args.topic), "storyboard.json");
      log("no topic pack found — asking Claude to write the script/storyboard (needs Anthropic credentials)");
      try {
        py("write_storyboard.py", ["--topic", args.topic, "--duration", String(args.duration ?? 45), "--audience", args.audience ?? "General public", "--out", out]);
      } catch (e) {
        throw new Error(
          `Could not write a script for "${args.topic}": no matching storyboard in input/ and the LLM scriptwriter is unavailable ` +
            `(set ANTHROPIC_API_KEY and \`pip install anthropic\` in .venv), or pass --script <file>.\n${e.message}`,
        );
      }
      storyboard = JSON.parse(fs.readFileSync(out, "utf8"));
      storyboardSource = `LLM-written (${storyboard.generatedBy}) — review sources before publishing`;
      report.limitations.push("Script was machine-written; its `sources` list must be fact-checked by a human before publishing.");
    }
  }
  if (args.duration) storyboard.targetDuration = Number(args.duration);
  else if (args.voice) delete storyboard.targetDuration; // a supplied recording sets the length
  // When the words or the recording are fixed by the user, missing the target is reported, not fatal.
  const durationIsHard = !args.voice && !args.script;
  if (args.title) storyboard.title = args.title;
  const slug = args.slug ?? storyboard.slug ?? slugify(storyboard.title);
  storyboard.slug = slug;
  const voiceName = args["voice-name"] ?? storyboard.voice ?? "am_michael";
  log(`storyboard: ${storyboardSource}; ${storyboard.beats.length} beats → ${storyboard.scenes.length} scenes`);
  stage("Script & storyboard", "done", storyboardSource);

  const OUT = path.join(ROOT, "output", slug);
  const AUD = path.join(ROOT, "audio", slug);
  const SUB = path.join(ROOT, "subtitles", slug);
  const BUILD = path.join(ROOT, "assets/build", slug);
  for (const d of [OUT, AUD, SUB, BUILD]) fs.mkdirSync(d, { recursive: true });
  const sbPath = path.join(OUT, "storyboard.json");
  writeJson(sbPath, storyboard);
  fs.writeFileSync(path.join(OUT, "script.txt"), storyboard.beats.map((b) => b.text).join("\n") + "\n");
  if (storyboard.sources?.length) {
    fs.writeFileSync(
      path.join(OUT, "sources.md"),
      `# Fact-check sources — ${storyboard.title}\n\n` + storyboard.sources.map((s) => `- **${s.claim}**\n  ${s.source} — ${s.url}`).join("\n") + "\n",
    );
  }
  const finalMp4 = path.resolve(ROOT, args.output ?? path.join("output", slug, "final-video.mp4"));
  const masterMp4 = path.join(OUT, "render-master.mp4");
  fs.mkdirSync(path.dirname(finalMp4), { recursive: true });

  // ── 2. assets (textures + sfx, cached) ──────────────────────────────────
  step(2, "Visual textures & sound-effect library");
  py("textures.py", [path.join(ROOT, "assets/textures")]);
  py("sfx.py", [path.join(ROOT, "assets/sfx")]);
  stage("Textures & SFX", "done", "procedural paper, grain, 7 synthesised SFX");

  // ── 3. voiceover ─────────────────────────────────────────────────────────
  step(3, "Voiceover");
  checkModels(!args.voice);
  let narration;
  const ttsJson = path.join(AUD, "tts.json");
  if (args.voice) {
    const src = path.resolve(args.voice);
    narration = path.join(AUD, `narration_source${path.extname(src)}`);
    fs.copyFileSync(src, narration);
    if (fs.existsSync(ttsJson)) fs.rmSync(ttsJson);
    log(`using supplied voiceover ${args.voice} (preserved unmodified as ${rel(narration)})`);
    stage("Voiceover", "done", `supplied recording ${args.voice}`);
  } else if (args["reuse-audio"] && fs.existsSync(path.join(AUD, "narration_raw.wav"))) {
    narration = path.join(AUD, "narration_raw.wav");
    log("reusing existing narration (--reuse-audio)");
    stage("Voiceover", "reused", rel(narration));
  } else {
    py("tts.py", [sbPath, AUD, "--voice", voiceName]);
    narration = path.join(AUD, "narration_raw.wav");
    const tts = JSON.parse(fs.readFileSync(ttsJson, "utf8"));
    stage("Voiceover", "done", `Kokoro ${tts.voice} @ ${tts.speed}x, ${tts.speechEnd}s speech`);
  }

  // ── 4. alignment + subtitles ─────────────────────────────────────────────
  step(4, "Speech alignment & subtitles");
  py("align.py", [sbPath, narration, AUD, ...(args.voice ? [] : ["--tts", ttsJson])]);
  const timing = JSON.parse(fs.readFileSync(path.join(AUD, "timing.json"), "utf8"));
  const captions = JSON.parse(fs.readFileSync(path.join(AUD, "captions.json"), "utf8"));
  fs.copyFileSync(path.join(AUD, "subtitles.srt"), path.join(SUB, "subtitles.srt"));
  fs.copyFileSync(path.join(AUD, "subtitles.srt"), path.join(OUT, "subtitles.srt"));
  stage("Alignment & subtitles", "done", `${captions.length} caption groups, ASR word coverage ${(timing.alignment.wordCoverage * 100).toFixed(1)}%`);

  // ── 5. plan (storyboard × timing → frames) ───────────────────────────────
  step(5, "Scene timing plan");
  const { plan, warnings } = buildPlan({
    storyboard,
    timing,
    captions,
    format,
    audio: `build/${slug}/mix.wav`,
    showCaptions: !args["no-captions"],
  });
  warnings.forEach((w) => log("warning:", w));
  const sfxPlan = buildSfxPlan(plan);
  writeJson(path.join(AUD, "sfx_plan.json"), sfxPlan);
  stage("Scene plan", warnings.length ? "done with warnings" : "done", `${plan.scenes.length} scenes, ${plan.durationInFrames} frames${warnings.length ? `; ${warnings.length} cue fallbacks` : ""}`);

  // ── 6. music + mix ───────────────────────────────────────────────────────
  step(6, "Music, sound design & mix");
  py("music.py", [path.join(AUD, "music.wav"), "--seconds", String(timing.duration)]);
  py("mix.py", [narration, path.join(AUD, "music.wav"), path.join(AUD, "sfx_plan.json"), AUD, "--duration", String(timing.duration), ...(args.voice ? ["--no-master"] : [])]);
  fs.copyFileSync(path.join(AUD, "mix.wav"), path.join(BUILD, "mix.wav"));
  fs.copyFileSync(path.join(AUD, "voice_master.wav"), path.join(OUT, "narration.wav"));
  const mixInfo = JSON.parse(fs.readFileSync(path.join(AUD, "mix.json"), "utf8"));
  stage("Music & mix", "done", `original synthesised bed, ${sfxPlan.length} SFX, voice/music separation ${mixInfo.voiceOverMusicAbove250HzDb} dB, -16 LUFS`);

  const planPath = path.join(OUT, "plan.json");
  writeJson(planPath, plan);
  writeJson(path.join(ROOT, "src/generated/current.json"), plan);

  // ── 7. render ────────────────────────────────────────────────────────────
  if (args["skip-render"]) {
    log("--skip-render: stopping before render");
    return;
  }
  step(7, "Render (Remotion → H.264/AAC)");
  const browser = findBrowser();
  const renderArgs = [
    "remotion",
    "render",
    "src/index.ts",
    "Explainer",
    masterMp4,
    `--props=${planPath}`,
    "--codec=h264",
    "--audio-codec=aac",
    "--audio-bitrate=192k",
    "--crf=16",
    "--pixel-format=yuv420p",
    `--concurrency=${args.concurrency ?? process.env.REMOTION_CONCURRENCY ?? 4}`,
    "--log=warn",
    ...(browser ? [`--browser-executable=${browser}`] : []),
  ];
  const tr = Date.now();
  run("npx", renderArgs);
  stage("Render", "done", `Remotion master in ${((Date.now() - tr) / 1000).toFixed(0)}s`);

  // ── 7b. delivery encode ──────────────────────────────────────────────────
  // Chromium frames come out full-range BT.601 (yuvj420p); platforms expect
  // limited-range BT.709 yuv420p. Also caps bitrate for Reels/Shorts uploads.
  step("7b", "Delivery encode (H.264 High, yuv420p BT.709, AAC, faststart)");
  const te = Date.now();
  run("ffmpeg", [
    "-y", "-v", "error", "-i", masterMp4,
    "-vf", "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(args.crf ?? 21), "-maxrate", "12M", "-bufsize", "24M",
    "-profile:v", "high", "-level", "4.2",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-c:a", "copy", "-movflags", "+faststart", finalMp4,
  ]);
  if (!args["keep-master"]) fs.rmSync(masterMp4, { force: true });
  stage("Delivery encode", "done", `${rel(finalMp4)} (${(fs.statSync(finalMp4).size / 1e6).toFixed(1)} MB) in ${((Date.now() - te) / 1000).toFixed(0)}s`);

  // ── 8. QC ────────────────────────────────────────────────────────────────
  step(8, "Quality control");
  const qc = await runQc({ mp4: finalMp4, plan, planPath, storyboard, outDir: OUT, targetDuration: storyboard.targetDuration, durationIsHard, py: PY, root: ROOT, captions });
  report.qc = qc;
  const warned = qc.checks.filter((c) => !c.ok && c.warn);
  warned.forEach((c) => report.limitations.push(`QC warning — ${c.name}: ${c.detail}`));
  stage("Quality control", qc.passed ? (warned.length ? "passed with warnings" : "passed") : "FAILED", `${qc.checks.filter((c) => c.ok).length}/${qc.checks.length} checks${warned.length ? `, ${warned.length} warning` : ""}`);

  // ── 9. report ────────────────────────────────────────────────────────────
  if (!args.voice) report.limitations.push(`Narration is synthetic (Kokoro ${voiceName}); for flagship releases record a human voiceover and pass --voice.`);
  const illustrative = storyboard.scenes.filter((s) => ["logger", "excursion", "split"].includes(s.type)).map((s) => s.id);
  if (illustrative.length) report.limitations.push(`Scenes ${illustrative.join(", ")} show illustrative (not measured) traces/meters; each is labelled on screen as illustrative.`);
  if (!storyboard.sources?.length) report.limitations.push("Storyboard has no `sources` list — on-screen claims have not been fact-checked by this pipeline.");
  report.limitations.push("Automated QC checks format, sync, loudness and blank frames; cropping/overflow is judged by reviewing contact-sheet.jpg (done for this run only if stated in the delivery notes).");
  report.finished = new Date().toISOString();
  report.elapsedSeconds = Math.round((Date.now() - t0) / 1000);
  report.outputs = {
    video: rel(finalMp4),
    subtitles: rel(path.join(OUT, "subtitles.srt")),
    narration: rel(path.join(OUT, "narration.wav")),
    storyboard: rel(sbPath),
    script: rel(path.join(OUT, "script.txt")),
    plan: rel(planPath),
    contactSheet: qc.contactSheet ? rel(qc.contactSheet) : null,
    thumbnail: qc.thumbnail ? rel(qc.thumbnail) : null,
  };
  writeJson(path.join(OUT, "production-report.json"), report);
  fs.writeFileSync(path.join(OUT, "production-report.md"), renderReport(report, storyboard, mixInfo, timing));
  log(`\n${qc.passed ? "✅ QC passed" : "❌ QC failed"} — ${rel(finalMp4)}  (report: ${rel(path.join(OUT, "production-report.md"))})`);
  if (!qc.passed) process.exit(2);
};

const renderReport = (r, sb, mix, timing) => {
  const lines = [
    `# Production report — ${sb.title}`,
    "",
    `Generated ${r.finished} in ${r.elapsedSeconds}s. Command: \`npm run make-video -- ${Object.entries(r.args)
      .map(([k, v]) => (v === true ? `--${k}` : `--${k} "${v}"`))
      .join(" ")}\``,
    "",
    "## Stages",
    "",
    "| # | Stage | Status | Detail |",
    "|---|---|---|---|",
    ...r.stages.map((s, i) => `| ${i + 1} | ${s.name} | ${s.status} | ${s.detail} |`),
    "",
    "## Quality control",
    "",
    "| Check | Result | Detail |",
    "|---|---|---|",
    ...r.qc.checks.map((c) => `| ${c.name} | ${c.ok ? "✅ pass" : c.warn ? "⚠️ warning" : "❌ fail"} | ${c.detail} |`),
    "",
    "## Audio",
    "",
    `- Narration: ${timing.speechEnd}s of speech, total ${timing.duration}s`,
    `- Music bed level: ${mix.musicGainDb} dB; voice sits ${mix.voiceOverMusicAbove250HzDb} dB above music above 250 Hz (target 18–22 dB)`,
    `- Loudness normalised to −16 LUFS integrated, −1.5 dBTP`,
    "",
    "## Outputs",
    "",
    ...Object.entries(r.outputs)
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${k}: \`${v}\``),
    "",
    "## Limitations",
    "",
    ...(r.limitations.length ? r.limitations.map((l) => `- ${l}`) : ["- None recorded for this run."]),
    "",
  ];
  return lines.join("\n");
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("\x1b[31m[make-video] failed:\x1b[0m", e.message);
    process.exit(1);
  });
}
