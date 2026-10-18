import type React from "react";
import type { SceneProps } from "../lib/types";
import { CloserScene } from "./CloserScene";
import { ExcursionScene } from "./ExcursionScene";
import { FridgeScene } from "./FridgeScene";
import { ChartScene, FallbackScene, ImageScene, KineticScene, MapScene, StatScene, TimelineScene, TitleScene } from "./GenericScenes";
import { HookScene } from "./HookScene";
import { IndicatorScene } from "./IndicatorScene";
import {
  BulletHookScene,
  CollisionScene,
  ConservationScene,
  EquationScene,
  KECompareScene,
  MistakesScene,
  QuestionsScene,
  SankeyScene,
  TransfersScene,
  WhereScene,
} from "./LessonScenes";
import { LoggerScene } from "./LoggerScene";
import { RangeScene } from "./RangeScene";
import { RouteScene } from "./RouteScene";
import { SplitScene } from "./SplitScene";
import { TravelScene } from "./TravelScene";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyScene = React.FC<SceneProps<any>>;

/** storyboard `type` → scene component */
export const SCENES: Record<string, AnyScene> = {
  // directed templates
  hook: HookScene,
  range: RangeScene,
  split: SplitScene,
  route: RouteScene,
  travel: TravelScene,
  logger: LoggerScene,
  indicator: IndicatorScene,
  fridge: FridgeScene,
  excursion: ExcursionScene,
  closer: CloserScene,
  // generic templates
  title: TitleScene,
  kinetic: KineticScene,
  stat: StatScene,
  image: ImageScene,
  chart: ChartScene,
  timeline: TimelineScene,
  map: MapScene,
  // lesson templates (wide stage)
  "bullet-hook": BulletHookScene,
  transfers: TransfersScene,
  conservation: ConservationScene,
  sankey: SankeyScene,
  equation: EquationScene,
  collision: CollisionScene,
  "ke-compare": KECompareScene,
  where: WhereScene,
  mistakes: MistakesScene,
  questions: QuestionsScene,
};

export const sceneFor = (type: string): AnyScene => SCENES[type] ?? FallbackScene;
