import React from "react";
import { Composition } from "remotion";
import { Explainer } from "./compositions/Explainer";
import current from "./generated/current.json";
import { ensureFonts } from "./lib/fonts";
import { explainerSchema, FORMATS, type ExplainerProps } from "./lib/types";

ensureFonts();

/**
 * One composition, driven entirely by its props (the "plan" written by
 * scripts/make-video.mjs). Studio opens on the most recently built video;
 * the CLI renders any plan with --props.
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Explainer"
    component={Explainer}
    schema={explainerSchema}
    defaultProps={current as unknown as ExplainerProps}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={300}
    calculateMetadata={({ props }: { props: ExplainerProps }) => {
      const f = FORMATS[props.format] ?? FORMATS.vertical;
      return { durationInFrames: Math.max(1, props.durationInFrames), fps: props.fps, width: f.width, height: f.height };
    }}
  />
);
