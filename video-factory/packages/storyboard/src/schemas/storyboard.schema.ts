import { z } from 'zod';
import { StoryboardMetadataSchema } from './metadata.schema';
import { StoryboardThemeSchema } from './theme.schema';
import { StoryboardAudioSchema } from './audio.schema';
import { SceneNodeSchema } from './scene.schema';

export const StoryboardSchema = z.object({
  schemaVersion: z.literal('1.0.0').default('1.0.0'),
  metadata: StoryboardMetadataSchema,
  theme: StoryboardThemeSchema.default({}),
  audio: StoryboardAudioSchema.default({ voiceoverTracks: [] }),
  scenes: z.array(SceneNodeSchema).min(1, 'Storyboard must contain at least one scene')
});

export type Storyboard = z.infer<typeof StoryboardSchema>;
