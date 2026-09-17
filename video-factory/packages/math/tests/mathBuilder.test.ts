import { describe, it, expect } from 'vitest';
import { MathStoryboardBuilder } from '../src/builder/MathStoryboardBuilder';

describe('MathStoryboardBuilder', () => {
  it('should successfully build a valid minimal math storyboard', () => {
    const builder = new MathStoryboardBuilder('test-storyboard-1', 'Basic Linear Equations');

    builder
      .addConceptIntro({
        id: 'intro',
        conceptName: 'Linear Equations',
        questionPrompt: 'Find x when 2x + 1 = 5',
        timing: { durationInSeconds: 5 }
      })
      .addAnswer({
        id: 'answer',
        answerLabel: 'SOLUTION',
        answerText: 'x = 2',
        answerLatex: 'x = 2',
        timing: { durationInSeconds: 5 }
      });

    const storyboard = builder.build();

    expect(storyboard.metadata.id).toBe('test-storyboard-1');
    expect(storyboard.scenes).toHaveLength(2);
    expect(storyboard.scenes[0].type).toBe('math.concept_intro');
    expect(storyboard.scenes[1].type).toBe('core.answer');
  });

  it('should throw validation error if required fields are missing', () => {
    const builder = new MathStoryboardBuilder('', '');

    expect(() => {
      builder.build();
    }).toThrow();
  });
});
