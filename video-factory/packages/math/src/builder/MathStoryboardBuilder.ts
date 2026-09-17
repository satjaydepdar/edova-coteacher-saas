import {
  Storyboard,
  validateStoryboard,
  SceneNode,
  StoryboardMetadata,
  StoryboardTheme,
  StoryboardAudioConfig,
  MathConceptIntroSceneNode,
  MathStepByStepSceneNode,
  MathVisualProofSceneNode,
  MathPracticeChallengeSceneNode,
  CoreAnswerSceneNode
} from '@video-factory/storyboard';

export class MathStoryboardBuilder {
  private metadata: StoryboardMetadata;
  private theme: StoryboardTheme = {};
  private audio: StoryboardAudioConfig = { voiceoverTracks: [] };
  private scenes: SceneNode[] = [];

  constructor(id: string, title: string) {
    this.metadata = {
      id,
      title,
      version: '1.0.0',
      author: 'Edova Math Pod',
      fps: 30,
      width: 1920,
      height: 1080,
      tags: ['math', 'education']
    };
  }

  setMetadata(meta: Partial<StoryboardMetadata>): this {
    this.metadata = { ...this.metadata, ...meta };
    return this;
  }

  setDimensions(width: number, height: number, fps = 30): this {
    this.metadata.width = width;
    this.metadata.height = height;
    this.metadata.fps = fps;
    return this;
  }

  setTheme(theme: StoryboardTheme): this {
    this.theme = theme;
    return this;
  }

  setBackgroundMusic(url: string, volume = 0.15): this {
    this.audio.backgroundMusic = {
      url,
      volume,
      loop: true,
      fadeInFrames: 30,
      fadeOutFrames: 30
    };
    return this;
  }

  addConceptIntro(scene: Omit<MathConceptIntroSceneNode, 'type'>): this {
    this.scenes.push({
      type: 'math.concept_intro',
      ...scene
    });
    return this;
  }

  addStepByStep(scene: Omit<MathStepByStepSceneNode, 'type'>): this {
    this.scenes.push({
      type: 'math.step_by_step',
      ...scene
    });
    return this;
  }

  addVisualProof(scene: Omit<MathVisualProofSceneNode, 'type'>): this {
    this.scenes.push({
      type: 'math.visual_proof',
      ...scene
    });
    return this;
  }

  addPracticeChallenge(scene: Omit<MathPracticeChallengeSceneNode, 'type'>): this {
    this.scenes.push({
      type: 'math.practice_challenge',
      ...scene
    });
    return this;
  }

  addAnswer(scene: Omit<CoreAnswerSceneNode, 'type'>): this {
    this.scenes.push({
      type: 'core.answer',
      ...scene
    });
    return this;
  }

  /**
   * Compiles the storyboard and validates against Zod schema
   */
  build(): Storyboard {
    const rawStoryboard: Storyboard = {
      schemaVersion: '1.0.0',
      metadata: this.metadata,
      theme: this.theme,
      audio: this.audio,
      scenes: this.scenes
    };

    const validation = validateStoryboard(rawStoryboard);
    if (!validation.success || !validation.data) {
      throw new Error(
        `MathStoryboardBuilder: Failed to build valid storyboard:\n  ${validation.errors?.join('\n  ')}`
      );
    }

    return validation.data;
  }
}
