import { z } from 'zod';
import { AudioCueSchema } from './audio.schema';

export const SceneTransitionSchema = z.object({
  type: z.enum(['fade', 'slide-left', 'slide-right', 'zoom', 'none']).default('fade'),
  durationInFrames: z.number().int().nonnegative().default(15)
});

export const SceneTimingSchema = z.object({
  durationInSeconds: z.number().positive().optional(),
  durationInFrames: z.number().int().positive().optional()
}).refine(data => data.durationInSeconds !== undefined || data.durationInFrames !== undefined, {
  message: 'Either durationInSeconds or durationInFrames must be provided'
});

const BaseSceneProperties = {
  id: z.string().min(1, 'Scene ID is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  timing: SceneTimingSchema,
  transition: SceneTransitionSchema.default({ type: 'fade', durationInFrames: 15 }),
  audioCues: z.array(AudioCueSchema).default([])
};

// 1. Core Answer Scene
export const CoreAnswerSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.literal('core.answer'),
  answerLabel: z.string().default('VERIFIED ANSWER'),
  answerLatex: z.string().optional(),
  answerText: z.string().optional(),
  explanation: z.string().optional(),
  takeaways: z.array(z.string()).default([]),
  verificationNote: z.string().optional()
});

// 2. Math Concept Intro Scene
export const MathConceptIntroSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.literal('math.concept_intro'),
  conceptName: z.string().min(1),
  hookLatex: z.string().optional(),
  questionPrompt: z.string().min(1),
  contextDescription: z.string().optional(),
  badgeText: z.string().default('Core Concept')
});

// 3. Math Step-by-Step Scene
export const MathDerivationStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  label: z.string(),
  latex: z.string(),
  explanation: z.string().optional(),
  highlight: z.boolean().default(false)
});

export const MathStepByStepSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.literal('math.step_by_step'),
  problemLatex: z.string(),
  steps: z.array(MathDerivationStepSchema).min(1),
  activeStepFrameInterval: z.number().int().positive().default(45),
  ruleCallout: z.string().optional()
});

// 4. Math Visual Proof Scene
export const MathProofPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
  color: z.string().optional()
});

export const MathVisualProofSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.literal('math.visual_proof'),
  proofTitle: z.string(),
  diagramType: z.enum(['geometric_box', 'coordinate_grid', 'number_line', 'triangle_slope']),
  theoremLatex: z.string(),
  points: z.array(MathProofPointSchema).default([]),
  caption: z.string().optional()
});

// 5. Math Practice Challenge Scene
export const ChallengeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  isCorrect: z.boolean().default(false)
});

export const MathPracticeChallengeSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.literal('math.practice_challenge'),
  promptQuestion: z.string(),
  problemLatex: z.string().optional(),
  countdownSeconds: z.number().int().positive().default(5),
  options: z.array(ChallengeOptionSchema).default([]),
  hint: z.string().optional()
});

// Custom / Generic scene fallback
export const GenericSceneSchema = z.object({
  ...BaseSceneProperties,
  type: z.string(),
  payload: z.record(z.unknown()).default({})
});

export const SceneNodeSchema = z.discriminatedUnion('type', [
  CoreAnswerSceneSchema,
  MathConceptIntroSceneSchema,
  MathStepByStepSceneSchema,
  MathVisualProofSceneSchema,
  MathPracticeChallengeSceneSchema
]);

export type SceneTransition = z.infer<typeof SceneTransitionSchema>;
export type SceneTiming = z.infer<typeof SceneTimingSchema>;
export type CoreAnswerSceneNode = z.infer<typeof CoreAnswerSceneSchema>;
export type MathConceptIntroSceneNode = z.infer<typeof MathConceptIntroSceneSchema>;
export type MathStepByStepSceneNode = z.infer<typeof MathStepByStepSceneSchema>;
export type MathVisualProofSceneNode = z.infer<typeof MathVisualProofSceneSchema>;
export type MathPracticeChallengeSceneNode = z.infer<typeof MathPracticeChallengeSceneSchema>;
export type SceneNode = z.infer<typeof SceneNodeSchema>;
