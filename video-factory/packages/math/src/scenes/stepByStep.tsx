import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { z } from "zod";
import { defineScene, Typed } from "@vf/core";

export const StepByStepVisual = z.object({
  problem: z.string(),
  steps: z.array(z.object({
    label: z.string(),
    equation: z.string(),
    explanation: z.string().optional(),
  })),
});

export type StepByStepVisualData = z.infer<typeof StepByStepVisual>;

export const stepByStep = defineScene({
  type: "math.stepByStep",
  schema: StepByStepVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();

    return (
      <AbsoluteFill style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "50px 80px"
      }}>
        <div style={{ marginBottom: 30, textAlign: "center" }}>
          <Typed text="Step-by-Step Solution" from={0} size={42} color="#f8fafc" />
          <div style={{ fontSize: 34, fontWeight: 800, color: "#f59e0b", marginTop: 8 }}>
            {visual.problem}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 850 }}>
          {visual.steps.map((step, idx) => {
            const startFrame = 15 + idx * 30;
            const spr = spring({ frame: Math.max(0, frame - startFrame), fps, config: { damping: 14 } });
            const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            if (frame < startFrame) return null;

            return (
              <div
                key={idx}
                style={{
                  opacity,
                  transform: `scale(${spr})`,
                  background: "#1e293b",
                  border: "2px solid #334155",
                  borderRadius: 12,
                  padding: "18px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>{step.label}</div>
                  {step.explanation && (
                    <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 4 }}>{step.explanation}</div>
                  )}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8", fontFamily: "monospace" }}>
                  {step.equation}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  },
});
