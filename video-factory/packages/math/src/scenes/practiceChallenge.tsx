import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { z } from "zod";
import { defineScene, Typed } from "@vf/core";

export const PracticeChallengeVisual = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answerIndex: z.number(),
  countdownSeconds: z.number().default(5),
});

export type PracticeChallengeVisualData = z.infer<typeof PracticeChallengeVisual>;

export const practiceChallenge = defineScene({
  type: "math.practiceChallenge",
  schema: PracticeChallengeVisual,
  component: ({ visual, fps, durationInFrames }) => {
    const frame = useCurrentFrame();
    const countdownFrames = visual.countdownSeconds * fps;
    const remaining = Math.max(0, Math.ceil((countdownFrames - frame) / fps));

    return (
      <AbsoluteFill style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "40px 60px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Typed text="Quick Challenge" from={0} size={40} color="#f59e0b" />
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f8fafc", marginTop: 12 }}>
            {visual.question}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: remaining === 0 ? "#4ade80" : "#38bdf8", marginTop: 10 }}>
            {remaining === 0 ? "TIME'S UP!" : `00:0${remaining}`}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 700 }}>
          {visual.options.map((opt, i) => {
            const isCorrect = i === visual.answerIndex;
            const reveal = remaining === 0 && isCorrect;

            return (
              <div
                key={i}
                style={{
                  background: reveal ? "#064e3b" : "#1e293b",
                  border: `2px solid ${reveal ? "#4ade80" : "#334155"}`,
                  borderRadius: 12,
                  padding: "16px 24px",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#f8fafc",
                  textAlign: "center"
                }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  },
});
