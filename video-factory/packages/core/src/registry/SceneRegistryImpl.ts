import type { ISceneRegistry, SceneRegistration } from '../contracts/registry.contract';
import type { SceneComponent, SceneType } from '../contracts/scene.contract';
import { CoreAnswerScene } from '../scenes/CoreAnswerScene';

export class SceneRegistryImpl implements ISceneRegistry {
  private registrations = new Map<SceneType, SceneRegistration<any>>();

  constructor() {
    // Pre-register platform standard scenes
    this.register({
      type: 'core.answer',
      component: CoreAnswerScene as unknown as SceneComponent<any>,
      displayName: 'Core Answer & Solution Recap',
      description: 'Standard solution display scene with answer highlight and recap bullet points',
      defaultDurationInFrames: 150
    });
  }

  register<TData = Record<string, unknown>>(registration: SceneRegistration<TData>): void {
    if (this.registrations.has(registration.type)) {
      console.warn(`[SceneRegistry] Overwriting existing scene type: "${registration.type}"`);
    }
    this.registrations.set(registration.type, registration as unknown as SceneRegistration<any>);
  }

  get<TData = Record<string, unknown>>(type: SceneType): SceneRegistration<TData> | undefined {
    return this.registrations.get(type) as SceneRegistration<TData> | undefined;
  }

  has(type: SceneType): boolean {
    return this.registrations.has(type);
  }

  list(): SceneRegistration[] {
    return Array.from(this.registrations.values());
  }
}

// Export singleton instance for app-wide access
export const globalSceneRegistry = new SceneRegistryImpl();
