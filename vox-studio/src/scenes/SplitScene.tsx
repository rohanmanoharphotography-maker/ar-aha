import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { draw, enter, progress, tornEdge } from "../animations/motion";
import { Camera } from "../components/Camera";
import { Meter } from "../components/Charts";
import { Halftone } from "../components/Paper";
import { Marker } from "../components/Typography";
import { Icon, Snowflake, Sun, Vial } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, FONT, SHADOW } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Footnote, useCue } from "./helpers";

type Side = { title: string; caption: string; icon: string; tone: "warm" | "cold"; cue?: string };
type Props = { left: Side; right: Side; footnote?: string };

/** Two stacked torn-paper panels contrasting failure modes (stack, not row, for 9:16). */
export const SplitScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const cue = useCue(scene);
  const panels = [
    { side: props.left, at: cue(props.left.cue ?? "left", 0.05), y: 20, seed: 4 },
    { side: props.right, at: cue(props.right.cue ?? "right", 0.5), y: 560, seed: 9 },
  ];
  return (
    <Camera zoom={[1, 1.05]} drift={[0, -12]}>
      {panels.map(({ side, at, y, seed }, i) => {
        const p = enter(frame, fps, at - 4, { damping: 20, stiffness: 120 });
        const warm = side.tone === "warm";
        const bg = warm ? "#F6E2CF" : C.iceLight;
        const accent = warm ? C.amber : C.cold;
        const level = warm ? interpolate(progress(frame, at + 6, at + 50), [0, 1], [1, 0.42]) : 1;
        const crack = draw(frame, at + 10, at + 22);
        return (
          <At key={i} x={i === 0 ? 0 : 20} y={y} w={980} h={500}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateX(${(1 - p) * (i === 0 ? -1100 : 1100)}px) rotate(${i === 0 ? -1 : 0.8}deg)`,
                filter: SHADOW,
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: bg, clipPath: tornEdge(seed, i === 0 ? "bottom" : "top", 20, 3) }}>
                <Halftone color={warm ? "rgba(238,155,50,0.6)" : "rgba(31,95,209,0.45)"} size={14} opacity={0.35} style={{ WebkitMaskImage: "linear-gradient(90deg, black, transparent 60%)" }} />
              </div>
              <div style={{ position: "absolute", left: 50, top: 60 }}>
                <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 112, letterSpacing: -4, color: C.ink, lineHeight: 1, whiteSpace: "nowrap" }}>
                  <Marker start={at + 6} color={warm ? C.highlight : C.ice}>
                    {side.title}
                  </Marker>
                </div>
                <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 50, color: C.inkSoft, marginTop: 22, maxWidth: 560 }}>{side.caption}</div>
                {warm ? (
                  <div style={{ marginTop: 34 }}>
                    <Meter level={level} color={accent} width={480} label="Potency (illustrative)" />
                  </div>
                ) : null}
              </div>
              <div style={{ position: "absolute", right: 50, top: 70 }}>
                {warm ? (
                  <Sun width={300} spin={frame * 1.2} />
                ) : (
                  <div style={{ position: "relative", width: 300, height: 360 }}>
                    <div style={{ position: "absolute", left: 70, top: 10 }}>
                      <Vial width={170} label="VACCINE" />
                    </div>
                    <svg width={300} height={360} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                      <path d="M150 170 L132 210 L162 236 L138 290" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={crack} />
                    </svg>
                    <div style={{ position: "absolute", left: -10, top: -10, transform: `rotate(${frame * 0.8}deg)` }}>
                      <Snowflake width={120} />
                    </div>
                  </div>
                )}
              </div>
              {side.icon && !["sun", "snowflake"].includes(side.icon) ? <Icon name={side.icon} width={200} /> : null}
            </div>
          </At>
        );
      })}
      {props.footnote ? (
        <At x={40} y={1100}>
          <Footnote text={props.footnote} at={20} />
        </At>
      ) : null}
    </Camera>
  );
};
