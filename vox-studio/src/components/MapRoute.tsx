import React from "react";
import { Easing, useVideoConfig } from "remotion";
import { enter, progress, ramp } from "../animations/motion";
import { useSceneFrame } from "../lib/layout";
import { C, FONT, paperCut } from "../lib/theme";

type Pt = { x: number; y: number };

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

/** Control point bowed perpendicular to the segment, alternating sides. */
const ctrl = (a: Pt, b: Pt, i: number, bow: number): Pt => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const s = i % 2 === 0 ? 1 : -1;
  return { x: mx - (dy / len) * bow * s, y: my + (dx / len) * bow * s };
};

/** A stylised, non-specific landmass (deliberately not a real geography). */
const LAND =
  "M 70 210 C 120 120 260 90 360 120 C 440 145 470 90 560 80 C 680 66 800 120 880 190 C 940 245 930 330 900 400 " +
  "C 870 470 910 540 880 610 C 850 690 760 720 690 760 C 610 806 560 880 470 890 C 380 900 300 850 240 790 " +
  "C 180 730 120 700 90 620 C 60 540 100 470 80 400 C 62 335 30 280 70 210 Z";

/**
 * Animated route map: graticule + landmass, a dashed route that draws from
 * stop to stop, stop pins that pop as the route reaches them, and a marker
 * (e.g. a snowflake/truck chip) riding the leading edge.
 */
export const MapRoute: React.FC<{
  stops: { x: number; y: number; label: string; icon?: React.ReactNode }[];
  start: number;
  end: number;
  width?: number;
  height?: number;
  routeColor?: string;
  marker?: React.ReactNode;
}> = ({ stops, start, end, width = 1000, height = 960, routeColor = C.cold, marker }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const segs = stops.slice(0, -1).map((a, i) => ({ a, b: stops[i + 1], c: ctrl(a, stops[i + 1], i, 90) }));
  const p = progress(frame, start, end, Easing.inOut(Easing.cubic));
  const segP = p * segs.length;
  const cur = Math.min(segs.length - 1, Math.floor(segP));
  const local = Math.min(1, segP - cur);
  const head = segs.length ? quad(segs[cur].a, segs[cur].c, segs[cur].b, local) : stops[0];
  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} viewBox="0 0 1000 960" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.2" fill={C.ink} opacity="0.16" />
          </pattern>
        </defs>
        {/* graticule */}
        <g opacity={0.35 * ramp(frame, start - 30, 20)} stroke={C.rule} strokeWidth={2}>
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} x2={1000} y1={80 + i * 135} y2={80 + i * 135} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} y1={0} y2={960} x1={40 + i * 135} x2={40 + i * 135} />
          ))}
        </g>
        <g style={{ filter: `drop-shadow(10px 10px 0 ${C.paperDeep})` }} opacity={ramp(frame, start - 30, 16)}>
          <path d={LAND} fill={C.card} stroke={C.ink} strokeWidth={4} />
          <path d={LAND} fill="url(#dots)" />
        </g>
        {segs.map((s, i) => {
          const sp = Math.max(0, Math.min(1, segP - i));
          return (
            <g key={i}>
              <path d={`M ${s.a.x} ${s.a.y} Q ${s.c.x} ${s.c.y} ${s.b.x} ${s.b.y}`} fill="none" stroke={C.ink} strokeOpacity={0.12} strokeWidth={14} strokeLinecap="round" />
              <path
                d={`M ${s.a.x} ${s.a.y} Q ${s.c.x} ${s.c.y} ${s.b.x} ${s.b.y}`}
                fill="none"
                stroke={routeColor}
                strokeWidth={12}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - sp}
              />
            </g>
          );
        })}
      </svg>
      {stops.map((s, i) => {
        const reach = start + ((end - start) * i) / Math.max(1, stops.length - 1);
        const sp = enter(frame, fps, reach - 4, { damping: 12, stiffness: 160 });
        return (
          <div key={i} style={{ position: "absolute", left: (s.x / 1000) * width, top: (s.y / 960) * height, transform: `translate(-50%, -100%) scale(${sp})`, transformOrigin: "50% 100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ filter: paperCut(C.ice, 8, 6), width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
              <div
                style={{
                  marginTop: 4,
                  background: C.ink,
                  color: C.card,
                  fontFamily: FONT.mono,
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: 2,
                  padding: "6px 14px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: C.warm, border: `5px solid ${C.card}`, marginTop: 10 }} />
            </div>
          </div>
        );
      })}
      {marker && p > 0.01 && p < 0.995 ? (
        <div style={{ position: "absolute", left: (head.x / 1000) * width, top: (head.y / 960) * height, transform: "translate(-50%, -50%)" }}>{marker}</div>
      ) : null}
    </div>
  );
};
