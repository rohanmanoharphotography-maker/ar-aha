import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../lib/layout";
import { C, FONT } from "../lib/theme";
import type { Caption } from "../lib/types";

/**
 * Burned-in editorial captions: 2–3 word groups on an ink plate, white
 * Helvetica-style type, keywords in yellow. Each word lights up on its own
 * spoken frame; the group appears on its first word and clears before the
 * next. Positioned inside the platform-safe band above the bottom UI.
 */
export const Subtitles: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = frame / fps;
  const g = captions.find((c) => t >= c.start && t < c.end);
  if (!g) return null;
  const inF = Math.round(g.start * fps);
  const pop = interpolate(frame, [inF, inF + 5], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.2)) });
  const size = layout.captionSize;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: layout.captionY,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(-50%) scale(${pop})`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: layout.captionMaxW,
          padding: `${size * 0.2}px ${size * 0.36}px ${size * 0.24}px`,
          background: "rgba(16,16,16,0.88)",
          borderRadius: 14,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.12,
          letterSpacing: -0.5,
          textAlign: "center",
          color: "#FFFFFF",
        }}
      >
        {g.words.map((w, i) => {
          const spoken = t >= w.start - 0.03;
          return (
            <React.Fragment key={i}>
              {i > 0 ? " " : null}
              <span style={{ color: w.highlight ? C.highlight : "#FFFFFF", opacity: spoken ? 1 : 0.42 }}>{w.text}</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
