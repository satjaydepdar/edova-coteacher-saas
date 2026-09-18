import { getToken } from '../api'
import type {
  SubjectApi,
  TrigConceptSummary,
  TrigStudentState,
  TrigProfile,
  GenericSessionInitResponse,
  GenericSessionStepResponse,
} from '../trig/trigApiClient'

/** Client for /api/coordgeo/* (backend/coordinate_geometry/). Response shapes
 * match Trigonometry's exactly (same reasoning engine underneath now that
 * coordinate_geometry_solver.py exists), so this implements the same
 * SubjectApi interface CoteacherWorkspace already expects -- no separate
 * Coordinate-Geometry-flavored workspace component needed. */

export class CoordGeoApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'CoordGeoApiError'
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
    throw new CoordGeoApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export const coordgeoApi: SubjectApi = {
  concepts: () => call<TrigConceptSummary[]>('/api/coordgeo/concepts'),

  state: (conceptId: string, opts: { fresh?: boolean; generateNew?: boolean } = {}) => {
    const params = new URLSearchParams()
    if (opts.fresh) params.set('fresh', 'true')
    if (opts.generateNew) params.set('generate_new', 'true')
    const qs = params.toString()
    return call<TrigStudentState>(`/api/coordgeo/student/state/${conceptId}${qs ? `?${qs}` : ''}`)
  },

  reset: (conceptId: string) =>
    call<{ message: string }>('/api/coordgeo/student/reset', {
      method: 'POST',
      body: JSON.stringify({ concept_id: conceptId }),
    }),

  profile: () => call<TrigProfile>('/api/coordgeo/analytics/profile'),

  initSession: (problemText: string, initialSal = 1.0) =>
    call<GenericSessionInitResponse>('/api/coordgeo/session/init', {
      method: 'POST',
      body: JSON.stringify({ problem_text: problemText, initial_sal: initialSal }),
    }),

  submitStep: (sessionId: string, stepIndex: number, userAnswer: string, responseTime = 15.0) =>
    call<GenericSessionStepResponse>('/api/coordgeo/session/step', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        step_index: stepIndex,
        user_answer: userAnswer,
        response_time: responseTime,
      }),
    }),

  getSession: (sessionId: string) => call<GenericSessionInitResponse>(`/api/coordgeo/session/${sessionId}`),
}
