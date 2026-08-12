/** Admin CMS API client — separate from lib/api.ts on purpose:
 *  the CMS authenticates with USER JWTs (/auth/login, role=ADMIN), while the
 *  learning app uses device tokens. Web-only: localStorage, no Capacitor.
 *  Dev: relative paths hit the Vite proxy (:5173 → :8000). */

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

let token: string | null = localStorage.getItem(ADMIN_TOKEN_KEY)

export function setAdminToken(t: string | null) {
  token = t
  if (t === null) localStorage.removeItem(ADMIN_TOKEN_KEY)
  else localStorage.setItem(ADMIN_TOKEN_KEY, t)
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export interface AdminModule {
  id: string
  title: string
  module_type: 'VIDEO' | 'LAB' | 'QUIZ'
  sequence_order: number
  is_published: boolean
  topic_id: string | null
  content_ready: boolean
}

export interface AdminTopic {
  id: string
  name: string
  sequence_order: number
  modules: AdminModule[]
}

export interface AdminChapter {
  id: string
  name: string
  sequence_order: number
  topics: AdminTopic[]
  modules: AdminModule[] // ungrouped bucket (topic_id NULL)
}

export interface AdminTree {
  subject: { id: string; name: string; standard_grade: string; scope: string; read_only: boolean }
  chapters: AdminChapter[]
}

export interface AdminTenant {
  id: string
  name: string
  status: string
  created_at: string
  active_plan: string | null
  subscription_ends: string | null
  seat_count: number | null
  active_keys: number
  user_count: number
}

export interface AdminPlan {
  id: string
  name: string
  tier_level: number
  allow_video: boolean
  allow_lab: boolean
  allow_quiz: boolean
}

export interface AdminKey {
  id: string
  key_code: string
  max_devices: number
  status: string
  expires_at: string
  activated_at: string | null
  created_at: string
  devices_used: number
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  tenant_name: string
  created_at: string
}

// --- auth ---
export const adminAuth = {
  login: (email: string, password: string) =>
    call<{ access_token: string }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  session: () => call<AdminSession>(`/admin/session`),
}

// --- content ---
export const adminContent = {
  subjects: () => call<{ subjects: AdminSubject[] }>(`/admin/subjects`),
  tree: (subjectId: string) => call<AdminTree>(`/admin/subjects/${subjectId}/tree`),
  createSubject: (b: { name: string; standard_grade: string; sequence_order: number; tenant_id?: string | null }) =>
    call<{ id: string }>(`/admin/subjects`, { method: 'POST', body: JSON.stringify(b) }),
  patchSubject: (id: string, b: Partial<{ name: string; standard_grade: string; sequence_order: number }>) =>
    call(`/admin/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  createChapter: (subjectId: string, b: { name: string; sequence_order: number }) =>
    call<{ id: string }>(`/admin/subjects/${subjectId}/chapters`, { method: 'POST', body: JSON.stringify(b) }),
  patchChapter: (id: string, b: Partial<{ name: string; sequence_order: number }>) =>
    call(`/admin/chapters/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  createTopic: (chapterId: string, b: { name: string; sequence_order: number }) =>
    call<{ id: string }>(`/admin/chapters/${chapterId}/topics`, { method: 'POST', body: JSON.stringify(b) }),
  patchTopic: (id: string, b: Partial<{ name: string; sequence_order: number }>) =>
    call(`/admin/topics/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteTopic: (id: string) => call(`/admin/topics/${id}`, { method: 'DELETE' }),
  createModule: (chapterId: string, b: { title: string; module_type: string; sequence_order: number; topic_id?: string | null }) =>
    call<{ id: string }>(`/admin/chapters/${chapterId}/modules`, { method: 'POST', body: JSON.stringify(b) }),
  patchModule: (id: string, b: Partial<{ title: string; sequence_order: number; is_published: boolean; topic_id: string | null }>) =>
    call(`/admin/modules/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  videoStatus: (moduleId: string) =>
    call<{ module_id: string; status: 'EMPTY' | 'PROCESSING' | 'READY' | 'FAILED'; error: string | null; duration_seconds: number | null; s3_key_prefix: string | null }>(
      `/admin/modules/${moduleId}/video-status`),
}

/** Video upload with real progress events — XHR, not fetch (fetch has no upload progress).
 *  Resolves as soon as the server accepts the file (202); the ffmpeg transcode runs
 *  in a background worker — poll videoStatus() until READY/FAILED. */
export function uploadVideo(
  moduleId: string,
  file: File,
  onProgress: (pct: number) => void,
  onPhase: (phase: 'uploading' | 'transcoding') => void,
): Promise<{ accepted: boolean; module_id: string; status: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ accepted: boolean; module_id: string; status: string }>()
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${BASE}/admin/modules/${moduleId}/video-upload`)
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
  }
  xhr.upload.onload = () => onPhase('transcoding')
  xhr.onload = () => {
    try {
      const body = JSON.parse(xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300) resolve(body)
      else reject(new AdminApiError(xhr.status, body.detail))
    } catch {
      reject(new AdminApiError(xhr.status, xhr.statusText))
    }
  }
  xhr.onerror = () => reject(new AdminApiError(0, 'network error'))
  const form = new FormData()
  form.append('file', file)
  xhr.send(form)
  return promise
}

// --- schools / subscriptions / keys ---
export const adminSchools = {
  tenants: () => call<{ tenants: AdminTenant[] }>(`/admin/tenants`),
  createTenant: (name: string) =>
    call<{ id: string }>(`/admin/tenants`, { method: 'POST', body: JSON.stringify({ name }) }),
  plans: () => call<{ plans: AdminPlan[] }>(`/admin/subscription-plans`),
  createSubscription: (tenantId: string, b: { plan_id: string; start_date: string; end_date: string; seat_count: number }) =>
    call<{ id: string }>(`/admin/tenants/${tenantId}/subscriptions`, { method: 'POST', body: JSON.stringify(b) }),
  keys: (tenantId: string) => call<{ keys: AdminKey[] }>(`/admin/tenants/${tenantId}/activation-keys`),
  createKey: (tenantId: string, maxDevices: number) =>
    call<AdminKey>(`/admin/tenants/${tenantId}/activation-keys`, {
      method: 'POST',
      body: JSON.stringify({ max_devices: maxDevices }),
    }),
  revokeKey: (keyId: string) => call(`/admin/activation-keys/${keyId}/revoke`, { method: 'POST' }),
}

// --- users ---
export const adminUsers = {
  list: (tenantId?: string) =>
    call<{ users: AdminUser[] }>(`/admin/users${tenantId ? `?tenant_id=${tenantId}` : ''}`),
  create: (b: { email: string; password: string; full_name: string; tenant_id: string; role: string }) =>
    call<{ id: string }>(`/admin/users`, { method: 'POST', body: JSON.stringify(b) }),
  resetPassword: (userId: string, password: string) =>
    call(`/admin/users/${userId}/password`, { method: 'POST', body: JSON.stringify({ password }) }),
}

/** Reorder via 3 PATCH swap: unique(subject/chapter, sequence_order) forbids
 *  in-place swaps, so A parks at a temp slot while B takes A's slot. */
export async function swapSequence(
  patch: (id: string, b: { sequence_order: number }) => Promise<unknown>,
  a: { id: string; sequence_order: number },
  b: { id: string; sequence_order: number },
): Promise<void> {
  const temp = -1 - Math.floor(Math.random() * 1_000_000)
  await patch(a.id, { sequence_order: temp })
  await patch(b.id, { sequence_order: a.sequence_order })
  await patch(a.id, { sequence_order: b.sequence_order })
}
