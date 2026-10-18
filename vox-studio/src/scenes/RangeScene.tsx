import React from "react";
import { Easing, interpolate } from "remotion";
import { draw, progress, ramp } from "../animations/motion";
import { Camera } from "../components/Camera";
import { Counter, Kicker } from "../components/Typography";
import { Thermometer } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, FONT, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Pop, Rise, Tag, useCue } from "./helpers";

type Props = { kicker: string; min: number; max: number; unit: string; altUnit?: string; label?: string; domain?: [number, number] };

/** A thermometer with the safe band, and counters that land on the spoken numbers. */
export const RangeScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const [lo, hi] = props.domain ?? [props.min - 6, props.max + 6];
  const lv = (v: number) => (v - lo) / (hi - lo);
  const cMin = cue("min", 0.4);
  const cMax = cue("max", 0.6);
  const cBand = cue("band", 0.75);
  const mid = (props.min + props.max) / 2;
  const fill = interpolate(frame, [4, cMin, cMax + 6], [lv(lo + 1), lv(props.min), lv(mid)], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // thermometer is 260 wide → 676 tall; tube spans y 30..410 of 520
  const thermoTop = 250;
  const tubeY = (v: number) => thermoTop + ((410 - lv(v) * 380) / 520) * 676;
  const bandP = progress(frame, cMin - 4, cMax + 4);
  return (
    <Camera zoom={[1.02, 1.08]} drift={[10, -10]}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={2} />
      </At>
      <At x={60} y={thermoTop}>
        <Rise at={0} distance={300}>
          <div style={{ filter: paperCut(C.ice, 12, 8) }}>
            <Thermometer width={260} level={fill} band={bandP > 0 ? [lv(props.min), lv(props.min) + (lv(props.max) - lv(props.min)) * bandP] : undefined} />
          </div>
        </Rise>
      </At>
      {/* leader lines from band edges to counters */}
      <svg width={1000} height={1160} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {[
          { v: props.max, at: cMax, y: 300 },
          { v: props.min, at: cMin, y: 640 },
        ].map((l, i) => (
          <path
            key={i}
            d={`M 250 ${tubeY(l.v)} C 330 ${tubeY(l.v)}, 360 ${l.y + 90}, 430 ${l.y + 90}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={4}
            strokeDasharray="1"
            pathLength={1}
            strokeDashoffset={draw(frame, l.at - 6, l.at + 6)}
          />
        ))}
      </svg>
      <At x={450} y={300}>
        <Pop at={cMax - 2}>
          <Counter from={props.max + 6} to={props.max} start={cMax - 8} end={cMax + 2} suffix={props.unit} size={230} color={C.cold} />
        </Pop>
      </At>
      <At x={470} y={545} style={{ opacity: ramp(frame, cMax, 10) }}>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 64, color: C.inkSoft }}>and</div>
      </At>
      <At x={450} y={640}>
        <Pop at={cMin - 2}>
          <Counter from={props.min - 6} to={props.min} start={cMin - 8} end={cMin + 2} suffix={props.unit} size={230} color={C.cold} />
        </Pop>
      </At>
      <At x={456} y={900}>
        <Rise at={cBand} distance={80}>
          <Tag size={34}>{props.label ?? "Safe range"}</Tag>
          {props.altUnit ? (
            <div style={{ marginTop: 16, fontFamily: FONT.mono, fontWeight: 600, fontSize: 32, color: C.inkSoft, letterSpacing: 2 }}>= {props.altUnit}</div>
          ) : null}
        </Rise>
      </At>
    </Camera>
  );
};
