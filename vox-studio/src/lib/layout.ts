import { createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Scenes are composed on a fixed design stage (STAGE_W x STAGE_H units) that is
 * scaled into the safe content area of whichever format is being rendered.
 * This keeps every scene platform-safe in 9:16, 16:9 and 4:5 without
 * per-format layout code.
 */
export const STAGE_W = 1000;
export const STAGE_H = 1160;
/** "tall" suits 9:16 / 4:5; "wide" is a 16:9 stage for landscape-first films. */
export const STAGES = { tall: { w: STAGE_W, h: STAGE_H }, wide: { w: 1760, h: 880 } } as const;
export type StageKind = keyof typeof STAGES;
export const StageContext = createContext<StageKind>("tall");

export type Layout = {
  width: number;
  height: number;
  stage: { x: number; y: number; scale: number; w: number; h: number };
  captionY: number; // centre line of the caption band (px from top)
  captionMaxW: number;
  captionSize: number;
};

export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  const { w: SW, h: SH } = STAGES[useContext(StageContext)];
  const vertical = height / width > 1.5;
  const landscape = width > height;
  // reserved platform UI: top status bar, bottom caption/username area, right action rail
  const top = vertical ? 190 : landscape ? 50 : 70;
  const bottomReserve = vertical ? 560 : landscape ? 200 : 290;
  const areaH = height - top - bottomReserve;
  const areaW = width - (vertical ? 80 : 120);
  const scale = Math.min(areaH / SH, areaW / SW);
  const stageW = SW * scale;
  return {
    width,
    height,
    stage: { x: (width - stageW) / 2, y: top + (areaH - SH * scale) / 2, scale, w: SW, h: SH },
    captionY: vertical ? height - 455 : landscape ? height - 115 : height - 180,
    captionMaxW: vertical ? 900 : landscape ? 1500 : 940,
    captionSize: vertical ? 62 : landscape ? 56 : 54,
  };
};

/** Each scene is mounted with a pre-roll for its entrance transition. */
export const SceneContext = createContext<{ pre: number; duration: number; pauses?: { start: number; end: number }[] }>({ pre: 0, duration: 1 });

/** Frame relative to the scene's true start (negative during the pre-roll). */
export const useSceneFrame = () => {
  const frame = useCurrentFrame();
  const { pre } = useContext(SceneContext);
  return frame - pre;
};

export const useSceneDuration = () => useContext(SceneContext).duration;

/** Silent "pause and try it" windows in this scene (scene-relative frames). */
export const useScenePauses = () => useContext(SceneContext).pauses ?? [];
