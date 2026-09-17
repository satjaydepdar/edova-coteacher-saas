import { coreScenes, mergeRegistries, type SceneRegistry } from "@vf/core";
import { mathScenes, trigDiagram, trigSteps } from "@vf/math";

export const REGISTRY: SceneRegistry = {
  ...mergeRegistries(coreScenes, mathScenes),
  "math.trigDiagram": trigDiagram,
  "math.trigSteps": trigSteps,
};
// physics/chem/bio pods add theirs here — one line each, zero platform changes
