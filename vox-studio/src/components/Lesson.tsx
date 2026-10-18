// Teaching components: maths typography, worked-equation boards, energy
// stores, flow arrows, Sankey diagrams and "pause and try it" prompts.
import React from "react";
import { Easing, interpolate, useVideoConfig } from "remotion";
import { draw, enter, progress, ramp } from "../animations/motion";
import { useSceneFrame, useScenePauses } from "../lib/layout";
import { C, FONT, SHADOW } from "../lib/theme";
import { Marker } from "./Typography";

/** Plain-text maths: `E_k`, `m_1`, `v^2` render as sub/superscripts. */
export const MathText: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const parts = text.split(/(_\{[^}]+\}|_[A-Za-z0-9]+|\^[0-9]+)/g).filter(Boolean);
  return (
    <span style={{ whiteSpace: "nowrap", ...style }}>
      {parts.map((p, i) =>
        p.startsWith("_") ? (
          <sub key={i} style={{ fontSize: "0.6em", verticalAlign: "-0.25em" }}>
            {p.slice(1).replace(/[{}]/g, "")}
          </sub>
        ) : p.startsWith("^") ? (
          <sup key={i} style={{ fontSize: "0.6em", verticalAlign: "0.7em", lineHeight: 0 }}>
            {p.slice(1)}
          </sup>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </span>
  );
};

/** "Pause and try it" badge with a countdown ring, shown during silent practice pauses. */
export const PauseBadge: React.FC<{ label?: string }> = ({ label = "Pause & try it" }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const pauses = useScenePauses();
  const p = pauses.find((w) => frame >= w.start - 6 && frame <= w.end + 6);
  if (!p) return null;
  const pin = enter(frame, fps, p.start - 6, { damping: 12, stiffness: 200 });
  const out = interpolate(frame, [p.end, p.end + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const left = interpolate(frame, [p.start, p.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const secs = Math.max(0, Math.ceil(((p.end - frame) / fps) * 1));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: C.ink,
        color: C.card,
        padding: "14px 26px 14px 16px",
        borderRadius: 60,
        transform: `scale(${pin * out})`,
        transformOrigin: "100% 50%",
        filter: SHADOW,
      }}
    >
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="27" fill="none" stroke="#ffffff33" strokeWidth="7" />
        <circle cx="32" cy="32" r="27" fill="none" stroke={C.highlight} strokeWidth="7" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - left} transform="rotate(-90 32 32)" strokeLinecap="round" />
        <text x="32" y="42" textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize="28" fill={C.card}>
          {secs}
        </text>
      </svg>
      <svg width={30} height={36} viewBox="0 0 30 36">
        <rect x="2" y="2" width="9" height="32" rx="2" fill={C.highlight} />
        <rect x="19" y="2" width="9" height="32" rx="2" fill={C.highlight} />
      </svg>
      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 40, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

/**
 * A worked-equation board: each line rises in on its spoken cue; the result
 * line is boxed and highlighted.
 */
export const EquationBoard: React.FC<{
  lines: { text: string; at: number; result?: boolean }[];
  size?: number;
  gap?: number;
}> = ({ lines, size = 66, gap = 34 }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {lines.map((l, i) => {
        const p = enter(frame, fps, l.at, { damping: 20, stiffness: 140 });
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: 8 }}>
            <div
              style={{
                transform: `translateY(${(1 - p) * 110}%)`,
                opacity: ramp(frame, l.at, 8),
                fontFamily: FONT.sans,
                fontWeight: l.result ? 900 : 700,
                fontSize: l.result ? size * 1.15 : size,
                letterSpacing: -1,
                color: l.result ? C.ink : C.ink,
                display: "inline-block",
                padding: l.result ? "6px 20px" : 0,
                border: l.result ? `6px solid ${C.ink}` : undefined,
                background: l.result ? C.card : undefined,
                filter: l.result ? SHADOW : undefined,
              }}
            >
              {l.result ? (
                <Marker start={l.at + 8}>
                  <MathText text={l.text} />
                </Marker>
              ) : (
                <MathText text={l.text} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** "Given" card listing values; a value can be converted (g → kg) on its cue. */
export const GivenCard: React.FC<{ items: { sym: string; value: string; convert?: string; at?: number }[]; start: number; width?: number }> = ({
  items,
  start,
  width = 640,
}) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, start);
  return (
    <div
      style={{
        width,
        background: C.card,
        border: `4px solid ${C.ink}`,
        padding: "22px 30px",
        filter: SHADOW,
        transform: `translateY(${(1 - p) * 140}px) rotate(-0.8deg)`,
        opacity: ramp(frame, start, 10),
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: C.inkSoft, marginBottom: 10 }}>GIVEN</div>
      {items.map((it, i) => {
        const conv = it.convert && it.at !== undefined ? progress(frame, it.at, it.at + 14, Easing.out(Easing.cubic)) : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: FONT.sans, fontWeight: 800, fontSize: 52, color: C.ink, lineHeight: 1.35, whiteSpace: "nowrap" }}>
            <MathText text={`${it.sym} =`} style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700 }} />
            <span style={{ position: "relative", color: conv > 0.5 ? C.inkSoft : C.ink }}>
              {it.value}
              {it.convert ? <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 6, background: C.warm, transform: `scaleX(${conv})`, transformOrigin: "left" }} /> : null}
            </span>
            {it.convert ? (
              <span style={{ opacity: conv, transform: `translateX(${(1 - conv) * -20}px)`, display: "inline-flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: C.warm }}>→</span>
                <Marker start={(it.at ?? 0) + 10}>{it.convert}</Marker>
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/** Sticky-note tip (e.g. "square the speed!"). */
export const Sticky: React.FC<{ text: string; at: number; color?: string; rotate?: number; width?: number }> = ({ text, at, color = C.highlight, rotate = 2, width = 520 }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, at, { damping: 12, stiffness: 170 });
  return (
    <div
      style={{
        width,
        background: color,
        padding: "20px 26px",
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: 36,
        color: C.ink,
        transform: `rotate(${rotate}deg) scale(${p})`,
        opacity: frame >= at ? 1 : 0,
        filter: SHADOW,
        lineHeight: 1.2,
      }}
    >
      <span style={{ color: C.warm }}>⚠ </span>
      <MathText text={text} style={{ whiteSpace: "normal" }} />
    </div>
  );
};

/** An energy store drawn as a round jar whose fill level animates. */
export const EnergyStore: React.FC<{
  label: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  fill: number;
  at: number;
  size?: number;
  labelSide?: "below" | "right";
}> = ({ label, sub, icon, color, fill, at, size = 220, labelSide = "below" }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, at, { damping: 13, stiffness: 160 });
  const r = size / 2 - 6;
  const level = size - 6 - fill * (size - 12);
  const wave = Math.sin(frame / 6) * 4;
  const id = `clip-${label.replace(/\W/g, "")}-${size}`;
  return (
    <div style={{ display: "flex", flexDirection: labelSide === "below" ? "column" : "row", alignItems: "center", gap: 14, transform: `scale(${p})`, opacity: frame >= at ? 1 : 0 }}>
      <div style={{ position: "relative", width: size, height: size, filter: SHADOW }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id={id}>
              <circle cx={size / 2} cy={size / 2} r={r} />
            </clipPath>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill={C.card} />
          <path
            clipPath={`url(#${id})`}
            d={`M0 ${level} Q ${size / 4} ${level - wave} ${size / 2} ${level} T ${size} ${level} L ${size} ${size} L 0 ${size} Z`}
            fill={color}
            opacity={0.85}
          />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.ink} strokeWidth={6} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ textAlign: labelSide === "below" ? "center" : "left" }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, letterSpacing: 2, color: C.ink, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</div>
        {sub ? <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 28, color: C.inkSoft, whiteSpace: "nowrap" }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Curved arrow that draws on between `start` and `end`. */
export const FlowArrow: React.FC<{ d: string; start: number; end?: number; color?: string; width?: number; head: { x: number; y: number; angle: number } }> = ({
  d,
  start,
  end,
  color = C.ink,
  width = 10,
  head,
}) => {
  const frame = useSceneFrame();
  const off = draw(frame, start, end ?? start + 14);
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={off} />
      <g transform={`translate(${head.x} ${head.y}) rotate(${head.angle})`} opacity={off < 0.05 ? 1 : 0}>
        <path d={`M0 0 L${-width * 2.6} ${-width * 1.6} L${-width * 2.6} ${width * 1.6} Z`} fill={color} />
      </g>
    </g>
  );
};

type Band = { x0: number; y0: number; x1: number; y1: number; w: number; color: string; label?: string; sub?: string; labelY?: number; arrow?: boolean };

const bandPath = ({ x0, y0, x1, y1, w }: Band) => {
  const mx = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + w} C ${mx} ${y1 + w}, ${mx} ${y0 + w}, ${x0} ${y0 + w} Z`;
};

/** Sankey diagram: bands are drawn left-to-right as `p` goes 0 → 1. */
export const Sankey: React.FC<{ bands: Band[]; width: number; height: number; start: number; end: number }> = ({ bands, width, height, start, end }) => {
  const frame = useSceneFrame();
  const p = progress(frame, start, end, Easing.inOut(Easing.quad));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="sankey-reveal">
          <rect x={-10} y={-200} width={(width + 40) * p} height={height + 400} />
        </clipPath>
      </defs>
      <g clipPath="url(#sankey-reveal)" style={{ filter: "drop-shadow(0 12px 12px rgba(55,45,31,0.22))" }}>
        {bands.map((b, i) => (
          <g key={i}>
            <path d={bandPath(b)} fill={b.color} stroke={C.ink} strokeWidth={3} />
            {b.arrow ? <path d={`M ${b.x1} ${b.y1 - 12} L ${b.x1 + 36} ${b.y1 + b.w / 2} L ${b.x1} ${b.y1 + b.w + 12} Z`} fill={b.color} stroke={C.ink} strokeWidth={3} /> : null}
          </g>
        ))}
      </g>
      {bands
        .filter((b) => b.label)
        .map((b, i) => {
          const at = start + (end - start) * Math.min(1, b.x1 / width);
          return (
            <g key={`l${i}`} opacity={ramp(frame, at - 4, 10)}>
              <text x={b.x1 + 52} y={(b.labelY ?? b.y1 + b.w / 2) + 4} fontFamily={FONT.mono} fontWeight={600} fontSize={27} fill={C.ink}>
                {b.label}
              </text>
              {b.sub ? (
                <text x={b.x1 + 52} y={(b.labelY ?? b.y1 + b.w / 2) + 36} fontFamily={FONT.serif} fontStyle="italic" fontSize={26} fill={C.inkSoft}>
                  {b.sub}
                </text>
              ) : null}
            </g>
          );
        })}
    </svg>
  );
};
