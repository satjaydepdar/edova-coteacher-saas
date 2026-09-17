import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { defineScene, Pill, Typed } from "@vf/core";
import { factorize, commonPrimePowers } from "../lib/math-utils";

const PFVisual = z.object({
  groups: z.array(z.object({ label: z.string(), n: z.number().int().positive() })).min(2),
  title: z.string().default("Exam method: prime factorisation"),
});

export const primeFactorisation = defineScene({
  type: "math.primeFactorisation",
  schema: PFVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();
    const ns = visual.groups.map((g: any) => g.n);
    const tokens = ns.map(factorize);
    const primes = [...new Set(tokens.flat())];
    const minExp: Record<number, number> = {};
    primes.forEach((p) => (minExp[p] = Math.min(...tokens.map((t) => t.filter((x) => x === p).length))));
    const hcfParts = commonPrimePowers(ns);
    const hcfValue = hcfParts.reduce((a, b) => a * b, 1);
    let delay = 8;

    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>{visual.title}</div>
        {visual.groups.map((g: { label: string; n: number }, row: number) => (
          <div key={g.label} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 32, fontWeight: 700 }}>
            <span style={{ width: 300, textAlign: "right" }}>{g.label} · {g.n} =</span>
            {tokens[row].map((p, j) => {
              const occurrencesBefore = tokens[row].slice(0, j).filter((x) => x === p).length;
              const highlight = occurrencesBefore < minExp[p];
              const s = spring({ frame: Math.max(0, frame - (delay += 1.5)), fps, config: { damping: 200 } });
              return <Pill key={j} label={String(p)} highlight={highlight} scale={s} size={56} />;
            })}
          </div>
        ))}
        <Typed text={`HCF = ${hcfParts.join(" × ")} = ${hcfValue}`} from={delay + 12} size={42} color="#15803d" />
      </AbsoluteFill>
    );
  },
});
