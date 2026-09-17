import type { Storyboard } from "@vf/storyboard";

export interface TimelineSlot { id: string; from: number; durationInFrames: number }
export interface Timeline { totalFrames: number; scenes: TimelineSlot[] }

export function buildTimeline(sb: Storyboard, audioDurations?: Record<string, number>): Timeline {
  const fps = sb.fps;
  let from = 0;
  const scenes: TimelineSlot[] = sb.scenes.map((s) => {
    const words = s.narration.split(/\s+/).length;
    const estimated = Math.max(2.5, words / 2.6);              // ~2.6 words/sec fallback
    const sec = (audioDurations?.[s.id] ?? estimated) + s.padMs / 1000;
    const durationInFrames = Math.ceil(sec * fps);
    const slot = { id: s.id, from, durationInFrames };
    from += durationInFrames;
    return slot;
  });
  return { totalFrames: from, scenes };
}
