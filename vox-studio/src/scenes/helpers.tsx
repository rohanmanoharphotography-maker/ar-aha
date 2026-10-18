import React from "react";
import { useVideoConfig } from "remotion";
import { enter, ramp, rise } from "../animations/motion";
import { useSceneDuration, useSceneFrame } from "../lib/layout";
import { C, FONT } from "../lib/theme";
import type { PlanScene } from "../lib/types";

/** Resolve a named cue (frames from scene start) with a fallback fraction of the scene. */
export const useCue = (scene: PlanScene) => {
  const dur = useSceneDuration();
  return (name: string, fallbackFraction = 0.3) => scene.cues[name] ?? Math.round(dur * fallbackFraction);
};

/** Absolutely positioned element on the 1000x1160 design stage. */
export const At: React.FC<{ x: number; y: number; w?: number; h?: number; z?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  y,
  w,
  h,
  z,
  children,
  style,
}) => <div style={{ position: "absolute", left: x, top: y, width: w, height: h, zIndex: z, ...style }}>{children}</div>;

/** Spring-rise wrapper: the default entrance for every element. */
export const Rise: React.FC<{ at: number; distance?: number; children: React.ReactNode; rotate?: number; style?: React.CSSProperties; origin?: string }> = ({
  at,
  distance = 180,
  children,
  rotate = 0,
  style,
  origin = "50% 100%",
}) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, at);
  return (
    <div style={{ transform: `translateY(${rise(p, distance)}px) rotate(${rotate}deg)`, opacity: ramp(frame, at, 10), transformOrigin: origin, ...style }}>
      {children}
    </div>
  );
};

/** Pop-in (scale) wrapper for chips, icons and badges. */
export const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, at, { damping: 11, stiffness: 190, mass: 0.6 });
  return <div style={{ transform: `scale(${p})`, opacity: frame >= at ? 1 : 0, ...style }}>{children}</div>;
};

/** Ink label chip. */
export const Tag: React.FC<{ children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.card,
  bg = C.ink,
  size = 30,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      background: bg,
      color,
      fontFamily: FONT.mono,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: 2,
      padding: `${size * 0.25}px ${size * 0.5}px`,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Footnote: React.FC<{ text: string; at?: number; style?: React.CSSProperties }> = ({ text, at = 10, style }) => {
  const frame = useSceneFrame();
  return (
    <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.inkSoft, letterSpacing: 1, opacity: ramp(frame, at, 10) * 0.9, ...style }}>{text}</div>
  );
};
