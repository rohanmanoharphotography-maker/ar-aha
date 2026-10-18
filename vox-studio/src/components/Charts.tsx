import React from "react";
import { Easing, interpolate, useVideoConfig } from "remotion";
import { draw, enter, progress, ramp } from "../animations/motion";
import { useSceneFrame } from "../lib/layout";
import { C, FONT } from "../lib/theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type LinePoint = { x: number; y: number };

/** Smooth SVG path through points (Catmull-Rom → cubic Bézier). */
export const smoothPath = (pts: LinePoint[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

/**
 * Line chart with an optional "safe band" and threshold. Values are in data
 * units; the chart maps them into its own box. The line draws on between
 * `start` and `end`, with a live dot riding the leading edge.
 */
export const LineChart: React.FC<{
  values: number[];
  domain: [number, number];
  width: number;
  height: number;
  start: number;
  end: number;
  band?: [number, number];
  bandLabel?: string;
  threshold?: number;
  color?: string;
  unit?: string;
  ticks?: number[];
  lineWidth?: number;
}> = ({ values, domain, width, height, start, end, band, bandLabel, threshold, color = C.cold, unit = "°C", ticks = [], lineWidth = 8 }) => {
  const frame = useSceneFrame();
  const padL = 70;
  const w = width - padL - 10;
  const sy = (v: number) => height - ((v - domain[0]) / (domain[1] - domain[0])) * height;
  const pts = values.map((v, i) => ({ x: padL + (i / (values.length - 1)) * w, y: sy(v) }));
  const d = smoothPath(pts);
  const p = progress(frame, start, end, Easing.inOut(Easing.quad));
  // leading-edge dot: interpolate along x
  const fx = p * (values.length - 1);
  const i0 = Math.min(values.length - 2, Math.floor(fx));
  const dotV = values[i0] + (values[i0 + 1] - values[i0]) * (fx - i0);
  const dot = { x: padL + (fx / (values.length - 1)) * w, y: sy(dotV) };
  const out = (threshold !== undefined && dotV > threshold) || (band && (dotV > band[1] || dotV < band[0]));
  return (
    <svg width={width} height={height + 40} viewBox={`0 0 ${width} ${height + 40}`} style={{ overflow: "visible" }}>
      {band ? (
        <g opacity={ramp(frame, start - 10, 12)}>
          <rect x={padL} y={sy(band[1])} width={w} height={sy(band[0]) - sy(band[1])} fill={C.iceLight} />
          <line x1={padL} x2={padL + w} y1={sy(band[1])} y2={sy(band[1])} stroke={C.ice} strokeWidth={3} strokeDasharray="10 8" />
          <line x1={padL} x2={padL + w} y1={sy(band[0])} y2={sy(band[0])} stroke={C.ice} strokeWidth={3} strokeDasharray="10 8" />
          {bandLabel ? (
            <text x={padL + w - 12} y={sy(band[1]) + 34} textAnchor="end" fontFamily={FONT.mono} fontWeight={600} fontSize={24} fill={C.coldDeep}>
              {bandLabel}
            </text>
          ) : null}
        </g>
      ) : null}
      {threshold !== undefined ? (
        <line x1={padL} x2={padL + w} y1={sy(threshold)} y2={sy(threshold)} stroke={C.warm} strokeWidth={4} strokeDasharray="14 10" opacity={ramp(frame, start - 10, 12)} />
      ) : null}
      {ticks.map((t) => (
        <text key={t} x={padL - 16} y={sy(t) + 9} textAnchor="end" fontFamily={FONT.mono} fontSize={26} fontWeight={600} fill={C.inkSoft} opacity={ramp(frame, start - 8, 10)}>
          {t}
          {unit}
        </text>
      ))}
      <line x1={padL} x2={padL} y1={0} y2={height} stroke={C.ink} strokeWidth={3} opacity={0.6} />
      <line x1={padL} x2={padL + w} y1={height} y2={height} stroke={C.ink} strokeWidth={3} opacity={0.6} />
      <path d={d} fill="none" stroke={color} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p > 0.001 ? (
        <g>
          <circle cx={dot.x} cy={dot.y} r={20} fill={out ? C.warm : color} opacity={0.25} />
          <circle cx={dot.x} cy={dot.y} r={11} fill={out ? C.warm : color} stroke={C.card} strokeWidth={4} />
        </g>
      ) : null}
    </svg>
  );
};

/** Vertical bar chart; bars grow in sequence from `start`. */
export const BarChart: React.FC<{
  bars: { label: string; value: number; color?: string }[];
  max: number;
  width: number;
  height: number;
  start: number;
  stagger?: number;
  showValues?: boolean;
  unit?: string;
}> = ({ bars, max, width, height, start, stagger = 6, showValues = true, unit = "" }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const gap = 26;
  const bw = (width - gap * (bars.length - 1)) / bars.length;
  return (
    <svg width={width} height={height + 70} viewBox={`0 0 ${width} ${height + 70}`} style={{ overflow: "visible" }}>
      {bars.map((b, i) => {
        const p = enter(frame, fps, start + i * stagger, { damping: 16, stiffness: 120 });
        const h = (b.value / max) * height * p;
        const x = i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={bw} height={h} fill={b.color ?? C.cold} />
            {showValues ? (
              <text x={x + bw / 2} y={height - h - 14} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={C.ink} opacity={p}>
                {Math.round(b.value * p)}
                {unit}
              </text>
            ) : null}
            <text x={x + bw / 2} y={height + 44} textAnchor="middle" fontFamily={FONT.mono} fontWeight={600} fontSize={26} fill={C.inkSoft} opacity={ramp(frame, start + i * stagger, 10)}>
              {b.label}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={width} y1={height} y2={height} stroke={C.ink} strokeWidth={4} />
    </svg>
  );
};

/** A qualitative "potency" meter (no numbers — used when data would be invented). */
export const Meter: React.FC<{ level: number; color: string; width: number; height?: number; label?: string }> = ({
  level,
  color,
  width,
  height = 34,
  label,
}) => (
  <div style={{ width }}>
    {label ? (
      <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 600, letterSpacing: 3, color: C.inkSoft, marginBottom: 10, textTransform: "uppercase" }}>
        {label}
      </div>
    ) : null}
    <div style={{ width, height, background: C.paperDeep, border: `3px solid ${C.ink}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(level, [0, 1], [0, 100], clamp)}%`, background: color }} />
    </div>
  </div>
);

export { draw };
