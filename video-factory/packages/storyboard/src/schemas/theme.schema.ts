import { z } from 'zod';

export const ColorPaletteSchema = z.object({
  primary: z.string().default('#4f46e5'),
  secondary: z.string().default('#06b6d4'),
  accent: z.string().default('#f59e0b'),
  background: z.string().default('#0f172a'),
  surface: z.string().default('#1e293b'),
  text: z.string().default('#f8fafc'),
  textMuted: z.string().default('#94a3b8'),
  border: z.string().default('#334155'),
  success: z.string().default('#10b981'),
  warning: z.string().default('#f59e0b'),
  error: z.string().default('#ef4444')
});

export const TypographyConfigSchema = z.object({
  fontFamily: z.string().default('Inter, system-ui, sans-serif'),
  headingFontFamily: z.string().optional(),
  codeFontFamily: z.string().optional(),
  baseFontSize: z.number().positive().default(24)
});

export const StoryboardThemeSchema = z.object({
  name: z.string().default('edova-indigo'),
  colors: ColorPaletteSchema.partial().default({}),
  typography: TypographyConfigSchema.partial().default({}),
  borderRadius: z.number().nonnegative().default(16),
  gradientBackground: z.string().optional()
});

export type StoryboardTheme = z.infer<typeof StoryboardThemeSchema>;
