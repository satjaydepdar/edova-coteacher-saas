#!/usr/bin/env bash
# video-factory scaffold — creates the full monorepo
# Run with: bash scaffold.sh   (Git Bash on Windows, or any Linux/macOS/WSL shell)
set -euo pipefail

ROOT="video-factory"
mkdir -p "$ROOT" && cd "$ROOT"

mkdir -p packages/storyboard/src \
         packages/core/src/scenes \
         packages/math/src/lib packages/math/src/scenes packages/math/src/builders \
         packages/math/src/examples packages/math/src/__tests__ \
         apps/renderer/src apps/renderer/public/assets \
         apps/pipeline/src/cli storyboards

# ============ ROOT ============
cat > package.json <<'EOF'
{
  "name": "video-factory",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "engines": { "node": ">=20" },
  "scripts": {
    "dev:renderer": "npm run dev -w @vf/renderer",
    "typecheck": "tsc --noEmit -p tsconfig.base.json",
    "test": "vitest run",
    "sb:hcf": "tsx apps/pipeline/src/cli/build-storyboard.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "jsx": "react-jsx", "strict": true, "skipLibCheck": true,
    "esModuleInterop": true, "resolveJsonModule": true, "noEmit": true
  }
}
EOF

cat > docker-compose.yml <<'EOF'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: vf, POSTGRES_DB: videofactory }
    ports: ["5432:5432"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: vf, MINIO_ROOT_PASSWORD: vfsecret }
    ports: ["9000:9000", "9001:9001"]
EOF

cat > .gitignore <<'EOF'
node_modules/
out/
*.props.json
.env
EOF

cat > README.md <<'EOF'
# video-factory

Monorepo scaffold for the video-explainer factory.

## Quickstart (silent preview mode — no TTS needed)
npm install
npm run sb:hcf        # generates storyboards/hcf-60-84-108.json
npm run dev:renderer  # Remotion Studio at http://localhost:3000
npm test              # golden math tests

## Later
docker compose up -d  # redis + postgres + minio (for the pipeline worker)
EOF

# ============ packages/storyboard ============
cat > packages/storyboard/package.json <<'EOF'
{ "name": "@vf/storyboard", "main": "src/index.ts", "dependencies": { "zod": "^3.23.0" } }
EOF

cat > packages/storyboard/src/index.ts <<'EOF'
import { z } from "zod";

export const SceneSchema = z.object({
  id: z.string(),
  type: z.string(),                      // namespaced: "math.factorPills"
  narration: z.string().min(1),
  padMs: z.number().int().default(400),  // breathing room after audio
  visual: z.record(z.unknown()),
});

export const StoryboardSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  template: z.string(),
  schemaVersion: z.literal("1.0"),
  question: z.string().optional(),
  aspect: z.enum(["16:9", "9:16"]).default("16:9"),
  fps: z.union([z.literal(30), z.literal(60)]).default(30),
  scenes: z.array(SceneSchema).min(1),
  componentLock: z.record(z.string()).default({}),   // scene type -> semver
});

export type Storyboard = z.infer<typeof StoryboardSchema>;
export type Scene = z.infer<typeof SceneSchema>;
EOF

# ============ packages/core ============
cat > packages/core/package.json <<'EOF'
{
  "name": "@vf/core",
  "main": "src/index.ts",
  "dependencies": { "react": "^18.3.0", "remotion": "^4.0.0", "zod": "^3.23.0" }
}
EOF

cat > packages/core/src/scene.ts <<'EOF'
import type { z } from "zod";
import type { FC } from "react";

export interface SceneProps<V> {
  visual: V;                  // typed payload from storyboard.json
  durationInFrames: number;   // derived from TTS audio — never hardcoded
  fps: number;
}

export interface SceneDefinition<V = unknown> {
  type: string;               // namespaced: "math.*", "phy.*", "chem.*", "bio.*"
  schema: z.ZodType<V>;       // validated at build AND render time
  component: FC<SceneProps<V>>;
}

export const defineScene = <V,>(d: SceneDefinition<V>): SceneDefinition<V> => d;
export type AnyScene = SceneDefinition<any>;
export type SceneRegistry = Record<string, AnyScene>;

export function mergeRegistries(...rs: SceneRegistry[]): SceneRegistry {
  const out: SceneRegistry = {};
  for (const r of rs) for (const [k, v] of Object.entries(r)) {
    if (out[k]) throw new Error(`Duplicate scene type: ${k}`);
    out[k] = v;
  }
  return out;
}
EOF

cat > packages/core/src/primitives.tsx <<'EOF'
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const GROUP_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#f472b6", "#34d399"];

