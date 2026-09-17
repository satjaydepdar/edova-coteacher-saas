import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'edova_auth_token'

export interface QuestionOption {
  key: string
  text: string
  correct: boolean
}

export interface QuestionItem {
  id?: string
  text: string
  options?: QuestionOption[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  bloom: string
  rubric?: string
  marks: number
}

export interface AssessmentSection {
  section_id: string
  name: string
  type: 'mcq' | 'short_answer_1' | 'short_answer_2' | 'long_answer' | 'case_study'
  marks_per_q: number
  instructions: string
  questions: QuestionItem[]
}

export interface AssessmentSummaryItem {
  id: string
  tenant_id?: string
  created_by?: string
  title: string
  subject: string
  class_label: string
  section_name: string
  blueprint_type: 'cbse_80m' | 'periodic_40m' | 'unit_20m' | 'custom'
  duration_minutes: number
  total_marks: number
  instructions: string
  question_count: number
  section_count: number
  sections_summary: {
    section_id: string
    name: string
    type: string
    marks_per_q: number
    question_count: number
    subtotal: number
  }[]
  difficulty_spread: {
    easy: number
    medium: number
    hard: number
  }
  scheduled_date?: string | null
  calendar_event_id?: string | null
  status: 'draft' | 'ready' | 'scheduled' | 'completed'
  created_at?: string
  updated_at?: string
}

export interface AssessmentDetailItem extends AssessmentSummaryItem {
  sections: AssessmentSection[]
}

interface AssessmentState {
  assessments: AssessmentSummaryItem[]
  activeAssessment: AssessmentDetailItem | null
  loading: boolean
  error: string | null
  filterStatus: string
  filterBlueprint: string
  searchQuery: string
  fetchAssessments: () => Promise<void>
  fetchAssessmentDetail: (id: string) => Promise<AssessmentDetailItem | null>
  createAssessment: (data: any) => Promise<AssessmentDetailItem>
  updateAssessment: (id: string, updates: any) => Promise<AssessmentDetailItem>
  deleteAssessment: (id: string) => Promise<void>
  scheduleAssessment: (id: string, sched: { scheduled_date: string; start_time: string; location: string }) => Promise<AssessmentDetailItem>
  setFilterStatus: (status: string) => void
  setFilterBlueprint: (bp: string) => void
  setSearchQuery: (q: string) => void
  setActiveAssessment: (item: AssessmentDetailItem | null) => void
}

const DEFAULT_CBSE_SECTIONS: AssessmentSection[] = [
  {
    section_id: 'sec-a',
    name: 'Section A',
    type: 'mcq',
    marks_per_q: 1,
    instructions: 'Questions 1 to 20 are Multiple Choice Questions carrying 1 mark each.',
    questions: [
      {
        id: 'q-a-1',
        text: 'If two positive integers a and b are written as a = x^3 y^2 and b = x y^3, where x, y are prime numbers, then HCF(a, b) is:',
        options: [
          { key: 'A', text: 'x y', correct: false },
          { key: 'B', text: 'x y^2', correct: true },
          { key: 'C', text: 'x^3 y^3', correct: false },
          { key: 'D', text: 'x^2 y^2', correct: false },
        ],
        difficulty: 'Easy',
        bloom: 'Understand',
        marks: 1,
      },
      {
        id: 'q-a-2',
        text: 'The discriminant of the quadratic equation 2x^2 - 4x + 3 = 0 is:',
        options: [
          { key: 'A', text: '-8', correct: true },
          { key: 'B', text: '10', correct: false },
          { key: 'C', text: '-16', correct: false },
          { key: 'D', text: '8', correct: false },
        ],
        difficulty: 'Easy',
        bloom: 'Remember',
        marks: 1,
      },
      {
        id: 'q-a-3',
        text: 'If sin theta + cos theta = sqrt(2) cos theta, then (cos theta - sin theta) is equal to:',
        options: [
          { key: 'A', text: '-sqrt(2) cos theta', correct: false },
          { key: 'B', text: 'sqrt(2) sin theta', correct: true },
          { key: 'C', text: 'sqrt(2) cos theta', correct: false },
          { key: 'D', text: '2 sin theta', correct: false },
        ],
        difficulty: 'Medium',
        bloom: 'Apply',
        marks: 1,
      },
    ],
  },
  {
    section_id: 'sec-b',
    name: 'Section B',
    type: 'short_answer_1',
    marks_per_q: 2,
    instructions: 'Questions 21 to 25 carry 2 marks each with very short answers.',
    questions: [
      {
        id: 'q-b-1',
        text: 'Prove that 3 + 2*sqrt(5) is an irrational number, given that sqrt(5) is irrational.',
        difficulty: 'Medium',
        bloom: 'Understand',
        rubric: '1 mark for assumption and contradiction setup; 1 mark for concluding statement.',
        marks: 2,
      },
      {
        id: 'q-b-2',
        text: 'Find the roots of the quadratic equation sqrt(3)x^2 + 10x + 7*sqrt(3) = 0 by factorisation.',
        difficulty: 'Medium',
        bloom: 'Apply',
        rubric: '1 mark for splitting middle term 3x + 7x; 1 mark for correct roots x = -sqrt(3), -7/sqrt(3).',
        marks: 2,
      },
    ],
  },
  {
    section_id: 'sec-c',
    name: 'Section C',
    type: 'short_answer_2',
    marks_per_q: 3,
    instructions: 'Questions 26 to 31 carry 3 marks each with short answers.',
    questions: [
      {
        id: 'q-c-1',
        text: 'Prove that: (sin theta - 2 sin^3 theta) / (2 cos^3 theta - cos theta) = tan theta.',
        difficulty: 'Medium',
        bloom: 'Analyze',
        rubric: '1 mark for factoring; 1 mark for identity substitution; 1 mark for simplification.',
        marks: 3,
      },
    ],
  },
  {
    section_id: 'sec-d',
    name: 'Section D',
    type: 'long_answer',
    marks_per_q: 5,
    instructions: 'Questions 32 to 35 carry 5 marks each with detailed step-by-step working.',
    questions: [
      {
        id: 'q-d-1',
        text: 'A motor boat whose speed is 18 km/h in still water takes 1 hour more to go 24 km upstream than to return downstream to the same spot. Find the speed of the stream.',
        difficulty: 'Hard',
        bloom: 'Evaluate',
        rubric: '2 marks for equation 24/(18-s) - 24/(18+s) = 1; 2 marks for quadratic; 1 mark for s = 6 km/h.',
        marks: 5,
      },
    ],
  },
  {
    section_id: 'sec-e',
    name: 'Section E',
    type: 'case_study',
    marks_per_q: 4,
    instructions: 'Case study questions are compulsory. Questions 36 to 38 carry 4 marks each.',
    questions: [
      {
        id: 'q-e-1',
        text: 'Case Study: India Gate Shadow Measurement. A student standing 30 m away observes top of monument at 60 deg elevation. Sub-part (i) Find height (2M). Sub-part (ii) Find distance if angle becomes 45 deg (2M).',
        difficulty: 'Hard',
        bloom: 'Create',
        rubric: '2 marks for h = 30*sqrt(3) m; 2 marks for distance = 30*sqrt(3) m.',
        marks: 4,
      },
    ],
  },
]

const DEFAULT_ASSESSMENTS: AssessmentSummaryItem[] = [
  {
    id: 'asmt-seed-1',
    title: 'CBSE Class 10 Model Examination: Mathematics',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: '10-A',
    blueprint_type: 'cbse_80m',
    duration_minutes: 180,
    total_marks: 80,
    instructions: 'This question paper contains 38 questions divided into 5 Sections A, B, C, D and E.',
    question_count: 8,
    section_count: 5,
    sections_summary: [
      { section_id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, question_count: 3, subtotal: 3 },
      { section_id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, question_count: 2, subtotal: 4 },
      { section_id: 'sec-c', name: 'Section C', type: 'short_answer_2', marks_per_q: 3, question_count: 1, subtotal: 3 },
      { section_id: 'sec-d', name: 'Section D', type: 'long_answer', marks_per_q: 5, question_count: 1, subtotal: 5 },
      { section_id: 'sec-e', name: 'Section E', type: 'case_study', marks_per_q: 4, question_count: 1, subtotal: 4 },
    ],
    difficulty_spread: { easy: 25, medium: 50, hard: 25 },
    scheduled_date: new Date(Date.now() + 86400 * 1000 * 7).toISOString().split('T')[0],
    status: 'ready',
  },
  {
    id: 'asmt-seed-2',
    title: 'Term 1 Periodic Assessment: Units I & II',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: '10-A',
    blueprint_type: 'periodic_40m',
    duration_minutes: 90,
    total_marks: 40,
    instructions: 'Periodic Test covering Real Numbers, Polynomials, and Quadratic Equations.',
    question_count: 6,
    section_count: 3,
    sections_summary: [
      { section_id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, question_count: 3, subtotal: 3 },
      { section_id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, question_count: 2, subtotal: 4 },
      { section_id: 'sec-c', name: 'Section C', type: 'short_answer_2', marks_per_q: 3, question_count: 1, subtotal: 3 },
    ],
    difficulty_spread: { easy: 33, medium: 50, hard: 17 },
    scheduled_date: new Date(Date.now() + 86400 * 1000 * 12).toISOString().split('T')[0],
    status: 'scheduled',
  },
  {
    id: 'asmt-seed-3',
    title: 'Unit Diagnostic Quiz: Trigonometry & Heights',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: '10-B',
    blueprint_type: 'unit_20m',
    duration_minutes: 40,
    total_marks: 20,
    instructions: 'Quick 40-minute diagnostic check on trigonometric ratios and values.',
    question_count: 5,
    section_count: 2,
    sections_summary: [
      { section_id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, question_count: 3, subtotal: 3 },
      { section_id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, question_count: 2, subtotal: 4 },
    ],
    difficulty_spread: { easy: 40, medium: 60, hard: 0 },
    status: 'draft',
  },
]

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: DEFAULT_ASSESSMENTS,
  activeAssessment: null,
  loading: false,
  error: null,
  filterStatus: 'all',
  filterBlueprint: 'all',
  searchQuery: '',

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterBlueprint: (bp) => set({ filterBlueprint: bp }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveAssessment: (item) => set({ activeAssessment: item }),

  fetchAssessments: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/assessments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch assessments')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        set({ assessments: data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  fetchAssessmentDetail: async (id: string) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      const found = get().assessments.find((a) => a.id === id)
      if (found) {
        const detail: AssessmentDetailItem = {
          ...found,
          sections: DEFAULT_CBSE_SECTIONS,
        }
        set({ activeAssessment: detail })
        return detail
      }
      return null
    }

