import { globalSceneRegistry, type SceneComponent } from '@video-factory/core';
import { MathConceptIntroScene } from './scenes/MathConceptIntroScene';
import { MathStepByStepScene } from './scenes/MathStepByStepScene';
import { MathVisualProofScene } from './scenes/MathVisualProofScene';
import { MathPracticeChallengeScene } from './scenes/MathPracticeChallengeScene';

/**
 * Registers all Math Pod scenes into the global SceneRegistry
 */
export function registerMathScenes(): void {
  globalSceneRegistry.register({
    type: 'math.concept_intro',
    component: MathConceptIntroScene as unknown as SceneComponent<any>,
    displayName: 'Math Concept Intro',
    description: 'Hook equation, visual context, and problem statement',
    defaultDurationInFrames: 180
  });

  globalSceneRegistry.register({
    type: 'math.step_by_step',
    component: MathStepByStepScene as unknown as SceneComponent<any>,
    displayName: 'Math Step-by-Step Derivation',
    description: 'Progressive disclosure of algebraic or arithmetic steps',
    defaultDurationInFrames: 240
  });

  globalSceneRegistry.register({
    type: 'math.visual_proof',
    component: MathVisualProofScene as unknown as SceneComponent<any>,
    displayName: 'Math Visual Proof',
    description: 'Animated SVG geometric diagrams, coordinates, or area models',
    defaultDurationInFrames: 180
  });

  globalSceneRegistry.register({
    type: 'math.practice_challenge',
    component: MathPracticeChallengeScene as unknown as SceneComponent<any>,
    displayName: 'Math Practice Challenge',
    description: 'Timed question pause with countdown and option choices',
    defaultDurationInFrames: 210
  });
}

// Auto-register on import
registerMathScenes();
