import { z } from "zod";

export const SceneSchema = z.object({
  id: z.string(),
  type: z.string(),                      // namespaced: "math.factorPills"
  narration: z.string().min(1),
  padMs: z.number().int().default(400),  // breathing room after audio
  visual: z.record(z.unknown()),
  // Astra-pipeline fields (backend/services/video_spec_service.py) -- optional so
  // existing hand-authored scene types (math.groups, etc.) are unaffected.
  purpose: z.string().optional(),           // e.g. "problem_introduction", "step_reveal"
  socraticQuestion: z.string().optional(),  // posed before the reveal, if this step warrants one
  thinkingPauseMs: z.number().int().optional(),
  equation: z.string().optional(),          // the verified mathematical expression for this step
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
