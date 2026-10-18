import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { tornEdge } from "../animations/motion";
import { Grain, PaperBackground } from "../components/Paper";
import { Subtitles } from "../components/Subtitles";
import { SceneContext, StageContext, useLayout } from "../lib/layout";
import { C } from "../lib/theme";
import type { ExplainerProps, PlanScene } from "../lib/types";
import { sceneFor } from "../scenes";

/**
 * Scene shell: mounts a scene `T` frames early so the incoming scene can be
 * revealed by a torn-paper edge rising over the outgoing one, while the
 * outgoing scene is pushed up and darkened (a paper "page turn").
 */
const SceneShell: React.FC<{ scene: PlanScene; index: number; T: number; isLast: boolean }> = ({ scene, index, T, isLast }) => {
  const frame = useCurrentFrame(); // 0 at (scene.from - pre)
  const layout = useLayout();
  const pre = index === 0 ? 0 : T;
  const local = frame - pre;
  const dur = scene.durationInFrames;
  const Comp = sceneFor(scene.type);
  // entrance: torn edge sweeps from bottom to top over the pre-roll
  const reveal = index === 0 ? 0 : interpolate(frame, [0, T], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  // exit: pushed up while the next scene covers it
  const exit = isLast ? 0 : interpolate(local, [dur - T, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const clip = index === 0 || reveal <= 0 ? undefined : `${tornEdge(index * 7, "top", 16, 3)}`;
  return (
    <SceneContext.Provider value={{ pre, duration: dur, pauses: scene.pauses }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${reveal}%) translateY(${-exit * 14}%)`,
          filter: exit > 0 ? `brightness(${1 - exit * 0.25})` : undefined,
        }}
      >
        <AbsoluteFill style={{ clipPath: clip }}>
          <PaperBackground />
          <div
            style={{
              position: "absolute",
              left: layout.stage.x,
              top: layout.stage.y,
              width: layout.stage.w,
              height: layout.stage.h,
              transform: `scale(${layout.stage.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <Comp scene={scene} props={scene.props} />
          </div>
          {index > 0 && reveal > 0 ? (
            // ink rule riding the torn edge
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 14, background: index % 2 ? C.cold : C.warm, clipPath: tornEdge(index * 7, "top", 16, 30) }} />
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneContext.Provider>
  );
};

export const Explainer: React.FC<ExplainerProps> = ({ scenes, captions, audio, showCaptions, transitionFrames, stage }) => {
  const T = transitionFrames;
  return (
    <StageContext.Provider value={stage ?? "tall"}>
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <PaperBackground />
      {scenes.map((s, i) => {
        const pre = i === 0 ? 0 : T;
        return (
          <Sequence key={s.id} from={s.from - pre} durationInFrames={s.durationInFrames + pre} name={`${i + 1}. ${s.id} (${s.type})`}>
            <SceneShell scene={s} index={i} T={T} isLast={i === scenes.length - 1} />
          </Sequence>
        );
      })}
      <Grain />
      {showCaptions ? <Subtitles captions={captions} /> : null}
      {audio ? <Audio src={audio.startsWith("http") ? audio : staticFile(audio)} /> : null}
    </AbsoluteFill>
    </StageContext.Provider>
  );
};
