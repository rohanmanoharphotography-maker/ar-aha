import React from "react";
import { Easing, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { enter, rand, tornEdge } from "../animations/motion";
import { useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import { Halftone } from "./Paper";

/**
 * Editorial collage card: a photo (or any illustration passed as children)
 * revealed by a torn-paper mask that rises, with a paper-cut offset stroke,
 * slight rotation and an optional halftone screen.
 */
export const ImageReveal: React.FC<{
  src?: string;
  children?: React.ReactNode;
  width: number;
  height: number;
  start: number;
  rotate?: number;
  stroke?: string;
  halftone?: boolean;
  grayscale?: boolean;
  seed?: number;
  caption?: string;
}> = ({ src, children, width, height, start, rotate = -1.2, stroke = C.warm, halftone = true, grayscale = false, seed = 3, caption }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, start, { damping: 20, stiffness: 90 });
  const reveal = interpolate(frame, [start, start + 16], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const r = rotate + (rand(seed) - 0.5) * 0.6;
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        transform: `translateY(${(1 - p) * 120}px) rotate(${r}deg)`,
        filter: paperCut(stroke, 14, 10),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.card,
          clipPath: `inset(${reveal}% 0 0 0)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 14, overflow: "hidden", clipPath: tornEdge(seed, "bottom", 22, 1.6) }}>
          {src ? (
            <Img
              src={src.startsWith("http") ? src : staticFile(src)}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: grayscale ? "grayscale(1) contrast(1.15)" : "contrast(1.05)" }}
            />
          ) : (
            children
          )}
          {halftone ? <Halftone opacity={0.18} size={9} /> : null}
        </div>
        {caption ? (
          <div style={{ position: "absolute", left: 18, bottom: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: C.inkSoft }}>{caption}</div>
        ) : null}
      </div>
    </div>
  );
};