    try {
      const res = await fetch(`${BASE}/api/assessments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const detail = await res.json()
        set({ activeAssessment: detail })
        return detail
      }
    } catch {
      // fallback
    }
    return null
  },

  createAssessment: async (data) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const tempId = `asmt-${Date.now()}`
    const newDetail: AssessmentDetailItem = {
      ...data,
      id: tempId,
      question_count: (data.sections || []).reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0),
      section_count: (data.sections || []).length,
      sections_summary: [],
      difficulty_spread: { easy: 30, medium: 50, hard: 20 },
      status: data.status || 'draft',
    }

    set((state) => ({ assessments: [newDetail, ...state.assessments] }))

    if (token) {
      try {
        const res = await fetch(`${BASE}/api/assessments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const serverAsmt = await res.json()
          set((state) => ({
            assessments: state.assessments.map((a) => (a.id === tempId ? serverAsmt : a)),
            activeAssessment: serverAsmt,
          }))
          return serverAsmt
        }
      } catch {
        // Retain optimistic
      }
    }
    return newDetail
  },

  updateAssessment: async (id, updates) => {
    set((state) => ({
      assessments: state.assessments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      activeAssessment: state.activeAssessment?.id === id ? { ...state.activeAssessment, ...updates } : state.activeAssessment,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('asmt-seed-')) {
      try {
        const res = await fetch(`${BASE}/api/assessments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        })
        if (res.ok) {
          const updated = await res.json()
          set((state) => ({
            assessments: state.assessments.map((a) => (a.id === id ? updated : a)),
            activeAssessment: state.activeAssessment?.id === id ? updated : state.activeAssessment,
          }))
          return updated
        }
      } catch {
        // ignore
      }
    }
    return get().activeAssessment!
  },

  deleteAssessment: async (id) => {
    set((state) => ({
      assessments: state.assessments.filter((a) => a.id !== id),
      activeAssessment: state.activeAssessment?.id === id ? null : state.activeAssessment,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('asmt-seed-')) {
      try {
        await fetch(`${BASE}/api/assessments/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore
      }
    }
  },

  scheduleAssessment: async (id, sched) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('asmt-seed-')) {
      try {
        const res = await fetch(`${BASE}/api/assessments/${id}/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sched),
        })
        if (res.ok) {
          const updated = await res.json()
          set((state) => ({
            assessments: state.assessments.map((a) => (a.id === id ? updated : a)),
            activeAssessment: state.activeAssessment?.id === id ? updated : state.activeAssessment,
          }))
          return updated
        }
      } catch {
        // fallback
      }
    }

    const fallbackUpdates = {
      scheduled_date: sched.scheduled_date,
      status: 'scheduled' as const,
    }
    set((state) => ({
      assessments: state.assessments.map((a) => (a.id === id ? { ...a, ...fallbackUpdates } : a)),
      activeAssessment: state.activeAssessment?.id === id ? { ...state.activeAssessment, ...fallbackUpdates } : state.activeAssessment,
    }))
    return get().activeAssessment!
  },
}))
