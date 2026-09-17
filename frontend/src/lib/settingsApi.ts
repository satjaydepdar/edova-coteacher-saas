/** Typed API client for Settings module. */
import { getToken } from './api'
import { AUTH_TOKEN_KEY } from '../store/authStore'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | string
  tenant_id: string | null
  tenant_name: string
  section?: {
    id: string
    name: string
    grade: string
  } | null
}

export interface UserPreferences {
  default_test_timer_minutes: number
  mastery_alert_threshold: number
  socratic_sal_level: number
  formula_editor_mode: 'mathlive' | 'latex'
  sound_effects_enabled: boolean
}

export interface TenantSettings {
  cbse_affiliation_code: string
  academic_year: string
}

export interface SectionSummary {
  id: string
  name: string
  grade: string
  student_count: number
}

export interface LlmSettings {
  llm_tier: 'NONE' | 'STANDARD' | 'PRO' | 'ENTERPRISE' | string
  enable_student_chatbot: boolean
  enable_teacher_lesson_planner: boolean
  default_socratic_sal: number
  monthly_token_budget_k: number
}

export interface SettingsData {
  user: UserProfile
  preferences: UserPreferences
  tenant_settings: TenantSettings
  llm_settings: LlmSettings
  sections: SectionSummary[]
}

export interface SchoolSettingsDetail {
  tenant_id: string
  tenant_name: string
  cbse_affiliation_code: string
  academic_year: string
  teacher_count: number
  student_count: number
  llm_settings: LlmSettings
  sections: SectionSummary[]
}

function getEffectiveToken(): string | null {
  return getToken() || localStorage.getItem(AUTH_TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getEffectiveToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let errorDetail = res.statusText
    try {
      const errJson = await res.json()
      if (errJson?.detail) errorDetail = errJson.detail
    } catch {
      // non-json response
    }
    throw new Error(errorDetail)
  }

  return res.json() as Promise<T>
}

export const settingsApi = {
  getSettings: () => request<SettingsData>('/api/settings/me'),

  updateProfile: (body: { full_name?: string; current_password?: string; new_password?: string }) =>
    request<{ status: string; message: string; full_name: string; email: string }>('/api/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updatePreferences: (body: Partial<UserPreferences>) =>
    request<{ status: string; preferences: UserPreferences }>('/api/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getSchoolSettings: () => request<SchoolSettingsDetail>('/api/settings/school'),

  updateSchoolSettings: (body: { cbse_affiliation_code?: string; academic_year?: string }) =>
    request<{ status: string; cbse_affiliation_code: string; academic_year: string }>('/api/settings/school', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updateLlmSettings: (body: Partial<LlmSettings>) =>
    request<{ status: string; llm_settings: LlmSettings }>('/api/settings/llm', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}
