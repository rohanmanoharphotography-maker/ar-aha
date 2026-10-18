import React from "react";
import { Easing } from "remotion";
import { progress } from "../animations/motion";
import { Camera } from "../components/Camera";
import { LineChart } from "../components/Charts";
import { Kicker } from "../components/Typography";
import { Clock, Logger } from "../illustrations";
import { useSceneDuration, useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Footnote, Pop, Rise, Tag, useCue } from "./helpers";

type Props = { kicker: string; device: string; min: number; max: number; footnote?: string; values?: number[] };

// Illustrative in-range trace (clearly labelled on screen as illustrative).
const DEFAULT_TRACE = [5.0, 5.3, 4.8, 5.6, 5.1, 4.6, 5.2, 5.8, 5.0, 4.7, 5.4, 5.1, 4.9, 5.5, 5.2];

/** Data logger: a device with a live readout and the trace it records. */
export const LoggerScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const dur = useSceneDuration();
  const cue = useCue(scene);
  const deviceAt = cue("device", 0.1);
  const lineAt = cue("line", 0.3);
  const clockAt = cue("clock", 0.8);
  const values = props.values ?? DEFAULT_TRACE;
  const end = dur - 4;
  const p = progress(frame, lineAt, end, Easing.inOut(Easing.quad));
  const fx = p * (values.length - 1);
  const i0 = Math.min(values.length - 2, Math.floor(fx));
  const v = values[i0] + (values[i0 + 1] - values[i0]) * (fx - i0);
  return (
    <Camera zoom={[1.0, 1.06]} drift={[0, -14]}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={40} y={90}>
        <Rise at={deviceAt - 6} distance={300} rotate={-2}>
          <div style={{ filter: paperCut(C.cold, 14, 10) }}>
            <Logger width={520} reading={`${v.toFixed(1)}°C`} />
          </div>
        </Rise>
      </At>
      <At x={630} y={110}>
        <Pop at={clockAt - 4}>
          <div style={{ filter: paperCut(C.warm, 10, 8) }}>
            <Clock width={260} t={Math.max(0, frame - clockAt + 4) / 8} />
          </div>
        </Pop>
      </At>
      <At x={660} y={400}>
        <Pop at={clockAt + 2}>
          <Tag size={40} bg={C.warm}>
            24 / 7
          </Tag>
        </Pop>
      </At>
      <At x={40} y={520}>
        <Rise at={deviceAt + 4} distance={120}>
          <Tag size={32}>{props.device}</Tag>
        </Rise>
      </At>
      <At x={20} y={640}>
        <LineChart
          values={values}
          domain={[0, 11]}
          width={960}
          height={380}
          start={lineAt}
          end={end}
          band={[props.min, props.max]}
          bandLabel={`SAFE ${props.min}–${props.max} °C`}
          ticks={[props.min, props.max]}
        />
      </At>
      {props.footnote ? (
        <At x={90} y={1100}>
          <Footnote text={props.footnote} at={lineAt} />
        </At>
      ) : null}
    </Camera>
  );
};
