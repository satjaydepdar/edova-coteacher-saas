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
