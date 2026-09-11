// Thin HTTP client for the CoTeacher API (edova-pov/coteacher/http-server.ts,
// a separate Node service -- see PHASE-6C-MIGRATION-NOTES.md in edova-pilot-v4).
// Ported unchanged: no hint-escalation/response-policy logic lives here, it's
// entirely server-side. This is a local-dev-only integration for now (the
// service has no auth of its own) -- see the "minimal slice" scope note in
// this feature's port.

const BASE_URL = import.meta.env.VITE_COTEACHER_API_URL || 'http://localhost:4600'

export type CoTeacherResponseType = 'ENCOURAGE' | 'TARGETED_HINT' | 'CLARIFY' | 'COMPLETION' | 'SYSTEM_ERROR'

export interface CoTeacherCoach {
  responseType: CoTeacherResponseType
  message: string
  nextAction?: unknown
}

export interface CoTeacherStepResponse {
  sessionId: string
  stepId: string
  reasoning: unknown
  coach: CoTeacherCoach
}

export interface CoTeacherSession {
  sessionId: string
  status: string
}

export class CoTeacherApiError extends Error {
  type: 'NETWORK_ERROR' | 'HTTP_ERROR' | 'INVALID_API_RESPONSE'
  detail: unknown

  constructor(type: CoTeacherApiError['type'], message: string, detail?: unknown) {
    super(message)
    this.name = 'CoTeacherApiError'
    this.type = type
    this.detail = detail
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    })
  } catch (err) {
    throw new CoTeacherApiError('NETWORK_ERROR', 'The CoTeacher API could not be reached.', err)
  }

  let body: any
  try {
    body = await res.json()
  } catch (err) {
    throw new CoTeacherApiError('INVALID_API_RESPONSE', 'The CoTeacher API returned a non-JSON response.', err)
  }

  if (!res.ok) {
    throw new CoTeacherApiError(
      'HTTP_ERROR',
      body?.error?.message || 'The CoTeacher API returned an error.',
      { status: res.status, code: body?.error?.code },
    )
  }

  return body as T
}

export function createCoTeacherSession({
  subject,
  topic,
  problem,
  context,
}: {
  subject: string
  topic: string
  problem: string
  context?: unknown
}): Promise<CoTeacherSession> {
  return request('/coteacher/sessions', {
    method: 'POST',
    body: JSON.stringify(context ? { subject, topic, problem, context } : { subject, topic, problem }),
  })
}

export function submitCoTeacherStep(sessionId: string, input: string, requestId?: string): Promise<CoTeacherStepResponse> {
  const headers = requestId ? { 'Idempotency-Key': requestId } : undefined
  return request(`/coteacher/sessions/${encodeURIComponent(sessionId)}/steps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input }),
  })
}
