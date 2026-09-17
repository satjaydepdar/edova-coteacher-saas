import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { z } from "zod";
import { defineScene, Typed } from "@vf/core";

export const VisualProofVisual = z.object({
  title: z.string(),
  theorem: z.string(),
  dimensions: z.object({
    width: z.number().default(400),
    height: z.number().default(260),
  }),
});

export type VisualProofVisualData = z.infer<typeof VisualProofVisual>;

export const visualProof = defineScene({
  type: "math.visualProof",
  schema: VisualProofVisual,
  component: ({ visual }) => {
    const frame = useCurrentFrame();
    const grow = interpolate(frame, [10, 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });

    return (
      <AbsoluteFill style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "40px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Typed text={visual.title} from={0} size={40} color="#f8fafc" />
          <div style={{ fontSize: 26, color: "#a78bfa", marginTop: 8, fontWeight: 600 }}>
            {visual.theorem}
          </div>
        </div>

        <svg width={visual.dimensions.width} height={visual.dimensions.height} style={{ overflow: "visible" }}>
          <rect
            x={10}
            y={10}
            width={(visual.dimensions.width - 20) * grow}
            height={(visual.dimensions.height - 20) * grow}
            fill="#38bdf822"
            stroke="#38bdf8"
            strokeWidth={3}
            rx={10}
          />
          <line
            x1={10}
            y1={visual.dimensions.height - 10}
            x2={10 + (visual.dimensions.width - 20) * grow}
            y2={10}
            stroke="#f59e0b"
            strokeWidth={4}
            strokeDasharray="6 6"
          />
        </svg>
      </AbsoluteFill>
    );
  },
});
