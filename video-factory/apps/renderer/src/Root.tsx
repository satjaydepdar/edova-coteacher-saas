import React from "react";
import { Composition, registerRoot, type CalculateMetadataFunction } from "remotion";
import { Explainer, type ExplainerProps } from "./Explainer";
import { buildTimeline } from "./timeline";
import { hcfExample } from "@vf/math";

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = ({ props }) => {
  const sb = props.storyboard;
  return {
    fps: sb.fps,
    width: sb.aspect === "9:16" ? 1080 : 1920,
    height: sb.aspect === "9:16" ? 1920 : 1080,
    durationInFrames: buildTimeline(sb, props.audioDurations).totalFrames,
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Explainer" component={Explainer}
    defaultProps={{ storyboard: hcfExample }}
    calculateMetadata={calculateMetadata} />
);
