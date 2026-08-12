/** Typed API client.
 *  Dev: empty base → relative paths hit the Vite proxy (:5173 → :8000).
 *  Packaged app: VITE_API_BASE_URL at build time, e.g. https://api.example.com
 *
 *  Auth model (requirement §2/§8): the app activates ONCE with a school activation
 *  key and stores a device token + stable install UUID. No user logins in the MVP. */
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`)
    this.status = status
    this.detail = detail
  }
}

export interface Features {
  allow_video: boolean
  allow_lab: boolean
  allow_quiz: boolean
}

export interface ActivationSession {
  tenant: { name: string; type: string }
  features: Features
  expires_at: string
}

export interface ActivateResponse extends ActivationSession {
  access_token: string
  token_type: string
}

export interface Subject {
  id: string
  name: string
  standard_grade: string
  thumbnail_url: string | null
  sequence_order: number
}

export type ModuleType = 'VIDEO' | 'LAB' | 'QUIZ'

export interface Module {
  module_id: string
  title: string
  type: ModuleType
  sequence_order: number
  thumbnail_url: string | null
  locked: boolean
}

export interface Topic {
  topic_id: string | null // null = ungrouped ("General") bucket
  topic_name: string | null
  sequence_order: number | null
  modules: Module[]
}

export interface Chapter {
  chapter_id: string
  chapter_name: string
  sequence_order: number
  topics: Topic[]
}

export interface Tree {
  subject_id: string
  subject_name: string
  chapters: Chapter[]
}

export interface LabPayload {
  module_id: string
  environment_type: string
  instructions_markdown: string
  initial_state_code: string | null
  validation_rules: unknown
}

export interface LabSimulation {
  module_id: string
  environment_type: string
  simulation_url: string
  expires_in: number
}

export interface QuizQuestion {
  qid: string
  question_text: string
  options: string[]
  year: number
  difficulty: string
  content_hash: string
}

export interface GeneratedQuiz {
  generation_id: string
  module_id: string
  questions: QuizQuestion[]
  metadata: { total_requested: number; total_delivered: number; shortfall: boolean }
}

export interface ModuleProgress {
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_pct: number
  time_spent: number
  completed: boolean
  time_counted?: boolean
}

// --- secure storage: Capacitor Preferences on device, localStorage in web dev ---
const TOKEN_KEY = 'edova_device_token'
const DEVICE_KEY = 'edova_device_id'
const native = Capacitor.isNativePlatform()

let token: string | null = null
let deviceId: string | null = null

async function storageGet(key: string): Promise<string | null> {
  if (native) return (await Preferences.get({ key })).value
  return localStorage.getItem(key)
}

async function storageSet(key: string, value: string | null): Promise<void> {
  if (native) {
    if (value === null) await Preferences.remove({ key })
    else await Preferences.set({ key, value })
  } else {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  }
}

/** Must be awaited once before rendering (loads token + device id into memory). */
export async function initStorage(): Promise<boolean> {
  token = await storageGet(TOKEN_KEY)
  deviceId = await storageGet(DEVICE_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    await storageSet(DEVICE_KEY, deviceId)
  }
  return token !== null
}

export function getDeviceId(): string {
  if (!deviceId) throw new Error('initStorage() must run before getDeviceId()')
  return deviceId
}

export function setToken(t: string | null) {
  token = t
  void storageSet(TOKEN_KEY, t)
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let detail: unknown = res.statusText
    try {
      detail = (await res.json()).detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  activate: (keyCode: string, devId: string) =>
    call<ActivateResponse>(`${BASE}/api/activation/activate`, {
      method: 'POST',
      body: JSON.stringify({ key_code: keyCode, device_id: devId }),
    }),
  activationSession: () => call<ActivationSession>(`${BASE}/api/activation/session`),
  appSubjects: () => call<{ subjects: Subject[]; features: Features }>(`${BASE}/api/app/subjects`),
  tree: (subjectId: string) => call<Tree>(`${BASE}/api/student/content/subjects/${subjectId}/tree`),
  labPayload: (moduleId: string) => call<LabPayload>(`${BASE}/student/modules/${moduleId}/lab`),
  labSimulation: (moduleId: string) => call<LabSimulation>(`${BASE}/api/student/lab/${moduleId}/simulation`),
  quizGenerate: (moduleId: string) =>
    call<GeneratedQuiz>(`${BASE}/api/v1/engine/quiz/generate`, {
      method: 'POST',
      body: JSON.stringify({ module_id: moduleId }),
    }),
  moduleProgress: (moduleId: string) =>
    call<ModuleProgress>(`${BASE}/api/student/progress/${moduleId}`),
  /** Heartbeat: pct = position/duration*100; delta = seconds since previous beat;
   *  eventId is a fresh UUID per beat (retries MUST reuse it — server dedupes). */
  postProgress: (moduleId: string, pct: number, deltaSeconds: number, eventId: string) =>
    call<ModuleProgress>(`${BASE}/api/student/progress`, {
      method: 'POST',
      body: JSON.stringify({
        module_id: moduleId,
        progress_pct: pct,
        time_spent_delta: deltaSeconds,
        client_event_id: eventId,
      }),
    }),
  /** Raw m3u8 text; handed to hls.js as a blob URL so auth header is not needed per segment. */
  videoManifest: async (moduleId: string): Promise<string> => {
    const res = await fetch(`${BASE}/api/student/video/${moduleId}/manifest`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      let detail: unknown = res.statusText
      try {
        detail = (await res.json()).detail
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail)
    }
    return res.text()
  },
}
