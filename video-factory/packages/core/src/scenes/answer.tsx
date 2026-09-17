import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene } from "../scene";

const AnswerVisual = z.object({
  headline: z.string(),
  sub: z.string().optional(),
});

export const answer = defineScene({
  type: "core.answer",
  schema: AnswerVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();
    const s = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12, stiffness: 130 } });
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${s})`, background: "#064e3b", border: "4px solid #4ade80",
          borderRadius: 20, padding: "40px 64px", textAlign: "center" }}>
          <div style={{ fontSize: 54, fontWeight: 800, color: "#d1fae5" }}>{visual.headline}</div>
          {visual.sub && <div style={{ fontSize: 30, color: "#a7f3d0", marginTop: 14 }}>{visual.sub}</div>}
        </div>
      </AbsoluteFill>
    );
  },
});
