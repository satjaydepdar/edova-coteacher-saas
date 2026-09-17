export * from "./scene";
export * from "./primitives";
import { answer } from "./scenes/answer";
import type { SceneRegistry } from "./scene";
export const coreScenes: SceneRegistry = { "core.answer": answer };
