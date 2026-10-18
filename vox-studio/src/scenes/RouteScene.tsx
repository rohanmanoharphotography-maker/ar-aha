import React from "react";
import { Camera } from "../components/Camera";
import { MapRoute } from "../components/MapRoute";
import { AnimatedTitle, Kicker } from "../components/Typography";
import { Icon, Snowflake } from "../illustrations";
import { C } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, useCue } from "./helpers";

type Props = { kicker: string; headline: string; stops: { label: string; icon: string; x?: number; y?: number }[] };

// default stop layout on the 1000x960 map for up to 4 stops (zig-zag down the frame)
const SLOTS = [
  { x: 220, y: 300 },
  { x: 760, y: 470 },
  { x: 280, y: 790 },
  { x: 760, y: 900 },
];

/** Route map: the chain drawn as one unbroken line through each stop. */
export const RouteScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const start = cue("start", 0.15);
  const end = Math.max(start + 20, cue("end", 0.9));
  const stops = props.stops.map((s, i) => ({ x: s.x ?? SLOTS[i % SLOTS.length].x, y: s.y ?? SLOTS[i % SLOTS.length].y, label: s.label, icon: <Icon name={s.icon} width={150} /> }));
  const words = props.headline.split(" ");
  const half = Math.ceil(words.length / 2);
  return (
    <Camera zoom={[1.08, 1.0]} drift={[0, 10]}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={36} y={64}>
        <AnimatedTitle lines={[words.slice(0, half).join(" "), words.slice(half).join(" ")]} start={cue("headline", 0.3) - 6} size={92} highlight="UNBROKEN" />
      </At>
      <At x={0} y={290}>
        <MapRoute
          stops={stops}
          start={start}
          end={end}
          width={1000}
          height={840}
          marker={
            <div style={{ width: 84, height: 84, borderRadius: 42, background: C.card, border: `6px solid ${C.cold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Snowflake width={56} />
            </div>
          }
        />
      </At>
    </Camera>
  );
};
