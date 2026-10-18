import React, { createContext, useContext } from "react";
import { Easing, interpolate } from "remotion";
import { useSceneDuration, useSceneFrame } from "../lib/layout";

const CameraCtx = createContext({ t: 0 });

/**
 * Slow documentary camera: a push-in plus drift across the scene. Children
 * wrapped in <ParallaxLayer> move against each other by depth.
 */
export const Camera: React.FC<{
  children: React.ReactNode;
  zoom?: [number, number];
  drift?: [number, number];
  rotate?: [number, number];
  /** extra punch-in at a frame (scene-relative) */
  punchAt?: number;
  punch?: number;
}> = ({ children, zoom = [1, 1.06], drift = [0, -16], rotate = [0, 0], punchAt, punch = 0.04 }) => {
  const frame = useSceneFrame();
  const dur = useSceneDuration();
  const t = interpolate(frame, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = Easing.inOut(Easing.sin)(t);
  let s = zoom[0] + (zoom[1] - zoom[0]) * e;
  if (punchAt !== undefined) {
    s += interpolate(frame, [punchAt, punchAt + 10], [0, punch], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2)),
    });
  }
  const x = drift[0] * (e - 0.5) * 2;
  const y = drift[1] * (e - 0.5) * 2;
  const r = rotate[0] + (rotate[1] - rotate[0]) * e;
  return (
    <CameraCtx.Provider value={{ t: e }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`,
          transformOrigin: "50% 45%",
        }}
      >
        {children}
      </div>
    </CameraCtx.Provider>
  );
};

/** A layer that travels `travel` px across the scene, scaled by depth. */
export const ParallaxLayer: React.FC<{
  depth: number;
  travel?: [number, number];
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ depth, travel = [-60, 0], children, style }) => {
  const { t } = useContext(CameraCtx);
  const x = travel[0] * depth * (t - 0.5) * 2;
  const y = travel[1] * depth * (t - 0.5) * 2;
  return <div style={{ position: "absolute", inset: 0, transform: `translate(${x}px, ${y}px)`, ...style }}>{children}</div>;
};