export const Pill: React.FC<{ label: string; highlight?: boolean; scale?: number; size?: number }> =
({ label, highlight, scale = 1, size = 60 }) => (
  <div style={{
    width: size, height: size * 0.72, borderRadius: 12, display: "grid", placeItems: "center",
    background: highlight ? "#dcfce7" : "#f1f5f9",
    border: `2.5px solid ${highlight ? "#16a34a" : "#cbd5e1"}`,
    color: highlight ? "#15803d" : "#64748b",
    fontSize: size * 0.42, fontWeight: 700, transform: `scale(${scale})`,
  }}>{label}</div>
);

export const Typed: React.FC<{ text: string; from: number; size?: number; color?: string }> =
({ text, from, size = 34, color = "#0f172a" }) => {
  const frame = useCurrentFrame();
  const k = text.length === 0 ? 1 : interpolate(
    frame,
    [from, Math.max(from + 1, from + text.length * 1.2)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <span style={{ fontSize: size, fontWeight: 700, color }}>{text.slice(0, Math.ceil(k * text.length))}</span>;
};

/** Scaffold captions: even word timing. Swap for word-timestamps when TTS lands. */
export const EstimatedKaraoke: React.FC<{ text: string; durationInFrames: number }> =
({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/);
  const active = Math.min(words.length - 1, Math.floor((frame / durationInFrames) * words.length));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, display: "flex",
      flexWrap: "wrap", justifyContent: "center", gap: 8, padding: "0 60px" }}>
      {words.map((w, i) => (
        <span key={i} style={{ fontSize: 30, fontWeight: i === active ? 800 : 500,
          color: i === active ? "#0284c7" : "#94a3b8" }}>{w}</span>
      ))}
    </div>
  );
};
EOF

cat > packages/core/src/scenes/answer.tsx <<'EOF'
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
EOF

cat > packages/core/src/index.ts <<'EOF'
export * from "./scene";
export * from "./primitives";
import { answer } from "./scenes/answer";
import type { SceneRegistry } from "./scene";
export const coreScenes: SceneRegistry = { "core.answer": answer };
EOF

# ============ packages/math ============
cat > packages/math/package.json <<'EOF'
{
  "name": "@vf/math",
  "main": "src/index.ts",
  "dependencies": { "@vf/core": "*", "@vf/storyboard": "*", "react": "^18.3.0", "remotion": "^4.0.0", "zod": "^3.23.0" }
}
EOF

cat > packages/math/src/lib/math-utils.ts <<'EOF'
export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
export const hcf = (ns: number[]): number => ns.reduce(gcd);
export const lcm = (ns: number[]): number => ns.reduce((a, b) => (a * b) / gcd(a, b));
export const factorize = (n: number): number[] => {
  const f: number[] = [];
  for (let d = 2; n > 1; d++) while (n % d === 0) { f.push(d); n /= d; }
  return f;
};
export const divisors = (n: number): number[] => {
  const d: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i);
  return d;
};
export const commonDivisors = (ns: number[]): number[] =>
  divisors(ns[0]).filter((d) => ns.every((n) => n % d === 0));
/** e.g. [60,84,108] -> [2,2,3] (common primes with lowest exponents) */
export function commonPrimePowers(ns: number[]): number[] {
  const fs = ns.map(factorize);
  const primes = [...new Set(fs.flat())];
  const out: number[] = [];
  for (const p of primes) {
    const min = Math.min(...fs.map((f) => f.filter((x) => x === p).length));
    for (let i = 0; i < min; i++) out.push(p);
  }
  return out;
}
EOF

cat > packages/math/src/scenes/groups.tsx <<'EOF'
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
EOF

cat > packages/math/src/scenes/factorPills.tsx <<'EOF'
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
EOF

cat > packages/math/src/scenes/primeFactorisation.tsx <<'EOF'
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
EOF

cat > packages/math/src/scenes/verify.tsx <<'EOF'
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
EOF

cat > packages/math/src/builders/hcf-max-seating.ts <<'EOF'
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
EOF

cat > packages/math/src/examples/hcf-60-84-108.ts <<'EOF'
import { buildHcfMaxSeating } from "../builders/hcf-max-seating";
export const hcfExample = buildHcfMaxSeating({
  question: "In each room the same number of participants are to be seated and all of them being in the same subject, hence maximum participants that can be accommodated in each room are: a)14 b)12 c)16 d)18",
  groups: [{ label: "Hindi", n: 60 }, { label: "English", n: 84 }, { label: "Maths", n: 108 }],
  answerOption: "b",
});
EOF

cat > packages/math/src/__tests__/math-utils.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { hcf, factorize, commonDivisors, commonPrimePowers, lcm } from "../lib/math-utils";

