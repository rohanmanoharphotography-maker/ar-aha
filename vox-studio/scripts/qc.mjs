#!/usr/bin/env node
// Automatic quality control for a rendered explainer.
//   node scripts/qc.mjs <video.mp4> <plan.json> [--target 45]
// Also used in-process by make-video.mjs.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORMATS = { vertical: [1080, 1920], landscape: [1920, 1080], portrait: [1080, 1350] };

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const probe = (mp4) => {
  const r = sh("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", mp4]);
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
};

const fpsOf = (s) => {
  const [a, b] = s.split("/").map(Number);
  return b ? a / b : a;
};

export const runQc = async ({ mp4, plan, storyboard, outDir, targetDuration, durationIsHard = true, py, root = ROOT, captions }) => {
  const checks = [];
  /** warn: a failed check is reported but does not fail the run */
  const add = (name, ok, detail, warn = false) => checks.push({ name, ok: !!ok, detail, ...(warn ? { warn: true } : {}) });
  fs.mkdirSync(outDir, { recursive: true });

  // 1. file exists
  const exists = fs.existsSync(mp4);
  const size = exists ? fs.statSync(mp4).size : 0;
  add("MP4 exists", exists && size > 200_000, exists ? `${(size / 1e6).toFixed(1)} MB` : "missing");
  if (!exists) return { passed: false, checks };

  // 2. streams / format
  const info = probe(mp4);
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  const [W, H] = FORMATS[plan.format];
  add("Resolution", v && v.width === W && v.height === H, v ? `${v.width}×${v.height} (expected ${W}×${H})` : "no video stream");
  const fps = v ? fpsOf(v.r_frame_rate) : 0;
  add("Frame rate", Math.abs(fps - plan.fps) < 0.01, `${fps.toFixed(2)} fps`);
  add("Video codec", v && v.codec_name === "h264" && v.pix_fmt === "yuv420p", v ? `${v.codec_name} ${v.profile ?? ""} ${v.pix_fmt}` : "-");
  add("Audio stream", a && a.codec_name === "aac", a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch` : "no audio stream");
  const dur = Number(info.format.duration);
  const expected = plan.durationInFrames / plan.fps;
  add("Duration matches plan", Math.abs(dur - expected) < 0.2, `${dur.toFixed(2)}s (plan ${expected.toFixed(2)}s)`);
  if (targetDuration) {
    const tol = Math.max(2.5, targetDuration * 0.06);
    add(
      "Duration vs target",
      Math.abs(dur - targetDuration) <= tol,
      `${dur.toFixed(2)}s vs ${targetDuration}s target (±${tol.toFixed(1)}s)${durationIsHard ? "" : " — length fixed by the supplied script/voice"}`,
      !durationIsHard,
    );
  }

  // 3. full decode: any encoding errors?
  const dec = sh("ffmpeg", ["-v", "error", "-i", mp4, "-f", "null", "-"]);
  add("Decodes cleanly", dec.status === 0 && !dec.stderr.trim(), dec.stderr.trim() ? dec.stderr.trim().split("\n").slice(0, 2).join(" | ") : "no decoder errors");

  // 4. black frames / frozen video / silence / loudness
  const bd = sh("ffmpeg", ["-i", mp4, "-vf", "blackdetect=d=0.3:pix_th=0.10", "-an", "-f", "null", "-"]);
  const blacks = [...bd.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  add("No black segments", blacks.length === 0, blacks.length ? blacks.map(([s, e]) => `${s}-${e}s`).join(", ") : "none ≥0.3s");
  const fz = sh("ffmpeg", ["-i", mp4, "-vf", "freezedetect=n=0.002:d=3", "-an", "-f", "null", "-"]);
  const freezes = [...fz.stderr.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]);
  add("No frozen video (>3s)", freezes.length === 0, freezes.length ? `frozen from ${freezes.join(", ")}s` : "motion throughout");
  const sd = sh("ffmpeg", ["-i", mp4, "-af", "silencedetect=n=-45dB:d=1.5", "-vn", "-f", "null", "-"]);
  const silences = [...sd.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]).filter((t) => t < dur - 2);
  add("No audio dropouts", silences.length === 0, silences.length ? `silence at ${silences.join(", ")}s` : "no silence ≥1.5s");
  const lu = sh("ffmpeg", ["-i", mp4, "-af", "ebur128=framelog=quiet", "-vn", "-f", "null", "-"]);
  const lufs = Number(lu.stderr.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
  add("Loudness", Math.abs(lufs + 16) <= 1.5, `${lufs} LUFS integrated (target −16)`);

  // 5. scenes complete
  const registry = fs.readFileSync(path.join(root, "src/scenes/index.ts"), "utf8");
  const known = new Set([...registry.matchAll(/^\s+"?([\w-]+)"?: \w+Scene,/gm)].map((m) => m[1]));
  const missing = storyboard.scenes.filter((s) => !plan.scenes.find((p) => p.id === s.id));
  const unknown = plan.scenes.filter((s) => !known.has(s.type));
  const short = plan.scenes.filter((s) => s.durationInFrames < 30);
  add(
    "All scenes present",
    !missing.length && !unknown.length && !short.length,
    missing.length || unknown.length || short.length
      ? `missing: ${missing.map((s) => s.id).join(",") || "-"}; no template: ${unknown.map((s) => s.type).join(",") || "-"}; <1s: ${short.map((s) => s.id).join(",") || "-"}`
      : `${plan.scenes.length} scenes, ${Math.min(...plan.scenes.map((s) => s.durationInFrames))}–${Math.max(...plan.scenes.map((s) => s.durationInFrames))} frames each`,
  );
  const assets = ["assets/textures/paper.jpg", "assets/textures/grain_0.png", `assets/${plan.audio}`].filter((p) => !fs.existsSync(path.join(root, p)));
  add("Assets present", assets.length === 0, assets.length ? `missing ${assets.join(", ")}` : "textures, grain, mix");

  // 6. representative frames → contact sheet (inspected by a human/agent)
  const qcDir = path.join(outDir, "qc");
  fs.rmSync(qcDir, { recursive: true, force: true });
  fs.mkdirSync(qcDir, { recursive: true });
  const frames = plan.scenes.map((s, i) => ({ id: s.id, i, t: (s.from + Math.round(s.durationInFrames * 0.78)) / plan.fps }));
  for (const f of frames) {
    sh("ffmpeg", ["-y", "-v", "error", "-ss", f.t.toFixed(3), "-i", mp4, "-frames:v", "1", path.join(qcDir, `scene_${String(f.i + 1).padStart(2, "0")}_${f.id}.png`)]);
  }
  const cols = plan.format === "landscape" ? 3 : 5;
  const tw = plan.format === "landscape" ? 640 : 360;
  const contactSheet = path.join(outDir, "contact-sheet.jpg");
  const cs = sh("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-pattern_type",
    "glob",
    "-i",
    path.join(qcDir, "scene_*.png"),
    "-vf",
    `scale=${tw}:-1,tile=${cols}x${Math.ceil(frames.length / cols)}:padding=8:color=white`,
    "-frames:v",
    "1",
    contactSheet,
  ]);
  add("Representative frames extracted", cs.status === 0 && fs.existsSync(contactSheet), `${frames.length} frames → ${path.relative(root, contactSheet)}`);

  // per-frame sanity: not blank, not clipped to a flat colour
  const flat = [];
  for (const f of fs.readdirSync(qcDir)) {
    const stats = sh("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie=${path.join(qcDir, f)},signalstats`, "-show_entries", "frame_tags=lavfi.signalstats.YMIN,lavfi.signalstats.YMAX", "-of", "json"]);
    const tags = JSON.parse(stats.stdout || "{}").frames?.[0]?.tags ?? {};
    if (Number(tags["lavfi.signalstats.YMAX"]) - Number(tags["lavfi.signalstats.YMIN"]) < 60) flat.push(f);
  }
  add("Frames have content", flat.length === 0, flat.length ? `low-contrast: ${flat.join(", ")}` : "every scene frame has full tonal range");

  // 7. subtitle sync against the rendered audio
  if (captions?.length) {
    const capsPath = path.join(qcDir, "captions.json");
    fs.writeFileSync(capsPath, JSON.stringify(captions));
    const syncOut = path.join(outDir, "qc-subtitle-sync.json");
    const r = sh(py, [path.join(root, "scripts/py/qc_sync.py"), mp4, capsPath, syncOut]);
    if (r.status === 0) {
      const s = JSON.parse(fs.readFileSync(syncOut, "utf8"));
      add(
        "Subtitle sync vs speech",
        s.coverage >= 0.85 && s.medianOffset <= 0.12 && s.p95Offset <= 0.35 && s.wordsInsideGroupWindow >= 0.98,
        `${(s.coverage * 100).toFixed(0)}% words matched; onset error median ${(s.medianOffset * 1000).toFixed(0)} ms, p95 ${(s.p95Offset * 1000).toFixed(0)} ms`,
      );
    } else add("Subtitle sync vs speech", false, r.stderr.split("\n").slice(-3).join(" "));
    const srt = path.join(outDir, "subtitles.srt");
    add("SRT export", fs.existsSync(srt) && fs.readFileSync(srt, "utf8").includes("-->"), path.relative(root, srt));
  }

  // 8. poster frame: the closing card at its fullest
  const last = plan.scenes[plan.scenes.length - 1];
  const thumbnail = path.join(outDir, "thumbnail.jpg");
  sh("ffmpeg", ["-y", "-v", "error", "-ss", ((last.from + last.durationInFrames - 8) / plan.fps).toFixed(3), "-i", mp4, "-frames:v", "1", "-q:v", "2", thumbnail]);

  const passed = checks.every((c) => c.ok || c.warn);
  const result = { passed, checks, contactSheet, thumbnail, frames: fs.readdirSync(qcDir).filter((f) => f.endsWith(".png")) };
  fs.writeFileSync(path.join(outDir, "qc-report.json"), JSON.stringify(result, null, 2));
  for (const c of checks) console.log(`  ${c.ok ? "✅" : c.warn ? "⚠️ " : "❌"} ${c.name.padEnd(32)} ${c.detail}`);
  return result;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mp4, planPath] = process.argv.slice(2);
  if (!mp4 || !planPath) {
    console.error("usage: node scripts/qc.mjs <video.mp4> <plan.json> [--target 45]");
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const dir = path.dirname(path.resolve(planPath));
  const sbPath = path.join(dir, "storyboard.json");
  const storyboard = fs.existsSync(sbPath) ? JSON.parse(fs.readFileSync(sbPath, "utf8")) : { scenes: plan.scenes };
  const ti = process.argv.indexOf("--target");
  const py = fs.existsSync(path.join(ROOT, ".venv/bin/python")) ? path.join(ROOT, ".venv/bin/python") : "python3";
  runQc({ mp4: path.resolve(mp4), plan, storyboard, outDir: dir, targetDuration: ti > 0 ? Number(process.argv[ti + 1]) : storyboard.targetDuration, py, captions: plan.captions }).then((r) =>
    process.exit(r.passed ? 0 : 2),
  );
}
