/** Teacher Analytics Dashboard API client — separate from lib/api.ts on purpose,
 *  same reason adminApi.ts is separate: this authenticates with a real user JWT
 *  (/auth/login, role=TEACHER), while the main learning app uses a shared device
 *  token with no per-teacher identity. Web-only: localStorage, no Capacitor. */

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
export const TEACHER_TOKEN_KEY = 'edova_teacher_token'

export class TeacherApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`)
    this.status = status
    this.detail = detail
  }
}

let token: string | null = localStorage.getItem(TEACHER_TOKEN_KEY)

export function setTeacherToken(t: string | null) {
  token = t
  if (t === null) localStorage.removeItem(TEACHER_TOKEN_KEY)
  else localStorage.setItem(TEACHER_TOKEN_KEY, t)
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
    throw new TeacherApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export interface Section {
  id: string
  name: string
  grade: string | null
}

export interface OverviewSection {
  id: string
  name: string
  grade: string | null
  mastery_pct: number
  active_students: number
  roster_size: number
}

export interface OverviewChapter {
  chapter_id: string
  chapter_title: string
  subject_name: string
  mastery_pct: number
}

export interface SectionRollup {
  section: OverviewSection | null
  chapters: OverviewChapter[]
}

export interface DashboardOverview {
  overall_mastery_pct: number
  active_students: number
  concepts_flagged: number
  students_needing_intervention: number
  sections: OverviewSection[]
  chapters: OverviewChapter[]
}

export interface ConceptHeatmapNode {
  concept_id: string
  concept_name: string
  total_students_engaged: number
  mastered_count: number
  struggling_count: number
  mastery_percentage: number
  status: 'mastered' | 'in-progress' | 'struggling-hotspot'
  top_misconception: string | null
  remedial_recommendation: string | null
}

export interface BottleneckAlert {
  concept_id: string
  concept_name: string
  struggling_percentage: number
  affected_students_count: number
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  teacher_action_hint: string
}

export interface StudentInterventionCard {
  student_id: string
  student_name: string
  stuck_concept_id: string
  stuck_concept_name: string
  attempts_count: number
  last_error_type: string | null
  suggested_teacher_prompt: string
}

export interface ClassroomHeatmap {
  classroom_id: string
  classroom_name: string
  chapter_id: string
  chapter_title: string
  total_active_students: number
  overall_chapter_mastery: number
  concept_heatmaps: ConceptHeatmapNode[]
  bottleneck_alerts: BottleneckAlert[]
  intervention_queue: StudentInterventionCard[]
  section_roster_size: number | null
}

export interface StudentTopic {
  chapter_id: string
  chapter_title: string
  concept_id: string
  concept_name: string
  status: 'mastered' | 'struggling' | 'attempted'
  attempts_count: number
  last_error_detail: string | null
}

export interface StudentSubjectChapter {
  chapter_id: string
  chapter_title: string
  mastery_pct: number
}

export interface StudentSubject {
  subject_name: string
  mastery_pct: number
  chapters: StudentSubjectChapter[]
}

export interface StudentEngagement {
  time_spent_seconds_week: number
  modules_touched_week: number
  quiz_attempts_week: number
  last_active: string | null
}

export interface SuggestedNextStep {
  concept_id: string
  concept_name: string
  chapter_title: string
  attempts_count: number
  action: string
}

export interface StudentProfile {
  student_id: string
  mastery_pct: number
  concepts_stuck: number
  topics: StudentTopic[]
  subjects: StudentSubject[]
  engagement: StudentEngagement
  misconception_pattern: string | null
  suggested_next_steps: SuggestedNextStep[]
  strengths: StudentTopic[]
  struggling: StudentTopic[]
}

export const teacherApi = {
  login: (email: string, password: string) =>
    call<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  sections: () => call<Section[]>('/api/teacher/sections'),
  overview: () => call<DashboardOverview>('/api/teacher/analytics/overview'),
  sectionRollup: (sectionId: string) => call<SectionRollup>(`/api/teacher/analytics/section/${sectionId}`),
  classroomHeatmap: (sectionId: string, chapterId: string) =>
    call<ClassroomHeatmap>(`/api/teacher/classroom/${sectionId}/heatmap/${chapterId}`),
  studentProfile: (studentId: string) => call<StudentProfile>(`/api/teacher/analytics/student/${studentId}`),
}
