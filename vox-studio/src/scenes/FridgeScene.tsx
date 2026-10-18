import React from "react";
import { progress } from "../animations/motion";
import { Camera, ParallaxLayer } from "../components/Camera";
import { ImageReveal } from "../components/ImageReveal";
import { Timeline } from "../components/Timeline";
import { AnimatedTitle, Kicker } from "../components/Typography";
import { Fridge, Pharmacy } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Rise, useCue } from "./helpers";

type Props = { kicker: string; headline: string; days: string[] };

/** Pharmacy storage: storefront collage card, the dedicated fridge, and a daily check log. */
export const FridgeScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const fridgeAt = cue("fridge", 0.25);
  const checksAt = cue("checks", 0.55);
  const glow = progress(frame, fridgeAt, fridgeAt + 20);
  return (
    <Camera zoom={[1.04, 1.0]} drift={[0, 12]}>
      <ParallaxLayer depth={0.5} travel={[-20, 0]}>
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
        <At x={560} y={60}>
          <ImageReveal width={400} height={300} start={2} rotate={2.5} stroke={C.ok} seed={12}>
            <div style={{ width: "100%", height: "100%", background: C.iceLight, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <Pharmacy width={340} />
            </div>
          </ImageReveal>
        </At>
      </ParallaxLayer>
      <ParallaxLayer depth={1} travel={[10, 0]}>
        <At x={40} y={260}>
          <Rise at={fridgeAt - 8} distance={500}>
            <div style={{ filter: paperCut(C.cold, -14, 10) }}>
              <Fridge width={440} display="5.0°C" glow={glow} />
            </div>
          </Rise>
        </At>
      </ParallaxLayer>
      <At x={560} y={420}>
        <Timeline items={props.days.map((d) => ({ label: d, sub: "temp logged" }))} start={checksAt} end={checksAt + 26} orientation="vertical" length={520} />
      </At>
      <At x={40} y={1030} w={960}>
        <AnimatedTitle lines={[props.headline]} start={checksAt + 6} size={64} highlight="EVERY" />
      </At>
    </Camera>
  );
};
