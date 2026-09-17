import type { SceneComponent, SceneType } from './scene.contract';

export interface SceneRegistration<TData = Record<string, unknown>> {
  type: SceneType;
  component: SceneComponent<TData>;
  displayName: string;
  description?: string;
  defaultDurationInFrames?: number;
}

export interface ISceneRegistry {
  register<TData = Record<string, unknown>>(registration: SceneRegistration<TData>): void;
  get<TData = Record<string, unknown>>(type: SceneType): SceneRegistration<TData> | undefined;
  has(type: SceneType): boolean;
  list(): SceneRegistration[];
}
