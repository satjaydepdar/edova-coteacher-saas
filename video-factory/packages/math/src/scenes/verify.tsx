import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene, Pill, Typed } from "@vf/core";

const VerifyVisual = z.object({
  groups: z.array(z.object({ label: z.string(), n: z.number().int().positive() })).min(2),
  hcf: z.number().int().positive(),
});

export const verify = defineScene({
  type: "math.verify",
  schema: VerifyVisual,
  component: ({ visual }) => {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>Check — does everyone get a seat?</div>
        {visual.groups.map((g: { label: string; n: number }, row: number) => {
          const k = g.n / visual.hcf;
          return (
            <div key={g.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 460, textAlign: "right", fontSize: 32, fontWeight: 700 }}>
                <Typed text={`${g.n} ÷ ${visual.hcf} = ${k} rooms`} from={row * 20} />
              </div>
              {k <= 12 && Array.from({ length: k }).map((_, i) => (
                <Pill key={i} label={String(visual.hcf)} size={50}
                  scale={i < Math.max(0, Math.floor((frame - row * 20 - 25) / 2)) ? 1 : 0} />
              ))}
            </div>
          );
        })}
        <Typed text="✓ No one left out — all seated!" from={80} size={38} color="#15803d" />
      </AbsoluteFill>
    );
  },
});
