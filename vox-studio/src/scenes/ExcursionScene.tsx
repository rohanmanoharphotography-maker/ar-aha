import React from "react";
import { Easing } from "remotion";
import { progress } from "../animations/motion";
import { Camera } from "../components/Camera";
import { LineChart } from "../components/Charts";
import { Timeline } from "../components/Timeline";
import { Kicker, Stamp } from "../components/Typography";
import { Logger } from "../illustrations";
import { useSceneDuration, useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Footnote, Rise, useCue } from "./helpers";

type Props = { kicker: string; max: number; stamp: string; subStamp?: string; footnote?: string; steps: (string | { label: string; sub?: string })[] };

// Illustrative excursion trace: in range, then a climb past the upper limit.
const TRACE = [5.1, 4.9, 5.3, 5.0, 5.4, 6.2, 7.4, 8.8, 10.2, 10.9, 11.2];

/** Temperature excursion: the line breaks the limit, the logger alarms, doses get quarantined. */
export const ExcursionScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const dur = useSceneDuration();
  const cue = useCue(scene);
  const spikeAt = cue("spike", 0.1);
  const stampAt = cue("stamp", 0.5);
  const stepsAt = cue("steps", 0.7);
  const lineEnd = Math.max(spikeAt + 30, stampAt - 6);
  const p = progress(frame, spikeAt - 10, lineEnd, Easing.inOut(Easing.quad));
  const fx = p * (TRACE.length - 1);
  const i0 = Math.min(TRACE.length - 2, Math.floor(fx));
  const v = TRACE[i0] + (TRACE[i0 + 1] - TRACE[i0]) * (fx - i0);
  const alarm = v > props.max;
  const shake = alarm ? Math.sin(frame * 2.2) * 4 : 0;
  return (
    <Camera zoom={[1.0, 1.06]} drift={[0, -10]} punchAt={stampAt} punch={0.03}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} color={alarm ? C.warm : C.ink} />
      </At>
      <At x={20} y={80}>
        <LineChart values={TRACE} domain={[0, 13]} width={620} height={380} start={spikeAt - 10} end={lineEnd} threshold={props.max} band={[2, props.max]} ticks={[2, props.max]} color={alarm ? C.warm : C.cold} />
      </At>
      <At x={640} y={110}>
        <Rise at={2} distance={220}>
          <div style={{ transform: `translateX(${shake}px)`, filter: paperCut(alarm ? C.warm : C.cold, 10, 8) }}>
            <Logger width={330} reading={`${v.toFixed(1)}°`} alarm={alarm} />
          </div>
        </Rise>
      </At>
      {/* quarantined cartons */}
      <At x={110} y={560}>
        <Rise at={stampAt - 12} distance={300}>
          <svg width={780} height={250} viewBox="0 0 780 250" style={{ overflow: "visible", filter: "drop-shadow(0 20px 18px rgba(55,45,31,0.28))" }}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={i * 190 + 10} y={60 - (i % 2) * 20} width={170} height={170 + (i % 2) * 20} fill={i % 2 ? C.card : C.iceLight} stroke={C.ink} strokeWidth={5} />
                <rect x={i * 190 + 30} y={90 - (i % 2) * 20} width={130} height={18} fill={C.cold} />
              </g>
            ))}
          </svg>
        </Rise>
      </At>
      <At x={170} y={590} w={660} style={{ display: "flex", justifyContent: "center" }}>
        <Stamp text={props.stamp} sub={props.subStamp} start={stampAt} size={92} />
      </At>
      {props.footnote ? (
        <At x={90} y={480}>
          <Footnote text={props.footnote} at={spikeAt} />
        </At>
      ) : null}
      <At x={190} y={890}>
        <Timeline
          items={props.steps.map((s) => (typeof s === "string" ? { label: s.toUpperCase() } : { label: s.label.toUpperCase(), sub: s.sub }))}
          start={stepsAt - 18}
          end={Math.min(dur - 6, stepsAt + 24)}
          length={620}
          color={C.cold}
        />
      </At>
    </Camera>
  );
};
