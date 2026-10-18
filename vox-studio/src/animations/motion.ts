import { Easing, interpolate, spring } from "remotion";
import { SPRING } from "../lib/theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Spring progress 0→1 starting at `start` (scene frames). */
export const enter = (frame: number, fps: number, start: number, config: Partial<typeof SPRING> = {}) =>
  spring({ frame: frame - start, fps, config: { ...SPRING, ...config } });

/** Opacity ramp that pairs with `enter`. Elements arrive, they do not just fade. */
export const ramp = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

/** Rise from below: returns a translateY in px. */
export const rise = (progress: number, distance = 160) => interpolate(progress, [0, 1], [distance, 0], clamp);

/** Linear-ish progress between two frames with an ease. */
export const progress = (frame: number, start: number, end: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], { ...clamp, easing: ease });

/** Stroke draw-on: dashoffset 1→0 for paths with pathLength={1}. */
export const draw = (frame: number, start: number, end: number) => 1 - progress(frame, start, end);

/** Gentle idle float so held frames still breathe. */
export const float = (frame: number, amp = 6, period = 90, phase = 0) =>
  Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random in [0,1) for jittered paper edges. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** A torn-paper edge polygon (percent coordinates) for clip-path. */
export const tornEdge = (seed: number, side: "top" | "bottom" = "top", points = 18, depth = 2.4) => {
  const pts: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * 100;
    const y = rand(seed + i) * depth;
    pts.push(side === "top" ? `${x}% ${y}%` : `${x}% ${100 - y}%`);
  }
  return side === "top" ? `polygon(${pts.join(",")}, 100% 100%, 0% 100%)` : `polygon(0% 0%, 100% 0%, ${pts.reverse().join(",")})`;
};
