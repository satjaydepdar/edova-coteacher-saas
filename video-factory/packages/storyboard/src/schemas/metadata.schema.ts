import { z } from 'zod';

export const StoryboardMetadataSchema = z.object({
  id: z.string().min(1, 'Storyboard ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  author: z.string().default('Edova Video Factory'),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  targetAudience: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type StoryboardMetadata = z.infer<typeof StoryboardMetadataSchema>;
