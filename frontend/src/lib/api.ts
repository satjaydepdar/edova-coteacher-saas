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

export interface PracticeOption {
  key: string
  text: string
}

export interface StudentTest {
  test_id: string
  title: string
  timer_minutes: number
  total_marks: number
  question_count: number
  chapter_name: string
  subject_name: string
  opens_at: string
  closes_at: string
  status: 'OPEN' | 'UPCOMING' | 'CLOSED'
}

export interface StudentTestQuestion {
  question_type: string
  question_text: string
  options: PracticeOption[]
  marks: number
  passage: string | null
}

export interface StudentTestDetail {
  test_id: string
  title: string
  timer_minutes: number
  total_marks: number
  questions: StudentTestQuestion[]
}

export interface ModuleProgress {
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_pct: number
  time_spent: number
  completed: boolean
  time_counted?: boolean
}

export interface SocraticChatRequest {
  message: string
  simulation_id: string
  current_step?: number
  current_slider_val?: number
  chat_history?: Array<{ who: string; text: string }>
  chapter_id?: string
  concept_id?: string
  mastered_concept_ids?: string[]
}

export interface SocraticChatResponse {
  reply: string
  pitfall_detected?: string | null
  suggested_action?: string | null
  llm_model?: string
  concept_id?: string | null
  is_ready?: boolean | null
}

export interface MathSolveRequest {
  a: number
  b: number
  c: number
  target_area?: number
}

export interface MathStepResponse {
  step_number: number
  title: string
  formula?: string
  explanation: string
}

export interface MathSolveResponse {
  a: number
  b: number
  c: number
  discriminant: number
  factored_form: string
  roots: number[]
  valid_root: number
  steps: MathStepResponse[]
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

/** For other API clients (e.g. trigApiClient) that need the same auth token. */
export function getToken(): string | null {
  return token
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
  /** Tests a teacher has assigned -- tenant-wide or to the caller's own section
   *  (device-token sessions have no section identity, so they only ever see the
   *  tenant-wide ones). Status is precomputed server-side from the window. */
  studentTests: () => call<{ tests: StudentTest[] }>(`${BASE}/api/student/tests`),
  /** Full content for one test, correct answers withheld -- 403 if its window
   *  hasn't opened yet, 404 if it isn't assigned to the caller at all. */
  studentTestDetail: (testId: string) => call<StudentTestDetail>(`${BASE}/api/student/tests/${testId}`),
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
  /** Socratic AI Co-Teacher dialogue */
  socraticChat: (payload: SocraticChatRequest) =>
    call<SocraticChatResponse>(`${BASE}/api/socratic/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Symbolic quadratic and math derivation solver */
  socraticSolve: (payload: MathSolveRequest) =>
    call<MathSolveResponse>(`${BASE}/api/socratic/solve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Knowledge Graph: List all compiled chapters */
  kgChapters: () => call<any[]>(`${BASE}/api/kg/chapters`),
  /** Knowledge Graph: Get specific chapter graph */
  kgChapter: (chapterId: string) => call<any>(`${BASE}/api/kg/chapter/${chapterId}`),
  /** Knowledge Graph: Check student prerequisite readiness */
  kgCheckPrerequisites: (payload: { chapter_id: string; target_concept_id: string; mastered_concept_ids: string[] }) =>
    call<any>(`${BASE}/api/kg/check-prerequisites`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Knowledge Graph: Recompile all markdown files */
  kgRecompile: () =>
    call<{ status: string; loaded_chapters: string[]; total_chapters: number }>(`${BASE}/api/kg/recompile`, {
      method: 'POST',
    }),
  /** Teacher Analytics: Get classroom chapter heatmap */
  classroomHeatmap: (classroomId: string, chapterId: string) =>
    call<any>(`${BASE}/api/teacher/classroom/${classroomId}/heatmap/${chapterId}`),
  /** Teacher Analytics: Record student concept mastery or struggle */
  recordMastery: (payload: {
    classroom_id: string
    student_id: string
    student_name?: string
    chapter_id: string
    concept_id: string
    event_type: 'mastery' | 'struggle' | 'attempt'
    error_detail?: string
  }) =>
    call<{ status: string; student_id: string; concept_id: string }>(`${BASE}/api/teacher/telemetry/record-mastery`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Teacher Analytics: Dashboard summary */
  teacherDashboardSummary: () => call<any>(`${BASE}/api/teacher/dashboard/summary`),
}

