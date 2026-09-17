import { StoryboardSchema, type Storyboard } from './schemas/storyboard.schema';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validates any JSON object against the Storyboard specification
 */
export function validateStoryboard(input: unknown): ValidationResult<Storyboard> {
  const result = StoryboardSchema.safeParse(input);
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  const errors = result.error.errors.map(err => {
    const path = err.path.length > 0 ? `[${err.path.join('.')}] ` : '';
    return `${path}${err.message}`;
  });

  return {
    success: false,
    errors
  };
}

/**
 * Parses and validates raw JSON string into a validated Storyboard
 */
export function parseStoryboard(jsonString: string): Storyboard {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e: any) {
    throw new Error(`Invalid JSON syntax in storyboard: ${e.message}`);
  }

  const validation = validateStoryboard(parsed);
  if (!validation.success || !validation.data) {
    throw new Error(`Storyboard validation failed:\n  - ${validation.errors?.join('\n  - ')}`);
  }

  return validation.data;
}

/**
 * Type-assertion function for storyboards
 */
export function assertValidStoryboard(data: unknown): asserts data is Storyboard {
  const result = StoryboardSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Storyboard validation assertion failed: ${result.error.message}`);
  }
}
