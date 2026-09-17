import { z } from 'zod';

export const AudioCueSchema = z.object({
  id: z.string(),
  audioUrl: z.string(),
  startFrameOffset: z.number().int().nonnegative().default(0),
  durationInFrames: z.number().int().positive().optional(),
  volume: z.number().min(0).max(1).default(1)
});

export const BackgroundMusicSchema = z.object({
  url: z.string(),
  volume: z.number().min(0).max(1).default(0.15),
  loop: z.boolean().default(true),
  fadeInFrames: z.number().int().nonnegative().default(30),
  fadeOutFrames: z.number().int().nonnegative().default(30)
});

export const StoryboardAudioSchema = z.object({
  backgroundMusic: BackgroundMusicSchema.optional(),
  voiceoverTracks: z.array(AudioCueSchema).default([])
});

export type AudioCueConfig = z.infer<typeof AudioCueSchema>;
export type BackgroundMusicConfig = z.infer<typeof BackgroundMusicSchema>;
export type StoryboardAudioConfig = z.infer<typeof StoryboardAudioSchema>;
