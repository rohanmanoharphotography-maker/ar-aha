import React from "react";
import { Easing, interpolate, useVideoConfig } from "remotion";
import { enter, progress, ramp } from "../animations/motion";
import { useSceneFrame } from "../lib/layout";
import { C, FONT } from "../lib/theme";

/** Small mono label with a red rule that draws on: the scene's "chapter" marker. */
export const Kicker: React.FC<{ text: string; start?: number; color?: string; style?: React.CSSProperties }> = ({
  text,
  start = 0,
  color = C.ink,
  style,
}) => {
  const frame = useSceneFrame();
  const p = progress(frame, start, start + 14, Easing.out(Easing.cubic));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, ...style }}>
      <div style={{ width: 64 * p, height: 6, background: C.warm }} />
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: 5,
          textTransform: "uppercase",
          color,
          opacity: ramp(frame, start + 4, 10),
          transform: `translateX(${(1 - p) * -20}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Yellow highlighter that sweeps behind a phrase. */
export const Marker: React.FC<{ children: React.ReactNode; start: number; color?: string; dur?: number }> = ({
  children,
  start,
  color = C.highlight,
  dur = 10,
}) => {
  const frame = useSceneFrame();
  const p = progress(frame, start, start + dur, Easing.out(Easing.cubic));
  return (
    <span style={{ position: "relative", display: "inline-block", zIndex: 0 }}>
      <span
        style={{
          position: "absolute",
          left: "-0.08em",
          right: "-0.08em",
          top: "0.12em",
          bottom: "0.02em",
          background: color,
          transform: `scaleX(${p}) skewX(-6deg)`,
          transformOrigin: "left center",
          zIndex: -1,
        }}
      />
      {children}
    </span>
  );
};

/**
 * Animated headline: each line rises out of its own mask, staggered.
 * `highlight` (a word) gets the marker sweep once its line lands.
 */
export const AnimatedTitle: React.FC<{
  lines: string[];
  start?: number;
  stagger?: number;
  size?: number;
  color?: string;
  highlight?: string;
  highlightColor?: string;
  align?: "left" | "center";
  font?: "sans" | "serif";
  lineHeight?: number;
}> = ({
  lines,
  start = 0,
  stagger = 6,
  size = 130,
  color = C.ink,
  highlight,
  highlightColor = C.highlight,
  align = "left",
  font = "sans",
  lineHeight = 0.95,
}) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ textAlign: align }}>
      {lines.map((line, i) => {
        const s = start + i * stagger;
        const p = enter(frame, fps, s, { damping: 20, stiffness: 140 });
        const y = interpolate(p, [0, 1], [105, 0]);
        return (
          <div key={i} style={{ overflow: "hidden", lineHeight, paddingBottom: size * 0.06 }}>
            <div
              style={{
                fontFamily: font === "sans" ? FONT.sans : FONT.serif,
                fontWeight: font === "sans" ? 900 : 700,
                fontSize: size,
                letterSpacing: font === "sans" ? -size * 0.035 : -1,
                textTransform: font === "sans" ? "uppercase" : "none",
                color,
                transform: `translateY(${y}%)`,
                whiteSpace: "nowrap",
              }}
            >
              {line.split(" ").map((w, j) => (
                <React.Fragment key={j}>
                  {j > 0 ? " " : null}
                  {highlight && w.replace(/[^\w°]/g, "").toUpperCase() === highlight.toUpperCase() ? (
                    <Marker start={s + 10} color={highlightColor}>
                      {w}
                    </Marker>
                  ) : (
                    w
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Word-by-word kinetic text synced to the narration's word timings. */
export const KineticText: React.FC<{
  words: { text: string; start: number; highlight?: boolean }[];
  size?: number;
  color?: string;
  maxWidth?: number;
  align?: "left" | "center";
}> = ({ words, size = 92, color = C.ink, maxWidth = 920, align = "left" }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        maxWidth,
        display: "flex",
        flexWrap: "wrap",
        gap: `${size * 0.12}px ${size * 0.26}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: -size * 0.03,
        textTransform: "uppercase",
      }}
    >
      {words.map((w, i) => {
        const f = Math.round(w.start * fps);
        const p = enter(frame, fps, f, { damping: 14, stiffness: 180 });
        return (
          <span
            key={i}
            style={{
              color: w.highlight ? C.cold : color,
              opacity: ramp(frame, f, 4) * 0.85 + (frame >= f ? 0.15 : 0),
              transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
              display: "inline-block",
            }}
          >
            {w.highlight ? <Marker start={f + 3}>{w.text}</Marker> : w.text}
          </span>
        );
      })}
    </div>
  );
};

/** Number counter that lands exactly on its cue frame. */
export const Counter: React.FC<{
  from?: number;
  to: number;
  start: number;
  end: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ from = 0, to, start, end, decimals = 0, prefix = "", suffix = "", size = 160, color = C.ink, style }) => {
  const frame = useSceneFrame();
  const p = progress(frame, start, end, Easing.out(Easing.cubic));
  const v = from + (to - from) * p;
  return (
    <div
      style={{
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -size * 0.04,
        color,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        opacity: ramp(frame, start, 6),
        ...style,
      }}
    >
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </div>
  );
};

/** Rubber stamp that slams in. */
export const Stamp: React.FC<{ text: string; sub?: string; start: number; color?: string; rotate?: number; size?: number }> = ({
  text,
  sub,
  start,
  color = C.warm,
  rotate = -8,
  size = 96,
}) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, start, { damping: 12, stiffness: 220, mass: 0.6 });
  const s = interpolate(p, [0, 1], [1.8, 1]);
  return (
    <div
      style={{
        display: "inline-block",
        padding: `${size * 0.14}px ${size * 0.3}px`,
        border: `${size * 0.08}px solid ${color}`,
        borderRadius: 10,
        color,
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 2,
        lineHeight: 1,
        textAlign: "center",
        transform: `rotate(${rotate}deg) scale(${s})`,
        opacity: frame >= start ? Math.min(1, p * 2) : 0,
        WebkitMaskImage: "radial-gradient(circle at 30% 40%, black 60%, rgba(0,0,0,0.75) 100%)",
        background: "rgba(247,243,234,0.6)",
      }}
    >
      {text}
      {sub ? (
        <div style={{ fontFamily: FONT.mono, fontSize: size * 0.28, fontWeight: 600, letterSpacing: 4, marginTop: 8, textTransform: "uppercase" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};
