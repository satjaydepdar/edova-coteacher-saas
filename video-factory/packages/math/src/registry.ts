import type { SceneRegistry } from "@vf/core";
import { factorPills } from "./scenes/factorPills";
import { stepByStep } from "./scenes/stepByStep";
import { visualProof } from "./scenes/visualProof";
import { practiceChallenge } from "./scenes/practiceChallenge";

export const mathRegistry: SceneRegistry = {
  [factorPills.type]: factorPills,
  [stepByStep.type]: stepByStep,
  [visualProof.type]: visualProof,
  [practiceChallenge.type]: practiceChallenge,
};
