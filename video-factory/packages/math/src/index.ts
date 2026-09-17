export * from "./lib/math-utils";
export { groups } from "./scenes/groups";
export { factorPills } from "./scenes/factorPills";
export { primeFactorisation } from "./scenes/primeFactorisation";
export { verify } from "./scenes/verify";
export { trigDiagram } from "./scenes/trigDiagram";
export { trigSteps } from "./scenes/trigSteps";
export { buildHcfMaxSeating } from "./builders/hcf-max-seating";
export { hcfExample } from "./examples/hcf-60-84-108";
export { buildTrigDepressionRiver } from "./builders/trig-depression";

import { groups } from "./scenes/groups";
import { factorPills } from "./scenes/factorPills";
import { primeFactorisation } from "./scenes/primeFactorisation";
import { verify } from "./scenes/verify";
import { trigDiagram } from "./scenes/trigDiagram";
import { trigSteps } from "./scenes/trigSteps";
import type { SceneRegistry } from "@vf/core";

export const mathScenes: SceneRegistry = {
  "math.groups": groups,
  "math.factorPills": factorPills,
  "math.primeFactorisation": primeFactorisation,
  "math.verify": verify,
  "math.trigDiagram": trigDiagram,
  "math.trigSteps": trigSteps,
};
