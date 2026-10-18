#!/usr/bin/env node
// Render preview stills from a plan without a full render, then tile them.
//   node scripts/stills.mjs output/<slug>/plan.json [frame ...]   (default: each scene at 80%)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findBrowser } from "./make-video.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [planPath, ...frameArgs] = process.argv.slice(2);
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const frames = frameArgs.length ? frameArgs.map(Number) : plan.scenes.map((s) => s.from + Math.round(s.durationInFrames * 0.8));
const out = path.join(path.dirname(path.resolve(planPath)), "stills");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "assets") });
const browserExecutable = findBrowser();
const composition = await selectComposition({ serveUrl, id: "Explainer", inputProps: plan, browserExecutable });
for (const f of frames) {
  const file = path.join(out, `f${String(f).padStart(5, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: f, output: file, inputProps: plan, browserExecutable });
  console.log("still", path.relative(ROOT, file));
}
const cols = plan.format === "landscape" ? 3 : 5;
spawnSync("ffmpeg", ["-y", "-v", "error", "-pattern_type", "glob", "-i", path.join(out, "f*.png"), "-vf", `scale=${plan.format === "landscape" ? 640 : 360}:-1,tile=${cols}x${Math.ceil(frames.length / cols)}:padding=8:color=white`, "-frames:v", "1", path.join(out, "sheet.jpg")]);
console.log("sheet", path.relative(ROOT, path.join(out, "sheet.jpg")));