describe("golden numbers — HCF case study", () => {
  it("hcf(60,84,108) = 12", () => expect(hcf([60, 84, 108])).toBe(12));
  it("factorize(108) = [2,2,3,3,3]", () => expect(factorize(108)).toEqual([2, 2, 3, 3, 3]));
  it("common divisors = [1,2,3,4,6,12]", () => expect(commonDivisors([60, 84, 108])).toEqual([1, 2, 3, 4, 6, 12]));
  it("common prime powers = [2,2,3]", () => expect(commonPrimePowers([60, 84, 108])).toEqual([2, 2, 3]));
  it("lcm sanity", () => expect(lcm([4, 6])).toBe(12));
});
EOF

cat > packages/math/src/index.ts <<'EOF'
export * from "./lib/math-utils";
export { groups } from "./scenes/groups";
export { factorPills } from "./scenes/factorPills";
export { primeFactorisation } from "./scenes/primeFactorisation";
export { verify } from "./scenes/verify";
export { buildHcfMaxSeating } from "./builders/hcf-max-seating";
export { hcfExample } from "./examples/hcf-60-84-108";
import { groups } from "./scenes/groups";
import { factorPills } from "./scenes/factorPills";
import { primeFactorisation } from "./scenes/primeFactorisation";
import { verify } from "./scenes/verify";
import type { SceneRegistry } from "@vf/core";
export const mathScenes: SceneRegistry = {
  "math.groups": groups, "math.factorPills": factorPills,
  "math.primeFactorisation": primeFactorisation, "math.verify": verify,
};
EOF

# ============ apps/renderer ============
cat > apps/renderer/package.json <<'EOF'
{
  "name": "@vf/renderer",
  "scripts": {
    "dev": "remotion studio",
    "render:hcf": "remotion render src/index.ts Explainer out/hcf-60-84-108.mp4 --props=../../storyboards/hcf-60-84-108.props.json"
  },
  "dependencies": { "@vf/core": "*", "@vf/math": "*", "@vf/storyboard": "*",
    "@remotion/cli": "^4.0.0", "react": "^18.3.0", "remotion": "^4.0.0" }
}
EOF

cat > apps/renderer/remotion.config.ts <<'EOF'
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(8);
EOF

cat > apps/renderer/src/timeline.ts <<'EOF'
import type { Storyboard } from "@vf/storyboard";

export interface TimelineSlot { id: string; from: number; durationInFrames: number }
export interface Timeline { totalFrames: number; scenes: TimelineSlot[] }

export function buildTimeline(sb: Storyboard, audioDurations?: Record<string, number>): Timeline {
  const fps = sb.fps;
  let from = 0;
  const scenes: TimelineSlot[] = sb.scenes.map((s) => {
    const words = s.narration.split(/\s+/).length;
    const estimated = Math.max(2.5, words / 2.6);              // ~2.6 words/sec fallback
    const sec = (audioDurations?.[s.id] ?? estimated) + s.padMs / 1000;
    const durationInFrames = Math.ceil(sec * fps);
    const slot = { id: s.id, from, durationInFrames };
    from += durationInFrames;
    return slot;
  });
  return { totalFrames: from, scenes };
}
EOF

cat > apps/renderer/src/registry.ts <<'EOF'
import { coreScenes, mergeRegistries, type SceneRegistry } from "@vf/core";
import { mathScenes } from "@vf/math";
export const REGISTRY: SceneRegistry = mergeRegistries(coreScenes, mathScenes);
// physics/chem/bio pods add theirs here — one line each, zero platform changes
EOF

cat > apps/renderer/src/Explainer.tsx <<'EOF'
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { Storyboard } from "@vf/storyboard";
import { REGISTRY } from "./registry";
import { buildTimeline } from "./timeline";
import { EstimatedKaraoke } from "@vf/core";

export interface ExplainerProps {
  storyboard: Storyboard;
  audioDurations?: Record<string, number>;
}

