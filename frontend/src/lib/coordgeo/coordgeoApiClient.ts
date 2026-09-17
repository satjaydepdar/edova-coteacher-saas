import { getToken } from '../api'

/** Client for /api/coordgeo/* (backend/coordinate_geometry/). Mirrors trigApiClient's
 * shape. Unlike trig, there's no reasoner-backed interactive session here yet --
 * state() returns a curated problem + hints + worked solution instead of a live
 * derivation session (see backend/coordinate_geometry/routers/student.py). */

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

export interface CoordGeoConceptSummary {
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
}

export interface CoordGeoStudentState {
  concept_id: string
  concept_title: string
  difficulty: number
  formula_reference: string | null
  mastery_score: number
  questions_solved: number
  solving_available: boolean
  solving_unavailable_reason: string | null
  problem_title: string | null
  problem_text: string | null
  hints: Record<string, string>
  worked_solution: string[]
  expected_answer: string | null
}

export interface CoordGeoProfile {
  student_id: string
  mastered_concepts: number
  in_progress_concepts: number
  total_concepts: number
  average_mastery: number
}

export const coordgeoApi = {
  concepts: () => call<CoordGeoConceptSummary[]>('/api/coordgeo/concepts'),

  state: (conceptId: string, opts: { generateNew?: boolean } = {}) => {
    const qs = opts.generateNew ? '?generate_new=true' : ''
    return call<CoordGeoStudentState>(`/api/coordgeo/student/state/${conceptId}${qs}`)
  },

  reset: (conceptId: string) =>
    call<{ message: string }>('/api/coordgeo/student/reset', {
      method: 'POST',
      body: JSON.stringify({ concept_id: conceptId }),
    }),

  profile: () => call<CoordGeoProfile>('/api/coordgeo/analytics/profile'),
}
