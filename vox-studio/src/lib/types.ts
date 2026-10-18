import { z } from "zod";

export const formatSchema = z.enum(["vertical", "landscape", "portrait"]);
export type Format = z.infer<typeof formatSchema>;

export const FORMATS: Record<Format, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

const wordSchema = z.object({ text: z.string(), start: z.number(), end: z.number(), highlight: z.boolean().optional() });
export type Word = z.infer<typeof wordSchema>;

export const captionSchema = z.object({ start: z.number(), end: z.number(), words: z.array(wordSchema) });
export type Caption = z.infer<typeof captionSchema>;

export const planSceneSchema = z.object({
  id: z.string(),
  type: z.string(),
  /** first frame of the scene on the global timeline */
  from: z.number(),
  durationInFrames: z.number(),
  /** named cue -> frame, relative to scene start */
  cues: z.record(z.number()),
  /** words spoken during the scene, times relative to scene start (seconds) */
  words: z.array(wordSchema),
  props: z.record(z.any()),
});
export type PlanScene = z.infer<typeof planSceneSchema>;

export const explainerSchema = z.object({
  title: z.string(),
  format: formatSchema,
  fps: z.number(),
  durationInFrames: z.number(),
  audio: z.string().nullable(),
  scenes: z.array(planSceneSchema),
  captions: z.array(captionSchema),
  showCaptions: z.boolean(),
  transitionFrames: z.number(),
});
export type ExplainerProps = z.infer<typeof explainerSchema>;

export type SceneProps<P = Record<string, unknown>> = {
  scene: PlanScene;
  props: P;
};
