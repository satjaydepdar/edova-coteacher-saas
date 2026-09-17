export * from "./scene";
export * from "./primitives";
import { answer } from "./scenes/answer";
import { stepReveal } from "./scenes/stepReveal";
import type { SceneRegistry } from "./scene";
export const coreScenes: SceneRegistry = { "core.answer": answer, "core.stepReveal": stepReveal };
