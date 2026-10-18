// The locked visual system. Every scene is a variation on these tokens:
// one paper, one ink, one cold accent, one warning red, one highlighter.

export const C = {
  paper: "#ECE6D9",
  paperDeep: "#E1D8C6",
  card: "#F7F3EA",
  ink: "#151515",
  inkSoft: "#4A4740",
  rule: "#B9AF9C",
  cold: "#1F5FD1",
  coldDeep: "#163F8C",
  ice: "#9FCBEA",
  iceLight: "#D7EAF6",
  warm: "#E04329",
  amber: "#EE9B32",
  highlight: "#F7C948",
  ok: "#2E8B57",
  shadow: "rgba(55, 45, 31, 0.28)",
} as const;

export const FONT = {
  sans: "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', 'DejaVu Sans Mono', monospace",
} as const;

export const SHADOW = `drop-shadow(0 22px 22px ${C.shadow})`;

/** Offset solid silhouette + soft shadow: the paper-cut "marker stroke". */
export const paperCut = (color: string = C.warm, dx = 12, dy = 8) =>
  `drop-shadow(${dx}px ${dy}px 0 ${color}) drop-shadow(0 24px 22px ${C.shadow})`;

export const SPRING: { damping: number; mass: number; stiffness: number } = { damping: 18, mass: 0.75, stiffness: 110 };
