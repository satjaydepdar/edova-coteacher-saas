import type React from 'react';
import type { ThemeConfig } from './theme.contract';

export type SceneType = string;

export interface SceneTransition {
  type: 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'none';
  durationInFrames: number;
}

export interface AudioCue {
  id: string;
  audioUrl: string;
  startFrameOffset?: number;
  durationInFrames?: number;
  volume?: number;
}

export interface SceneTiming {
  durationInSeconds?: number;
  durationInFrames?: number;
}

export interface BaseSceneDefinition {
  id: string;
  type: SceneType;
  title?: string;
  timing: SceneTiming;
  transition?: SceneTransition;
  audioCues?: AudioCue[];
  [key: string]: unknown;
}

export interface SceneComponentProps<TData = Record<string, unknown>> {
  scene: TData & BaseSceneDefinition;
  theme: ThemeConfig;
  currentFrame: number;
  fps: number;
  width: number;
  height: number;
}

export type SceneComponent<TData = Record<string, unknown>> = React.ComponentType<SceneComponentProps<TData>>;
