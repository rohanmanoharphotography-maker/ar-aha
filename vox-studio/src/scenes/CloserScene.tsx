import React from "react";
import { useVideoConfig } from "remotion";
import { draw, enter, ramp } from "../animations/motion";
import { Camera, ParallaxLayer } from "../components/Camera";
import { AnimatedTitle, Kicker } from "../components/Typography";
import { Arm, Factory, Fridge, Truck, Warehouse } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, FONT, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Rise, useCue } from "./helpers";

type Props = { kicker: string; lines: string[]; highlight?: string; signoff?: string };

/** Payoff: the whole chain recapped as one line ending at the patient's arm. */
export const CloserScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const cue = useCue(scene);
  const armAt = cue("arm", 0.15);
  const titleAt = cue("title", 0.45);
  const signAt = cue("signoff", 0.8);
  const chain = [
    { el: <Factory width={130} />, x: 40 },
    { el: <Warehouse width={130} />, x: 270 },
    { el: <Truck width={190} />, x: 480 },
    { el: <Fridge width={78} />, x: 770 },
  ];
  return (
    <Camera zoom={[1.06, 1.0]} drift={[0, 8]}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <svg width={1000} height={1160} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path
          d="M 100 300 L 860 300 C 930 300 940 360 900 400 C 860 440 700 470 640 520"
          fill="none"
          stroke={C.cold}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw(frame, 2, armAt + 14)}
        />
      </svg>
      {chain.map((c, i) => {
        const p = enter(frame, fps, 2 + i * 5, { damping: 12, stiffness: 170 });
        return (
          <At key={i} x={c.x} y={140} style={{ transform: `scale(${p})`, transformOrigin: "50% 100%" }}>
            <div style={{ height: 160, display: "flex", alignItems: "flex-end" }}>{c.el}</div>
          </At>
        );
      })}
      <ParallaxLayer depth={1} travel={[-24, 0]}>
        <At x={200} y={380}>
          <Rise at={armAt - 4} distance={300}>
            <div style={{ filter: paperCut(C.warm, 14, 10) }}>
              <Arm width={760} bandage={enter(frame, fps, armAt + 10, { damping: 10, stiffness: 200 })} />
            </div>
          </Rise>
        </At>
      </ParallaxLayer>
      <At x={36} y={790}>
        <AnimatedTitle lines={props.lines} start={titleAt - 4} size={150} highlight={props.highlight} highlightColor={C.ice} />
      </At>
      {props.signoff ? (
        <At x={40} y={1090} style={{ opacity: ramp(frame, signAt, 14) }}>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700, fontSize: 48, color: C.inkSoft, whiteSpace: "nowrap" }}>— {props.signoff}</div>
        </At>
      ) : null}
    </Camera>
  );
};
