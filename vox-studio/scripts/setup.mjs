#!/usr/bin/env node
// One-time environment setup: Python venv + local speech models + doctor report.
//   npm run setup            install everything that is missing
//   npm run setup -- --check report only
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findBrowser } from "./make-video.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const MODELS = path.join(ROOT, "models");
const VENV_PY = path.join(ROOT, ".venv/bin/python");

// Model files are fetched from their publishers' GitHub releases.
const DOWNLOADS = [
  {
    name: "Kokoro-82M v1.0 ONNX (TTS, Apache-2.0)",
    file: "kokoro-v1.0.onnx",
    url: "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    minBytes: 300e6,
  },
  {
    name: "Kokoro voices v1.0",
    file: "voices-v1.0.bin",
    url: "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
    minBytes: 20e6,
  },
  {
    name: "NVIDIA Parakeet-TDT 0.6B v2 int8 (ASR/alignment, CC-BY-4.0)",
    file: "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/encoder.int8.onnx",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2",
    archive: true,
    minBytes: 100e6,
  },
];

const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✘\x1b[0m ${m}`);
const has = (cmd) => spawnSync("sh", ["-c", `command -v ${cmd}`]).status === 0;
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`);
};

let problems = 0;
console.log("\nvox-studio doctor\n");

// system tools
for (const t of ["ffmpeg", "ffprobe", "python3", "node"]) (has(t) ? ok : (problems++, bad))(`${t} on PATH`);
const browser = findBrowser();
browser ? ok(`Chromium headless shell: ${browser}`) : console.log("  • no local Chromium found — Remotion will download its own on first render");

// python env
if (!fs.existsSync(VENV_PY)) {
  if (CHECK) (problems++, bad("Python venv missing (.venv)"));
  else {
    console.log("  … creating .venv");
    run("python3", ["-m", "venv", ".venv"]);
  }
}
if (fs.existsSync(VENV_PY) && !CHECK) run(VENV_PY, ["-m", "pip", "install", "-q", "-r", "requirements.txt"]);
const imp = fs.existsSync(VENV_PY) ? spawnSync(VENV_PY, ["-c", "import kokoro_onnx, sherpa_onnx, soundfile, numpy, PIL"]) : { status: 1 };
imp.status === 0 ? ok("Python packages (kokoro-onnx, sherpa-onnx, soundfile, numpy, pillow)") : (problems++, bad("Python packages missing — run npm run setup"));

// models
fs.mkdirSync(MODELS, { recursive: true });
for (const d of DOWNLOADS) {
  const target = path.join(MODELS, d.file);
  if (fs.existsSync(target) && fs.statSync(target).size >= (d.archive ? 1 : d.minBytes)) {
    ok(d.name);
    continue;
  }
  if (CHECK) {
    problems++;
    bad(`${d.name} — missing`);
    continue;
  }
  console.log(`  … downloading ${d.name}`);
  const dl = d.archive ? path.join(MODELS, "download.tmp.tar.bz2") : `${target}.part`;
  run("curl", ["-fL", "--retry", "4", "--retry-delay", "2", "-o", dl, d.url]);
  if (fs.statSync(dl).size < d.minBytes) throw new Error(`${d.name}: download too small — check network access to github.com`);
  if (d.archive) {
    run("tar", ["xjf", dl, "-C", MODELS]);
    fs.rmSync(dl);
  } else fs.renameSync(dl, target);
  ok(d.name);
}

// optional services
console.log("\nOptional integrations");
process.env.ANTHROPIC_API_KEY ? ok("ANTHROPIC_API_KEY set — topic → script writing enabled") : console.log("  • ANTHROPIC_API_KEY not set — --topic needs a storyboard pack in input/ (or use --script)");

console.log(problems ? `\n${problems} problem(s) found.\n` : "\nReady. Try: npm run make-video -- --topic \"How vaccines are kept safe through the cold chain\"\n");
process.exit(problems ? 1 : 0);
