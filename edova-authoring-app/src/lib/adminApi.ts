/** Admin CMS API client — same shape as frontend/src/lib/adminApi.ts (USER JWT
 *  via /auth/login, role=ADMIN). Dev: relative paths hit the Vite proxy (:5174 → :8000). */

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
export const ADMIN_TOKEN_KEY = 'edova_admin_token'

export class AdminApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`)
    this.status = status
    this.detail = detail
  }
}

const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const urlToken = searchParams?.get('token')
if (urlToken && typeof window !== 'undefined') {
  localStorage.setItem(ADMIN_TOKEN_KEY, urlToken)
  window.history.replaceState({}, document.title, window.location.pathname)
}

let token: string | null = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null

export function getAdminToken(): string | null {
  return token
}

export function setAdminToken(t: string | null) {
  token = t
  if (t === null) localStorage.removeItem(ADMIN_TOKEN_KEY)
  else localStorage.setItem(ADMIN_TOKEN_KEY, t)
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
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
    throw new AdminApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

// --- types (mirror backend responses) ---
export interface AdminSession {
  user_id: string
  email: string
  full_name: string
  tenant_id: string
  tenant_name: string
  is_platform: boolean
}

export interface AdminSubject {
  id: string
  name: string
  standard_grade: string
  sequence_order: number
  tenant_id: string | null
  tenant_name: string | null
  scope: 'global' | 'tenant'
  read_only: boolean
  chapter_count: number
}

export interface AdminTopic {
  id: string
  name: string
  sequence_order: number
}

export interface AdminChapter {
  id: string
  name: string
  sequence_order: number
  topics?: AdminTopic[]
}

export interface AdminTree {
  subject: { id: string; name: string; standard_grade: string; scope: string; read_only: boolean }
  chapters: AdminChapter[]
}

export interface QuestionOption {
  key: string
  text: string
  correct: boolean
}

export interface AuthoredQuestion {
  question_id: string
  status: string
  version_id: string
  version_no: number
  question_type: string
  question_text: string
  marks: number
  difficulty: string | null
  options: QuestionOption[]
  passage: string | null
  explanation: string | null
  topic_id: string | null
  topic_name: string | null
  source_papers: string[]
}

export interface QuestionMedia {
  media_id: string
  file_name: string
  mime_type: string
  file_size: number
  caption: string | null
  sequence_order: number
  url: string
}

export const adminAuth = {
  login: (email: string, password: string) =>
    call<{ access_token: string }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  session: () => call<AdminSession>(`/admin/session`),
}

export interface AdminSection {
  id: string
  name: string
  grade: string | null
}

export const adminContent = {
  subjects: () => call<{ subjects: AdminSubject[] }>(`/admin/subjects`),
  tree: (subjectId: string) => call<AdminTree>(`/admin/subjects/${subjectId}/tree`),
  sections: (chapterId: string) => call<{ sections: AdminSection[] }>(`/admin/chapters/${chapterId}/sections`),
}

export interface PublishedTestSummary {
  test_id: string
  title: string
  timer_minutes: number
  total_marks: number
  question_count: number
  created_at: string
}

export interface TestAssignmentBody {
  section_id: string | null
  opens_at: string
  closes_at: string
}

export const adminTests = {
  publish: (b: {
    chapter_id: string; title: string; timer_minutes: number
    questions: { version_id: string; marks: number }[]
    assignments?: TestAssignmentBody[]
  }) =>
    call<{ test_id: string; total_marks: number; question_count: number }>(`/admin/tests`, {
      method: 'POST',
      body: JSON.stringify(b),
    }),
  list: (chapterId: string) => call<{ tests: PublishedTestSummary[] }>(`/admin/tests?chapter_id=${chapterId}`),
}

export interface QuestionWriteBody {
  question_type: string
  question_text: string
  marks?: number
  difficulty?: string | null
  options?: QuestionOption[]
  passage?: string | null
  explanation?: string | null
  topic_id?: string | null
  source_papers?: string[]
  save_as_draft?: boolean
}

export const adminQuestions = {
  list: (chapterId: string) => call<{ questions: AuthoredQuestion[] }>(`/admin/questions?chapter_id=${chapterId}`),
  create: (b: QuestionWriteBody & { chapter_id: string }) =>
    call<{ question_id: string; version_id: string; version_no: number; status: string }>(`/admin/questions`, {
      method: 'POST',
      body: JSON.stringify(b),
    }),
  edit: (questionId: string, b: Partial<QuestionWriteBody>) =>
    call<{ question_id: string; version_id: string; version_no: number }>(`/admin/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(b),
    }),
  delete: (questionId: string) =>
    call<{ question_id: string; status: string }>(`/admin/questions/${questionId}`, { method: 'DELETE' }),
  media: (questionId: string) => call<{ media: QuestionMedia[] }>(`/admin/questions/${questionId}/media`),
  uploadMedia: (questionId: string, file: File, caption?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (caption) form.append('caption', caption)
    return call<{ media_id: string; storage_key: string; url: string }>(`/admin/questions/${questionId}/media`, {
      method: 'POST',
      body: form,
    })
  },
}
