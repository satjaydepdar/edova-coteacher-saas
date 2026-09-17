import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene, GROUP_COLORS } from "@vf/core";

const GroupsVisual = z.object({
  groups: z.array(z.object({ label: z.string(), n: z.number().int().positive() })).min(2),
});

export const groups = defineScene({
  type: "math.groups",
  schema: GroupsVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, flexDirection: "row" }}>
        {visual.groups.map((g: { label: string; n: number }, i: number) => {
          const s = spring({ frame: Math.max(0, frame - i * 8), fps, config: { damping: 12 } });
          return (
            <div key={g.label} style={{ transform: `scale(${s})`, background: "#fff", border: `3px solid ${GROUP_COLORS[i % 5]}`,
              borderRadius: 18, padding: "36px 48px", textAlign: "center" }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: "#334155" }}>{g.label}</div>
              <div style={{ fontSize: 64, fontWeight: 800, color: GROUP_COLORS[i % 5] }}>{g.n}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  },
});
