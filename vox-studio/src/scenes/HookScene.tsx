import React from "react";
import { Easing, interpolate } from "remotion";
import { float, progress } from "../animations/motion";
import { Camera, ParallaxLayer } from "../components/Camera";
import { AnimatedTitle, Kicker } from "../components/Typography";
import { Vial } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Pop, Rise, Tag, useCue } from "./helpers";

type Props = { kicker: string; lines: string[]; highlight?: string; illustration?: string };

/** Cold open: the hook headline over a single hero object, with a "can you see it?" lens. */
export const HookScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const title = cue("title", 0.15);
  const eye = cue("eye", 0.8);
  const lensP = progress(frame, eye - 22, eye + 6, Easing.inOut(Easing.cubic));
  const lensX = interpolate(lensP, [0, 1], [-220, 0]);
  return (
    <Camera zoom={[1.0, 1.07]} drift={[0, -20]} punchAt={title} punch={0.03}>
      <ParallaxLayer depth={0.4} travel={[0, 30]}>
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={2} />
        </At>
        <At x={36} y={70}>
          <AnimatedTitle lines={props.lines} start={title - 4} size={120} highlight={props.highlight} />
        </At>
      </ParallaxLayer>
      <ParallaxLayer depth={1} travel={[0, -40]}>
        <At x={590} y={520} z={2}>
          <Rise at={6} distance={420} rotate={-4}>
            <div style={{ transform: `translateY(${float(frame, 8, 120)}px)`, filter: paperCut(C.warm, 16, 10) }}>
              <Vial width={330} label="VACCINE" />
            </div>
          </Rise>
        </At>
        {/* magnifier sweeps across: there is nothing to see */}
        <At x={500 + lensX} y={720} z={3} style={{ opacity: lensP > 0 ? 1 : 0 }}>
          <svg width="300" height="360" viewBox="0 0 300 360" style={{ overflow: "visible", filter: "drop-shadow(0 20px 18px rgba(55,45,31,0.3))" }}>
            <line x1="200" y1="220" x2="290" y2="340" stroke={C.ink} strokeWidth="30" strokeLinecap="round" />
            <circle cx="130" cy="130" r="118" fill="rgba(215,234,246,0.35)" stroke={C.ink} strokeWidth="20" />
            <path d="M70 80 A80 80 0 0 1 130 46" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
          </svg>
        </At>
        <At x={60} y={860} z={4}>
          <Pop at={eye}>
            <Tag size={36} bg={C.warm}>
              No visible sign
            </Tag>
          </Pop>
        </At>
        <At x={60} y={940} z={4}>
          <Pop at={eye + 8}>
            <Tag size={28} bg={C.card} color={C.ink} style={{ border: `3px solid ${C.ink}` }}>
              Damage can't be seen
            </Tag>
          </Pop>
        </At>
      </ParallaxLayer>
    </Camera>
  );
};
