import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene } from "../scene";
import { Typed } from "../primitives";

// Generic, spec-driven scene: renders whatever the Astra pipeline hands it (an
// optional Socratic question, a thinking pause, then the equation + explanation)
// without any per-problem code. This is the reusable component the video spec
// (backend/services/video_spec_service.py) is designed to drive -- one component
// for arbitrary math.answer_type content instead of a bespoke scene per problem.
const StepRevealVisual = z.object({
  equation: z.string().optional(),
  socraticQuestion: z.string().optional(),
  thinkingPauseFrames: z.number().int().default(0),
  explanation: z.string().optional(),
});

export const stepReveal = defineScene({
  type: "core.stepReveal",
  schema: StepRevealVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();
    const hasQuestion = Boolean(visual.socraticQuestion);
    const revealFrame = hasQuestion ? visual.thinkingPauseFrames : 0;
    const revealed = frame >= revealFrame;
    const s = spring({ frame: Math.max(0, frame - revealFrame - 2), fps, config: { damping: 14 } });

    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, gap: 28 }}>
        {hasQuestion && !revealed && (
          <div style={{ fontSize: 42, fontWeight: 700, color: "#0f172a", textAlign: "center" }}>
            {visual.socraticQuestion}
          </div>
        )}
        {revealed && (
          <div style={{ transform: `scale(${s})`, textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
            {visual.equation && (
              <div style={{ fontSize: 48, fontWeight: 800, color: "#064e3b", fontFamily: "monospace" }}>
                {visual.equation}
              </div>
            )}
            {visual.explanation && (
              <Typed text={visual.explanation} from={0} size={30} color="#334155" />
            )}
          </div>
        )}
      </AbsoluteFill>
    );
  },
});
