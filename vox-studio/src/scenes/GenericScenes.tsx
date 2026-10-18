// Generic, topic-agnostic scene templates. The auto-storyboarder
// (scripts/lib/storyboard.mjs) uses these when no hand-directed storyboard
// exists, so any script can become a finished video.
import React from "react";
import { Camera, ParallaxLayer } from "../components/Camera";
import { BarChart } from "../components/Charts";
import { ImageReveal } from "../components/ImageReveal";
import { MapRoute } from "../components/MapRoute";
import { Timeline } from "../components/Timeline";
import { AnimatedTitle, Counter, Kicker, KineticText } from "../components/Typography";
import { Icon } from "../illustrations";
import { useSceneDuration } from "../lib/layout";
import { C, FONT, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Footnote, Rise, Tag, useCue } from "./helpers";

/** Title card: kicker + big animated headline + optional icon. */
export const TitleScene: React.FC<SceneProps<{ kicker?: string; lines: string[]; highlight?: string; icon?: string }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const longest = Math.max(...props.lines.map((l) => l.length));
  const size = Math.min(150, Math.floor(920 / (longest * 0.62)));
  return (
    <Camera zoom={[1, 1.06]}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      <At x={36} y={90}>
        <AnimatedTitle lines={props.lines} start={cue("title", 0.05)} size={size} highlight={props.highlight} />
      </At>
      {props.icon ? (
        <At x={250} y={560}>
          <Rise at={cue("icon", 0.25)} distance={300}>
            <div style={{ filter: paperCut(C.warm, 14, 10) }}>
              <Icon name={props.icon} width={500} />
            </div>
          </Rise>
        </At>
      ) : null}
    </Camera>
  );
};

/** Kinetic typography: the narration itself, word by word, plus a focus-word collage card. */
export const KineticScene: React.FC<SceneProps<{ kicker?: string; icon?: string; focus?: string; tone?: "cold" | "warm" }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const focusAt = cue("focus", 0.35);
  const accent = props.tone === "warm" ? C.warm : C.cold;
  return (
    <Camera zoom={[1, 1.05]} drift={[0, -10]}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      <ParallaxLayer depth={0.6} travel={[0, 20]}>
        <At x={40} y={80} w={920}>
          <KineticText words={scene.words} size={scene.words.length > 14 ? 68 : 84} />
        </At>
      </ParallaxLayer>
      {props.focus ? (
        <ParallaxLayer depth={1.2} travel={[16, -24]}>
          <At x={props.icon ? 40 : 110} y={600}>
            <ImageReveal width={props.icon ? 560 : 780} height={380} start={focusAt} rotate={-2} stroke={accent} seed={scene.words.length}>
              <div style={{ width: "100%", height: "100%", background: props.tone === "warm" ? "#F6E2CF" : C.iceLight, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: Math.min(130, Math.floor((props.icon ? 500 : 720) / (props.focus.length * 0.64))), letterSpacing: -3, color: C.ink, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {props.focus}
                </div>
              </div>
            </ImageReveal>
          </At>
        </ParallaxLayer>
      ) : null}
      {props.icon ? (
        <ParallaxLayer depth={1.6} travel={[0, -30]}>
          <At x={props.focus ? 620 : 560} y={props.focus ? 760 : 700}>
            <Rise at={focusAt + 8} distance={260}>
              <div style={{ filter: paperCut(accent, 12, 8) }}>
                <Icon name={props.icon} width={props.focus ? 320 : 380} />
              </div>
            </Rise>
          </At>
        </ParallaxLayer>
      ) : null}
    </Camera>
  );
};

/** Statistic: a counter that lands on the spoken number, with a label. */
export const StatScene: React.FC<SceneProps<{ kicker?: string; value: number; decimals?: number; prefix?: string; suffix?: string; label: string; source?: string }>> = ({
  scene,
  props,
}) => {
  const cue = useCue(scene);
  const land = cue("value", 0.45);
  return (
    <Camera zoom={[1, 1.07]} punchAt={land} punch={0.04}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      <At x={40} y={300} w={920}>
        <Counter to={props.value} start={land - 18} end={land} decimals={props.decimals} prefix={props.prefix} suffix={props.suffix} size={300} color={C.cold} />
      </At>
      <At x={40} y={660} w={920}>
        <Rise at={land + 4} distance={100}>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 64, color: C.ink, lineHeight: 1.15 }}>{props.label}</div>
        </Rise>
      </At>
      {props.source ? (
        <At x={40} y={1090}>
          <Footnote text={`Source: ${props.source}`} at={land + 8} />
        </At>
      ) : null}
    </Camera>
  );
};

