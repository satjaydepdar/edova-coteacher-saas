import { StoryboardSchema, type Storyboard } from "@vf/storyboard";
import { hcf, commonPrimePowers, commonDivisors } from "../lib/math-utils";

export interface HcfInput {
  question: string;
  groups: { label: string; n: number }[];
  answerOption?: string;
  narrationOverrides?: Record<string, string>; // sceneId -> SME-approved narration
}

export function buildHcfMaxSeating(input: HcfInput): Storyboard {
  const ns = input.groups.map((g) => g.n);
  const h = hcf(ns);
  const parts = commonPrimePowers(ns);
  const lock = { "math.groups": "0.1.0", "math.factorPills": "0.1.0",
    "math.primeFactorisation": "0.1.0", "math.verify": "0.1.0", "core.answer": "0.1.0" };

  const scenes = [
    { id: "s1", type: "math.groups", padMs: 400,
      narration: `A seminar has ${input.groups.map((g) => `${g.n} ${g.label}`).join(", ")} participants.`,
      visual: { groups: input.groups } },
    { id: "s2", type: "math.factorPills", padMs: 500,
      narration: `The room size must divide every count exactly. The numbers that do are the common factors: ${commonDivisors(ns).join(", ")}.`,
      visual: { groups: input.groups } },
    { id: "s3", type: "math.primeFactorisation", padMs: 500,
      narration: `Exam method: prime factorisation. Take the primes common to all, with the lowest powers: ${parts.join(" times ")} equals ${h}.`,
      visual: { groups: input.groups } },
    { id: "s4", type: "math.verify", padMs: 500,
      narration: `Check: ${input.groups.map((g) => `${g.n} divided by ${h} is ${g.n / h} rooms`).join(", ")}. No one is left out.`,
      visual: { groups: input.groups, hcf: h } },
    { id: "s5", type: "core.answer", padMs: 600,
      narration: `The maximum number of participants per room is ${h}. Answer: option ${input.answerOption ?? "?"}.`,
      visual: { headline: `Maximum per room = ${h}`,
        sub: input.answerOption ? `Answer: option (${input.answerOption}) · ${ns.join(", ")} -> ${h}` : undefined } },
  ].map((s) => ({ ...s, narration: input.narrationOverrides?.[s.id] ?? s.narration }));

  return StoryboardSchema.parse({
    videoId: `hcf-${ns.join("-")}`,
    title: `Maximum per room — HCF of ${ns.join(", ")}`,
    template: "hcf-max-seating", schemaVersion: "1.0",
    question: input.question, aspect: "16:9", fps: 30,
    scenes, componentLock: lock,
  });
}
