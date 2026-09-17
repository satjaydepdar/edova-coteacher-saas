import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { Storyboard } from "@vf/storyboard";
import { answer, mergeRegistries, type SceneRegistry } from "@vf/core";
import { mathRegistry } from "@vf/math";

import { calculateTimeline } from "../timeline/timeline.calculator";
import { SequenceIsolation } from "./SequenceIsolation";
import { SceneHost } from "./SceneHost";

export interface VideoCompositionProps {
  storyboard: Storyboard;
  audioDurationsSec?: Record<string, number>;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  storyboard,
  audioDurationsSec
}) => {
  // Merge platform answer scene and subject math registry
  const registry: SceneRegistry = useMemo(() => {
    return mergeRegistries(
      { [answer.type]: answer },
      mathRegistry
    );
  }, []);

  const timeline = useMemo(
    () => calculateTimeline(storyboard, audioDurationsSec),
    [storyboard, audioDurationsSec]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      {timeline.scenes.map(({ scene, startFrame, durationInFrames }) => (
        <SequenceIsolation
          key={scene.id}
          id={scene.id}
          from={startFrame}
          durationInFrames={durationInFrames}
          narration={scene.narration}
        >
          <SceneHost
            scene={scene}
            registry={registry}
            durationInFrames={durationInFrames}
            fps={timeline.fps}
          />
        </SequenceIsolation>
      ))}
    </AbsoluteFill>
  );
};
