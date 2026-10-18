import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";

/** Locked background: one paper texture for the whole film, plus a soft-light wash. */
export const PaperBackground: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? "#1E2126" : C.paper }}>
      <Img
        src={staticFile(dark ? "textures/paper-dark.jpg" : "textures/paper.jpg")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(63,54,42,0.12)), " +
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.22), transparent 55%)",
          mixBlendMode: "soft-light",
        }}
      />
      {/* drifting halftone field in one corner: printed-matter texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, rgba(21,21,21,0.10) 2.2px, transparent 2.8px)`,
          backgroundSize: "18px 18px",
          backgroundPosition: `${frame * 0.15}px ${frame * 0.1}px`,
          WebkitMaskImage: "radial-gradient(circle at 100% 0%, black 0%, transparent 38%)",
          maskImage: "radial-gradient(circle at 100% 0%, black 0%, transparent 38%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, rgba(31,95,209,0.10) 2.2px, transparent 2.8px)`,
          backgroundSize: "18px 18px",
          WebkitMaskImage: "radial-gradient(circle at 0% 100%, black 0%, transparent 34%)",
          maskImage: "radial-gradient(circle at 0% 100%, black 0%, transparent 34%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Animated film grain + edge vignette over everything. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const i = Math.floor(frame / 2) % 4;
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`textures/grain_${i}.png`)})`,
          backgroundSize: "512px 512px",
          opacity,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(40,30,20,0.22) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/** Halftone dot screen to lay over an element (photos, cut-outs, panels). */
export const Halftone: React.FC<{ color?: string; size?: number; opacity?: number; style?: React.CSSProperties }> = ({
  color = "rgba(21,21,21,0.5)",
  size = 10,
  opacity = 0.35,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `radial-gradient(circle, ${color} ${size * 0.22}px, transparent ${size * 0.3}px)`,
      backgroundSize: `${size}px ${size}px`,
      opacity,
      mixBlendMode: "multiply",
      pointerEvents: "none",
      ...style,
    }}
  />
);
