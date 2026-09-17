import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene, Pill, Typed } from "@vf/core";
import { divisors, commonDivisors } from "../lib/math-utils";

const FactorPillsVisual = z.object({
  groups: z.array(z.object({ label: z.string(), n: z.number().int().positive() })).min(2),
  title: z.string().default("Factors — common ones highlighted green"),
});

export const factorPills = defineScene({
  type: "math.factorPills",
  schema: FactorPillsVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();
    const commons = new Set(commonDivisors(visual.groups.map((g: any) => g.n)));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a" }}>{visual.title}</div>
        {visual.groups.map((g: { label: string; n: number }, row: number) => {
          const ds = divisors(g.n);
          return (
            <div key={g.label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 300, textAlign: "right", fontSize: 32, fontWeight: 700, color: "#0f172a" }}>
                {g.label} · {g.n}
              </div>
              {ds.map((d, i) => (
                <Pill key={d} label={String(d)} highlight={commons.has(d)}
                  scale={spring({ frame: Math.max(0, frame - (row * 10 + i * 3)), fps, config: { damping: 200 } })} />
              ))}
            </div>
          );
        })}
        <Typed text={`Common factors: ${[...commons].join(", ")}`} from={30} size={38} color="#15803d" />
      </AbsoluteFill>
    );
  },
});