export const Explainer: React.FC<ExplainerProps> = ({ storyboard, audioDurations }) => {
  const tl = buildTimeline(storyboard, audioDurations);
  return (
    <AbsoluteFill style={{ background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {storyboard.scenes.map((scene) => {
        const slot = tl.scenes.find((s) => s.id === scene.id)!;
        const def = REGISTRY[scene.type];
        if (!def) throw new Error(`Unknown scene type: ${scene.type}`);
        const C = def.component;
        return (
          <Sequence key={scene.id} from={slot.from} durationInFrames={slot.durationInFrames} name={`${scene.id}:${scene.type}`}>
            <C visual={def.schema.parse(scene.visual)} durationInFrames={slot.durationInFrames} fps={storyboard.fps} />
            <EstimatedKaraoke text={scene.narration} durationInFrames={slot.durationInFrames} />
            {audioDurations?.[scene.id] != null && (
              <Audio src={staticFile(`assets/${storyboard.videoId}/${scene.id}.wav`)} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
EOF

cat > apps/renderer/src/Root.tsx <<'EOF'
import React from "react";
import { Composition, registerRoot, type CalculateMetadataFunction } from "remotion";
import { Explainer, type ExplainerProps } from "./Explainer";
import { buildTimeline } from "./timeline";
import { hcfExample } from "@vf/math";

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = ({ props }) => {
  const sb = props.storyboard;
  return {
    fps: sb.fps,
    width: sb.aspect === "9:16" ? 1080 : 1920,
    height: sb.aspect === "9:16" ? 1920 : 1080,
    durationInFrames: buildTimeline(sb, props.audioDurations).totalFrames,
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Explainer" component={Explainer}
    defaultProps={{ storyboard: hcfExample }}
    calculateMetadata={calculateMetadata} />
);
EOF

cat > apps/renderer/src/index.ts <<'EOF'
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
EOF

touch apps/renderer/public/assets/.gitkeep

# ============ apps/pipeline ============
cat > apps/pipeline/package.json <<'EOF'
{
  "name": "@vf/pipeline",
  "dependencies": { "@vf/math": "*", "@vf/storyboard": "*", "bullmq": "^5.0.0", "ioredis": "^5.4.0" }
}
EOF

cat > apps/pipeline/src/cli/build-storyboard.ts <<'EOF'
import { writeFileSync, mkdirSync } from "node:fs";
import { buildHcfMaxSeating } from "@vf/math";

const groups = [
  { label: "Hindi", n: 60 }, { label: "English", n: 84 }, { label: "Maths", n: 108 },
];
const sb = buildHcfMaxSeating({
  question: "CASE STUDY 2 — seminar participants; maximum per room (a)14 (b)12 (c)16 (d)18",
  groups, answerOption: "b",
});
mkdirSync("storyboards", { recursive: true });
writeFileSync(`storyboards/${sb.videoId}.json`, JSON.stringify(sb, null, 2));
writeFileSync(`storyboards/${sb.videoId}.props.json`, JSON.stringify({ storyboard: sb }));
console.log(`wrote storyboards/${sb.videoId}.json (${sb.scenes.length} scenes)`);
EOF

cat > apps/pipeline/src/worker.ts <<'EOF'
import { Worker } from "bullmq";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { StoryboardSchema, type Storyboard } from "@vf/storyboard";

const connection = { host: process.env.REDIS_HOST ?? "localhost", port: 6379 };

async function run(job: any, name: string, fn: () => Promise<void> | void) {
  await job.updateProgress({ step: name });
  console.log(`[${job.id}] > ${name}`);
  await fn();
}

// TTS stub — replaced by azure.ts (word timestamps) in the next increment
async function synthAll(videoId: string, sb: Storyboard): Promise<Record<string, number>> {
  const dir = `apps/renderer/public/assets/${videoId}`;
  if (!existsSync(dir)) { console.log(`  no wavs for ${videoId} — silent preview mode`); return {}; }
  const durations: Record<string, number> = {};
  for (const s of sb.scenes) {
    const f = `${dir}/${s.id}.wav`;
    if (existsSync(f)) durations[s.id] = parseFloat(execFileSync("ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
  }
  return durations;
}

new Worker("videos", async (job) => {
  const { videoId } = job.data as { videoId: string };
  const sb = StoryboardSchema.parse(JSON.parse(readFileSync(`storyboards/${videoId}.json`, "utf8")));

  await run(job, "tts+plan", async () => {
    const audioDurations = await synthAll(videoId, sb);
    writeFileSync(`storyboards/${videoId}.props.json`,
      JSON.stringify({ storyboard: sb, audioDurations }));
  });

  await run(job, "render", () => {
    execFileSync("npx", ["remotion", "render", "apps/renderer/src/index.ts", "Explainer",
      `out/${videoId}.mp4`, `--props=storyboards/${videoId}.props.json`], { stdio: "inherit" });
  });

  await run(job, "qc+publish", async () => {
    // TODO: loudnorm -16 LUFS, ffprobe A/V gate (<200ms), thumbnail, S3 upload, DB row
    console.log(`  done: out/${videoId}.mp4`);
  });
}, { connection, concurrency: 2 });
EOF

echo "Scaffold complete: $(find . -type f | grep -v node_modules | wc -l) files created in $ROOT/"
