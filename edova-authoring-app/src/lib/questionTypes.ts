/** Mockup labels <-> backend QUESTION_TYPES enum (main.py). Case Study reuses the
 *  same question_text + options form as every other type — no dedicated UI section. */
export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ',
  MCQ_COMBINATION: 'MCQ (Combination)',
  ASSERTION_REASONING: 'Assertion & Reasoning',
  SHORT_ANSWER: 'Short Answers',
  LONG_ANSWER: 'Long Answers',
  CASE_STUDY: 'Case Study',
}

export const QUESTION_TYPE_ENUMS = Object.keys(QUESTION_TYPE_LABELS)
