import { getToken } from '../api'

/** Client for this app's own /api/trig/* backend (backend/trigonometry/).
 *  Reuses the same auth token as the rest of the app (see lib/api.ts) --
 *  student identity is derived server-side from that token, never sent
 *  explicitly, unlike edova-pilot-v4's original client which took a raw
 *  studentId. */

export class TrigApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TrigApiError'
    this.status = status
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* non-JSON error body */
    }
    throw new TrigApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export interface TrigStepData {
  step_index: number
  prompt: string
  expected_math: string
  expected_latex: string
  hints: { high: string; mid: string; low: string }
  quick_options: string[]
}

export interface TrigStepHistoryItem {
  step_index: number
  instruction: string
  result: string
  completed: boolean
}

export interface TrigMetrics {
  assistance_sal: number
  concept_mastery: number
  active_attempts: number
  accuracy_rate: number
}

export interface TrigRequiredItem {
  id: string
  quantity: string
}

export interface TrigStudentState {
  concept_id: string
  concept_title: string
  difficulty: number
  sal: number
  mastery_score: number
  active_step_index: number
  total_steps: number
  is_fully_solved: boolean
  consecutive_correct: number
  problem_context: string
  initial_state: string
  formula_reference: string | null
  working_equation: string
  current_step: TrigStepData | null
  scaffold: string
  scaffold_strategy: string
  quick_options: string[]
  steps_history: TrigStepHistoryItem[]
  metrics: TrigMetrics
  required_items: TrigRequiredItem[]
}

export interface TrigConceptSummary {
  id: string
  title: string
  chapter: string
  difficulty: number
  description: string | null
  formula_reference: string | null
  prerequisites: string[]
  is_unlocked: boolean
  is_completed: boolean
  mastery_score: number
  sal: number
}

export interface TrigProgressPoint {
  timestamp: string
  raw_score: number
  estimated_mastery: number
  assistance_level: number
  step_index: number
  response_time?: number
}

export interface TrigProfile {
  student_id: string
  mastered_concepts: number
  in_progress_concepts: number
  total_concepts: number
  average_sal: number
  average_mastery: number
  overall_accuracy: number
  total_attempts: number
  strengths: string[]
  struggles: string[]
}

export const trigApi = {
  concepts: () => call<TrigConceptSummary[]>('/api/trig/concepts'),

  state: (conceptId: string, opts: { fresh?: boolean; generateNew?: boolean } = {}) => {
    const params = new URLSearchParams()
    if (opts.fresh) params.set('fresh', 'true')
    if (opts.generateNew) params.set('generate_new', 'true')
    const qs = params.toString()
    return call<TrigStudentState>(`/api/trig/student/state/${conceptId}${qs ? `?${qs}` : ''}`)
  },

  reset: (conceptId: string) =>
    call<{ message: string }>('/api/trig/student/reset', {
      method: 'POST',
      body: JSON.stringify({ concept_id: conceptId }),
    }),

  progressTimeline: (conceptId: string) => call<TrigProgressPoint[]>(`/api/trig/analytics/progress/${conceptId}`),

  profile: () => call<TrigProfile>('/api/trig/analytics/profile'),

  // Dynamic Neuro-Symbolic Generic Reasoning Engine (port 8000 microservice)
  initSession: (problemText: string, initialSal = 1.0) =>
    call<GenericSessionInitResponse>('/api/trig/session/init', {
      method: 'POST',
      body: JSON.stringify({ problem_text: problemText, initial_sal: initialSal }),
    }),

  submitStep: (sessionId: string, stepIndex: number, userAnswer: string, responseTime = 15.0) =>
    call<GenericSessionStepResponse>('/api/trig/session/step', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        step_index: stepIndex,
        user_answer: userAnswer,
        response_time: responseTime,
      }),
    }),

  getSession: (sessionId: string) =>
    call<GenericSessionInitResponse>(`/api/trig/session/${sessionId}`),
}

export interface GenericSessionStepPayload {
  step_index: number
  prompt: string
  expected_latex: string
  hint: string
  hints: { high: string; mid: string; low: string }
  quick_options: string[]
}

export interface GenericSessionInitResponse {
  session_id: string
  problem_type: string
  context: string
  initial_state: string
  total_steps: number
  active_step_index: number
  active_step: GenericSessionStepPayload
  metrics: TrigMetrics
  steps_history: TrigStepHistoryItem[]
}

export interface GenericSessionStepResponse {
  session_id: string
  is_correct: boolean
  is_fully_solved: boolean
  active_step_index: number
  user_answer: string
  expected_answer: string
  working_equation: string
  socratic_scaffold: string
  quick_options: string[]
  steps_history: TrigStepHistoryItem[]
  metrics: TrigMetrics
  active_step?: GenericSessionStepPayload | null
  problem_type: string
  total_steps?: number
}
