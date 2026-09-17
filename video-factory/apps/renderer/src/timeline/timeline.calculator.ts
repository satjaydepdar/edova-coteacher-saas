import type { Storyboard, Scene } from "@vf/storyboard";

export interface ScheduledScene {
  scene: Scene;
  startFrame: number;
  durationInFrames: number;
}

export interface CalculatedTimeline {
  fps: number;
  totalDurationInFrames: number;
  scenes: ScheduledScene[];
}

/**
 * Calculates duration in frames for each scene based on narration text length and padMs breathing room.
 * When real TTS audio durations are passed, they override this estimation.
 */
export function calculateTimeline(
  storyboard: Storyboard,
  audioDurationsSec?: Record<string, number>
): CalculatedTimeline {
  const fps = storyboard.fps;
  let currentStart = 0;

  const scenes: ScheduledScene[] = storyboard.scenes.map(scene => {
    let durationSec: number;

    if (audioDurationsSec && audioDurationsSec[scene.id]) {
      durationSec = audioDurationsSec[scene.id] + scene.padMs / 1000;
    } else {
      // Estimate speaking rate: ~2.6 words per second
      const words = scene.narration.trim().split(/\s+/).length;
      const speechSec = Math.max(1.8, words / 2.6);
      durationSec = speechSec + scene.padMs / 1000;
    }

    const durationInFrames = Math.max(30, Math.round(durationSec * fps));
    const scheduled: ScheduledScene = {
      scene,
      startFrame: currentStart,
      durationInFrames,
    };

    currentStart += durationInFrames;
    return scheduled;
  });

  return {
    fps,
    totalDurationInFrames: Math.max(1, currentStart),
    scenes,
  };
}
