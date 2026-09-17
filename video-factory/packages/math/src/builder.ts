import { Storyboard, StoryboardSchema, Scene } from "@vf/storyboard";

export class MathStoryboardBuilder {
  private videoId: string;
  private title: string;
  private template = "math.standard";
  private question?: string;
  private aspect: "16:9" | "9:16" = "16:9";
  private fps: 30 | 60 = 30;
  private scenes: Scene[] = [];
  private componentLock: Record<string, string> = {};

  constructor(videoId: string, title: string) {
    this.videoId = videoId;
    this.title = title;
  }

  setQuestion(q: string): this {
    this.question = q;
    return this;
  }

  setAspect(aspect: "16:9" | "9:16"): this {
    this.aspect = aspect;
    return this;
  }

  setFps(fps: 30 | 60): this {
    this.fps = fps;
    return this;
  }

  addScene(scene: Scene): this {
    this.scenes.push(scene);
    return this;
  }

  addFactorPills(id: string, narration: string, visual: {
    title: string;
    expression: string;
    factors: Array<{ label: string; highlight?: boolean }>;
    note?: string;
  }, padMs = 400): this {
    return this.addScene({
      id,
      type: "math.factorPills",
      narration,
      padMs,
      visual,
    });
  }

  addStepByStep(id: string, narration: string, visual: {
    problem: string;
    steps: Array<{ label: string; equation: string; explanation?: string }>;
  }, padMs = 400): this {
    return this.addScene({
      id,
      type: "math.stepByStep",
      narration,
      padMs,
      visual,
    });
  }

  addVisualProof(id: string, narration: string, visual: {
    title: string;
    theorem: string;
    dimensions?: { width: number; height: number };
  }, padMs = 400): this {
    return this.addScene({
      id,
      type: "math.visualProof",
      narration,
      padMs,
      visual: {
        dimensions: { width: 400, height: 260 },
        ...visual,
      },
    });
  }

  addPracticeChallenge(id: string, narration: string, visual: {
    question: string;
    options: string[];
    answerIndex: number;
    countdownSeconds?: number;
  }, padMs = 400): this {
    return this.addScene({
      id,
      type: "math.practiceChallenge",
      narration,
      padMs,
      visual: {
        countdownSeconds: 5,
        ...visual,
      },
    });
  }

  addAnswer(id: string, narration: string, visual: {
    headline: string;
    sub?: string;
  }, padMs = 400): this {
    return this.addScene({
      id,
      type: "core.answer",
      narration,
      padMs,
      visual,
    });
  }

  build(): Storyboard {
    const raw = {
      videoId: this.videoId,
      title: this.title,
      template: this.template,
      schemaVersion: "1.0",
      question: this.question,
      aspect: this.aspect,
      fps: this.fps,
      scenes: this.scenes,
      componentLock: this.componentLock,
    };

    return StoryboardSchema.parse(raw);
  }
}
