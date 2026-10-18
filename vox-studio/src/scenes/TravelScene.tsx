import React from "react";
import { float } from "../animations/motion";
import { Camera, ParallaxLayer } from "../components/Camera";
import { Kicker } from "../components/Typography";
import { ColdBox, Skyline, Truck } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Pop, Rise, Tag, useCue } from "./helpers";

type Props = { kicker: string; labels: string[] };

/**
 * Parallax transport shot: far skyline, near skyline, road, the truck, and a
 * foreground cold box that occludes the lower frame (three-layer depth).
 */
export const TravelScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const truckAt = cue("truck", 0.05);
  const boxAt = cue("box", 0.45);
  const rangeAt = cue("range", 0.85);
  const scroll = frame * 9; // world speed (px/frame) for the foreground
  return (
    <Camera zoom={[1, 1.04]} drift={[-10, 0]}>
      <At x={40} y={0} z={5}>
        <Kicker text={props.kicker} start={0} />
      </At>
      {/* far + near skyline, scrolling at different speeds */}
      <At x={-200} y={330} w={1400} h={300} style={{ overflow: "hidden" }}>
        <div style={{ transform: `translateX(${-((scroll * 0.15) % 600)}px)` }}>
          <Skyline width={2200} color={C.iceLight} seed={2} height={300} />
        </div>
      </At>
      <At x={-200} y={430} w={1400} h={220} style={{ overflow: "hidden" }}>
        <div style={{ transform: `translateX(${-((scroll * 0.35) % 600)}px)` }}>
          <Skyline width={2200} color={C.paperDeep} seed={5} height={220} />
        </div>
      </At>
      {/* road */}
      <At x={-100} y={640} w={1200} h={150} style={{ background: "#3C3B38" }}>
        <div
          style={{
            position: "absolute",
            top: 68,
            left: 0,
            right: 0,
            height: 12,
            backgroundImage: `repeating-linear-gradient(90deg, ${C.card} 0 70px, transparent 70px 140px)`,
            backgroundPosition: `${-scroll}px 0`,
          }}
        />
      </At>
      <ParallaxLayer depth={1} travel={[24, 0]}>
        <At x={70} y={330} z={2}>
          <Rise at={truckAt - 6} distance={0}>
            <div style={{ transform: `translateX(${Math.max(0, 600 - (frame - truckAt + 8) * 40)}px) translateY(${float(frame, 3, 14)}px)`, filter: paperCut(C.warm, -12, 8) }}>
              <Truck width={860} wheel={frame * 14} />
            </div>
          </Rise>
        </At>
      </ParallaxLayer>
      <At x={40} y={100} z={5}>
        <Pop at={truckAt}>
          <Tag size={38}>{props.labels[0]}</Tag>
        </Pop>
      </At>
      {/* foreground: the insulated box, occluding the road edge */}
      <ParallaxLayer depth={2} travel={[40, 0]}>
        <At x={470} y={720} z={6}>
          <Rise at={boxAt} distance={420} rotate={2}>
            <div style={{ filter: paperCut(C.cold, 14, 10) }}>
              <ColdBox width={480} lid={0.6} />
            </div>
          </Rise>
        </At>
      </ParallaxLayer>
      <At x={40} y={790} z={7}>
        <Pop at={boxAt + 6}>
          <Tag size={30} bg={C.cold}>
            {props.labels[1] ?? "Insulated boxes"}
          </Tag>
        </Pop>
      </At>
      <At x={40} y={880} z={7}>
        <Pop at={rangeAt}>
          <Tag size={46} bg={C.highlight} color={C.ink}>
            ✓ In range
          </Tag>
        </Pop>
      </At>
    </Camera>
  );
};
