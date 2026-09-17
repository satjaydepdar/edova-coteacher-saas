import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { Storyboard } from "@vf/storyboard";
import { REGISTRY } from "./registry";
import { buildTimeline } from "./timeline";
import { EstimatedKaraoke } from "@vf/core";

export interface ExplainerProps {
  storyboard: Storyboard;
  audioDurations?: Record<string, number>;
}

export const Explainer: React.FC<ExplainerProps> = ({ storyboard, audioDurations }) => {
  const tl = buildTimeline(storyboard, audioDurations);
  return (
    <AbsoluteFill style={{ background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {storyboard.scenes.map((scene) => {
        const slot = tl.scenes.find((s) => s.id === scene.id)!;
        const def = REGISTRY[scene.type];
        if (!def) throw new Error(`Unknown scene type: ${scene.type}`);
        const C = def.component;
        return (
          <Sequence key={scene.id} from={slot.from} durationInFrames={slot.durationInFrames} name={`${scene.id}:${scene.type}`}>
            <C visual={def.schema.parse(scene.visual)} durationInFrames={slot.durationInFrames} fps={storyboard.fps} />
            <EstimatedKaraoke text={scene.narration} durationInFrames={slot.durationInFrames} />
            {audioDurations?.[scene.id] != null && (
              <Audio src={staticFile(`assets/${storyboard.videoId}/${scene.id}.wav`)} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