/** Editorial image: collage card reveal with the narration as kinetic text. */
export const ImageScene: React.FC<SceneProps<{ src?: string; icon?: string; caption?: string; kicker?: string }>> = ({ scene, props }) => (
  <Camera zoom={[1.0, 1.08]} drift={[0, -16]}>
    {props.kicker ? (
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
    ) : null}
    <ParallaxLayer depth={1} travel={[20, 0]}>
      <At x={80} y={90}>
        <ImageReveal src={props.src} width={840} height={620} start={2} caption={props.caption}>
          {!props.src && props.icon ? (
            <div style={{ width: "100%", height: "100%", background: C.iceLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={props.icon} width={480} />
            </div>
          ) : null}
        </ImageReveal>
      </At>
    </ParallaxLayer>
    <At x={40} y={790} w={920}>
      <KineticText words={scene.words} size={64} />
    </At>
  </Camera>
);

/** Bar chart with labelled values (only use with sourced data). */
export const ChartScene: React.FC<SceneProps<{ kicker?: string; title: string; bars: { label: string; value: number }[]; unit?: string; source?: string }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const max = Math.max(...props.bars.map((b) => b.value)) * 1.15;
  return (
    <Camera zoom={[1, 1.04]}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      <At x={36} y={80}>
        <AnimatedTitle lines={[props.title]} size={84} start={2} />
      </At>
      <At x={60} y={320}>
        <BarChart bars={props.bars} max={max} width={880} height={620} start={cue("bars", 0.2)} unit={props.unit} />
      </At>
      {props.source ? (
        <At x={40} y={1100}>
          <Footnote text={`Source: ${props.source}`} at={20} />
        </At>
      ) : null}
    </Camera>
  );
};

/** Process timeline. */
export const TimelineScene: React.FC<SceneProps<{ kicker?: string; title?: string; items: { label: string; sub?: string }[] }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const dur = useSceneDuration();
  return (
    <Camera zoom={[1, 1.05]}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      {props.title ? (
        <At x={36} y={80}>
          <AnimatedTitle lines={[props.title]} size={84} start={2} />
        </At>
      ) : null}
      <At x={120} y={300}>
        <Timeline items={props.items} start={cue("start", 0.1)} end={Math.min(dur - 6, cue("end", 0.85))} orientation="vertical" length={700} />
      </At>
    </Camera>
  );
};

/** Route map between named stops. */
export const MapScene: React.FC<SceneProps<{ kicker?: string; stops: { label: string; icon?: string; x: number; y: number }[] }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  return (
    <Camera zoom={[1.06, 1.0]}>
      {props.kicker ? (
        <At x={40} y={0}>
          <Kicker text={props.kicker} start={0} />
        </At>
      ) : null}
      <At x={0} y={150}>
        <MapRoute stops={props.stops.map((s) => ({ ...s, icon: s.icon ? <Icon name={s.icon} width={150} /> : undefined }))} start={cue("start", 0.1)} end={cue("end", 0.85)} width={1000} height={960} />
      </At>
    </Camera>
  );
};

/** Plain tag + kinetic fallback for unknown scene types. */
export const FallbackScene: React.FC<SceneProps<Record<string, unknown>>> = ({ scene }) => (
  <Camera>
    <At x={40} y={0}>
      <Tag size={28}>{scene.type}</Tag>
    </At>
    <At x={40} y={140} w={920}>
      <KineticText words={scene.words} size={84} />
    </At>
  </Camera>
);
