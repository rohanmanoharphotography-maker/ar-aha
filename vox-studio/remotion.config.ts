// Remotion CLI configuration (applies to `npx remotion studio|render`).
// The programmatic pipeline (scripts/make-video.mjs) passes the same options on the command line.
import { Config } from "@remotion/cli/config";

Config.setPublicDir("./assets");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(18);
Config.setOverwriteOutput(true);
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY || 4));
// Use a locally installed Chromium when provided (offline / sandboxed machines).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
