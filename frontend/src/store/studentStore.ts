import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export interface StudyTask {
  id: string
  title: string
  subject: string
  due_label: string
  status: 'overdue' | 'due_today' | 'due_soon'
}

export interface RecTask {
  id: string
  title: string
  meta: string
  xp: string
  chapter?: string
}

export interface StudyPlanData {
  xp: number
  streak_days: number
  urgent_tasks: StudyTask[]
  recommended_tasks: RecTask[]
}

export interface StudentAssignmentItem {
  id: string
  title: string
  description: string
  subject: string
  section_name: string
  type: string
  total_points: number
  due_date: string | null
  submission_status: 'not_started' | 'submitted' | 'graded' | string
  score: number | null
  feedback: string
  submitted_at: string | null
  sections?: any[]
}

export interface MistakeItem {
  id: string
  chapter: string
  topic: string
  question: string
  your_answer: string
  correct_answer: string
  solution: string
  status: 'needs_practice' | 'mastered'
  date: string
}

export interface HeatmapChapter {
  name: string
  level: number // 0 = needs work, 1 = average, 2 = strong
  label: string
}

export interface SubjectHeatmap {
  subject: string
  chapters: HeatmapChapter[]
}

export interface WikiNoteItem {
  id: string
  chapter: string
  topic: string
  type: 'quote' | 'formula' | 'note' | string
  content: string
  created_at: string
}

interface StudentState {
  studyPlan: StudyPlanData | null
  assignments: StudentAssignmentItem[]
  mistakes: MistakeItem[]
  heatmap: SubjectHeatmap[]
  wikiNotes: WikiNoteItem[]
  activeQuizAssignment: StudentAssignmentItem | null
  loading: boolean
  error: string | null

  fetchStudyPlan: () => Promise<void>
  fetchAssignments: (subject?: string, status?: string) => Promise<void>
  submitAssignment: (id: string, payload: { submission_type: string; answers?: any[]; content?: string }) => Promise<any>
  fetchMistakes: () => Promise<void>
  resolveMistake: (id: string) => Promise<void>
  fetchHeatmap: () => Promise<void>
  fetchWiki: () => Promise<void>
  addWikiNote: (chapter: string, topic: string, type: string, content: string) => Promise<void>
  setActiveQuizAssignment: (assignment: StudentAssignmentItem | null) => void
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('edova_auth_token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const useStudentStore = create<StudentState>((set, get) => ({
  studyPlan: null,
  assignments: [],
  mistakes: [],
  heatmap: [],
  wikiNotes: [],
  activeQuizAssignment: null,
  loading: false,
  error: null,

  fetchStudyPlan: async () => {
    try {
      const res = await fetch(`${BASE}/api/student/study-plan`, { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        set({ studyPlan: data })
      }
    } catch (err: any) {
      console.error('Error fetching study plan', err)
    }
  },

  fetchAssignments: async (subject, status) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (subject && subject !== 'all') params.append('subject', subject)
      if (status && status !== 'all') params.append('status', status)

      const res = await fetch(`${BASE}/api/student/assignments?${params.toString()}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      set({ assignments: data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  submitAssignment: async (id, payload) => {
    try {
      const res = await fetch(`${BASE}/api/student/assignments/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Submission failed`)
      const result = await res.json()
      await get().fetchAssignments()
      await get().fetchStudyPlan()
      await get().fetchMistakes()
      return result
    } catch (err: any) {
      console.error('Error submitting assignment', err)
      throw err
    }
  },

  fetchMistakes: async () => {
    try {
      const res = await fetch(`${BASE}/api/student/mistakes`, { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        set({ mistakes: data })
      }
    } catch (err) {
      console.error('Error fetching mistakes', err)
    }
  },

  resolveMistake: async (id) => {
    try {
      const res = await fetch(`${BASE}/api/student/mistakes/${id}/resolve`, {
        method: 'POST',
        headers: getAuthHeader(),
      })
      if (res.ok) {
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, status: 'mastered' } : m
          ),
        }))
        await get().fetchStudyPlan()
      }
    } catch (err) {
      console.error('Error resolving mistake', err)
    }
  },

  fetchHeatmap: async () => {
    try {
      const res = await fetch(`${BASE}/api/student/heatmap`, { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        set({ heatmap: data })
      }
    } catch (err) {
      console.error('Error fetching heatmap', err)
    }
  },

  fetchWiki: async () => {
    try {
      const res = await fetch(`${BASE}/api/student/wiki`, { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        set({ wikiNotes: data })
      }
    } catch (err) {
      console.error('Error fetching wiki notes', err)
    }
  },

  addWikiNote: async (chapter, topic, type, content) => {
    try {
      const res = await fetch(`${BASE}/api/student/wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          chapter_name: chapter,
          topic_name: topic,
          note_type: type,
          content,
        }),
      })
      if (res.ok) {
        await get().fetchWiki()
      }
    } catch (err) {
      console.error('Error adding wiki note', err)
    }
  },

  setActiveQuizAssignment: (assignment) => set({ activeQuizAssignment: assignment }),
}))
