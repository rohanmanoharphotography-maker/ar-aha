// Code-drawn physics-lesson art in the same paper-cut style as index.tsx.
import React from "react";
import { C, FONT } from "../lib/theme";

type Base = { width: number; style?: React.CSSProperties };
const ink = { stroke: C.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const COPPER = "#C27C3E";
export const BRASS = "#D9A441";
export const WOOD = "#C99A5B";
export const WOOD_DARK = "#A87A40";

/** Bullet (projectile only), side view, pointing right. viewBox 240×80. */
export const Bullet: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 240 80" style={{ overflow: "visible", ...style }}>
    <path d="M6 12 L120 12 C175 12 222 26 234 40 C222 54 175 68 120 68 L6 68 Z" fill={COPPER} {...ink} />
    <path d="M18 22 L118 22 C150 22 182 28 204 34" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
    <line x1="30" y1="12" x2="30" y2="68" stroke={C.ink} strokeWidth="4" opacity="0.5" />
  </svg>
);

/** Cartridge cut-away: brass case with propellant grains, bullet seated on top. viewBox 300×110. */
export const Cartridge: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 300 110" style={{ overflow: "visible", ...style }}>
    <path d="M150 20 L215 20 C258 20 288 40 296 55 C288 70 258 90 215 90 L150 90 Z" fill={COPPER} {...ink} />
    <rect x="8" y="14" width="150" height="82" rx="6" fill={BRASS} {...ink} />
    <rect x="22" y="28" width="122" height="54" fill="#3B3226" />
    {Array.from({ length: 26 }).map((_, i) => (
      <circle key={i} cx={30 + ((i * 37) % 108)} cy={36 + ((i * 17) % 40)} r={4} fill={i % 3 ? C.amber : "#F4D27A"} />
    ))}
    <rect x="0" y="8" width="16" height="94" rx="4" fill={BRASS} {...ink} />
  </svg>
);

/** A block of wood in three-quarter view with grain. viewBox 420×340; front face x 0–360, y 60–340. */
export const WoodBlock: React.FC<Base & { hole?: boolean }> = ({ width, style, hole }) => (
  <svg width={width} viewBox="0 0 420 340" style={{ overflow: "visible", ...style }}>
    <path d="M0 60 L60 0 L420 0 L360 60 Z" fill="#DDB57A" {...ink} />
    <path d="M360 60 L420 0 L420 280 L360 340 Z" fill={WOOD_DARK} {...ink} />
    <rect x="0" y="60" width="360" height="280" fill={WOOD} {...ink} />
    {[100, 150, 205, 262, 310].map((y, i) => (
      <path key={y} d={`M8 ${y} C 90 ${y - 14 + i * 3}, 200 ${y + 16}, 352 ${y - 6}`} fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" />
    ))}
    <ellipse cx="250" cy="190" rx="34" ry="16" fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" />
    {hole ? <circle cx="0" cy="200" r="16" fill="#3B2A16" /> : null}
  </svg>
);

/** Store icons */
export const Flame: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 100 120" style={{ overflow: "visible", ...style }}>
    <path d="M50 4 C62 30 88 44 88 76 C88 100 70 116 50 116 C30 116 12 100 12 76 C12 56 26 46 32 30 C38 46 44 50 50 4 Z" fill={C.warm} {...ink} />
    <path d="M50 56 C58 70 70 76 70 92 C70 104 61 110 50 110 C39 110 30 104 30 92 C30 80 42 74 50 56 Z" fill={C.highlight} />
  </svg>
);

export const SoundWaves: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 120 100" style={{ overflow: "visible", ...style }}>
    <path d="M8 36 L30 36 L56 14 L56 86 L30 64 L8 64 Z" fill={C.inkSoft} {...ink} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${70 + i * 16} ${32 - i * 10} C ${84 + i * 18} ${44 - i * 4}, ${84 + i * 18} ${56 + i * 4}, ${70 + i * 16} ${68 + i * 10}`} fill="none" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
    ))}
  </svg>
);

export const Splinter: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 120 100" style={{ overflow: "visible", ...style }}>
    <rect x="10" y="20" width="100" height="70" fill={WOOD} {...ink} />
    <path d="M40 20 L52 46 L42 58 L60 90" fill="none" stroke={C.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M78 20 L70 40 L84 52" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 8 L32 18 M100 6 L92 18" stroke={WOOD_DARK} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const Wind: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 120 90" style={{ overflow: "visible", ...style }}>
    {[20, 45, 70].map((y, i) => (
      <path key={y} d={`M8 ${y} L${80 - i * 10} ${y} C ${100 - i * 10} ${y}, ${100 - i * 10} ${y - 18}, ${84 - i * 10} ${y - 18}`} fill="none" stroke={C.cold} strokeWidth="7" strokeLinecap="round" />
    ))}
  </svg>
);

/** Labelled mass tag, e.g. "2.0 kg". */
export const MassTag: React.FC<{ text: string; color?: string }> = ({ text, color = C.ink }) => (
  <div style={{ display: "inline-block", fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, color: C.card, background: color, padding: "4px 12px", whiteSpace: "nowrap" }}>{text}</div>
);
