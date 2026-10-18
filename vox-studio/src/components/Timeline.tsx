import React from "react";
import { Easing, useVideoConfig } from "remotion";
import { enter, progress, ramp } from "../animations/motion";
import { useSceneFrame } from "../lib/layout";
import { C, FONT } from "../lib/theme";

const Check: React.FC<{ size: number; p: number; color?: string }> = ({ size, p, color = C.ok }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill={color} transform={`scale(${p})`} style={{ transformOrigin: "20px 20px" }} />
    <path d="M11 21 L18 28 L30 13" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

/**
 * Horizontal or vertical timeline. A rule fills from the first to the last
 * item between `start` and `end`; each item lands (and optionally gets a
 * check) as the fill reaches it.
 */
export const Timeline: React.FC<{
  items: { label: string; sub?: string }[];
  start: number;
  end: number;
  orientation?: "horizontal" | "vertical";
  length: number;
  checks?: boolean;
  color?: string;
}> = ({ items, start, end, orientation = "horizontal", length, checks = true, color = C.cold }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = progress(frame, start, end, Easing.inOut(Easing.quad));
  const n = items.length;
  const horiz = orientation === "horizontal";
  const step = length / Math.max(1, n - 1);
  return (
    <div style={{ position: "relative", width: horiz ? length : 520, height: horiz ? 190 : length }}>
      <div style={{ position: "absolute", background: C.rule, ...(horiz ? { left: 0, top: 30, width: length, height: 8 } : { left: 30, top: 0, width: 8, height: length }) }} />
      <div style={{ position: "absolute", background: color, ...(horiz ? { left: 0, top: 30, width: length * p, height: 8 } : { left: 30, top: 0, width: 8, height: length * p }) }} />
      {items.map((it, i) => {
        const at = start + ((end - start) * i) / Math.max(1, n - 1);
        const ip = enter(frame, fps, at, { damping: 13, stiffness: 170 });
        const pos = i * step;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...(horiz ? { left: pos, top: 0, transform: "translateX(-50%)" } : { top: pos, left: 0, transform: "translateY(-50%)" }),
              display: "flex",
              flexDirection: horiz ? "column" : "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, borderRadius: 34, border: `4px solid ${frame >= at ? color : C.rule}` }}>
              {checks ? <Check size={52} p={ip} /> : <div style={{ width: 24, height: 24, borderRadius: 12, background: color, transform: `scale(${ip})` }} />}
            </div>
            <div style={{ textAlign: horiz ? "center" : "left", opacity: ramp(frame, at - 4, 8) }}>
              <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 30, letterSpacing: 2, color: C.ink, whiteSpace: "nowrap" }}>{it.label}</div>
              {it.sub ? <div style={{ fontFamily: FONT.sans, fontSize: 24, color: C.inkSoft, marginTop: 4, whiteSpace: "nowrap" }}>{it.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { Check };
