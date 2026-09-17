import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'edova_auth_token'

export interface SubmissionItem {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  status: 'pending' | 'submitted' | 'graded' | 'late' | 'missing'
  score?: number | null
  feedback: string
  submitted_at?: string | null
  graded_at?: string | null
}

export interface AssignmentSummaryItem {
  id: string
  tenant_id?: string
  created_by?: string
  section_name: string
  subject: string
  lesson_plan_id?: string | null
  title: string
  description: string
  type: 'homework' | 'worksheet' | 'project' | 'practice'
  total_points: number
  due_date?: string | null
  calendar_event_id?: string | null
  status: 'draft' | 'published' | 'closed'
  created_at?: string
  total_students: number
  submitted_count: number
  graded_count: number
  pending_count: number
  avg_score?: number | null
}

export interface AssignmentDetailItem extends AssignmentSummaryItem {
  submissions: SubmissionItem[]
}

interface AssignmentState {
  assignments: AssignmentSummaryItem[]
  activeAssignment: AssignmentDetailItem | null
  loading: boolean
  error: string | null
  filterSection: string
  filterStatus: string
  searchQuery: string
  fetchAssignments: () => Promise<void>
  fetchAssignmentDetail: (id: string) => Promise<AssignmentDetailItem | null>
  createAssignment: (data: Partial<AssignmentSummaryItem> & { sync_calendar?: boolean }) => Promise<AssignmentSummaryItem>
  updateAssignment: (id: string, updates: Partial<AssignmentSummaryItem>) => Promise<AssignmentSummaryItem>
  deleteAssignment: (id: string) => Promise<void>
  gradeSubmission: (assignmentId: string, studentId: string, score: number, feedback: string) => Promise<void>
  setFilterSection: (sec: string) => void
  setFilterStatus: (status: string) => void
  setSearchQuery: (q: string) => void
  setActiveAssignment: (item: AssignmentDetailItem | null) => void
}

const DEFAULT_ASSIGNMENTS: AssignmentSummaryItem[] = [
  {
    id: 'asg-seed-1',
    section_name: '10-A',
    subject: 'Mathematics',
    title: 'Quadratic Equations: Factorisation Practice',
    description: 'Complete NCERT Exercise 4.2 Questions 1 to 5. Show step-by-step middle term splitting.',
    type: 'homework',
    total_points: 100,
    due_date: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    status: 'published',
    total_students: 28,
    submitted_count: 24,
    graded_count: 18,
    pending_count: 4,
    avg_score: 87.5,
  },
  {
    id: 'asg-seed-2',
    section_name: '10-A',
    subject: 'Mathematics',
    title: 'Real Numbers: Fundamental Theorem & Proofs',
    description: 'Write formal proofs for irrationality of sqrt(2) and complete HCF/LCM application word problems.',
    type: 'worksheet',
    total_points: 50,
    due_date: new Date(Date.now() + 86400 * 1000 * 5).toISOString(),
    status: 'published',
    total_students: 28,
    submitted_count: 19,
    graded_count: 12,
    pending_count: 9,
    avg_score: 84.0,
  },
  {
    id: 'asg-seed-3',
    section_name: '10-B',
    subject: 'Mathematics',
    title: 'Trigonometric Ratios Virtual Lab Reflection',
    description: 'Submit observation table and angle-ratio calculation sheet from the virtual lab.',
    type: 'practice',
    total_points: 50,
    due_date: new Date(Date.now() - 86400 * 1000 * 1).toISOString(),
    status: 'closed',
    total_students: 26,
    submitted_count: 26,
    graded_count: 26,
    pending_count: 0,
    avg_score: 91.2,
  },
]

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: DEFAULT_ASSIGNMENTS,
  activeAssignment: null,
  loading: false,
  error: null,
  filterSection: 'All',
  filterStatus: 'all',
  searchQuery: '',

  setFilterSection: (sec) => set({ filterSection: sec }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveAssignment: (item) => set({ activeAssignment: item }),

  fetchAssignments: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch assignments')
      const data = await res.json()
      if (Array.isArray(data)) {
        set({ assignments: data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  fetchAssignmentDetail: async (id: string) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      const found = get().assignments.find((a) => a.id === id)
      if (found) {
        const detail: AssignmentDetailItem = {
          ...found,
          submissions: [
            { id: 'sub-1', assignment_id: id, student_id: 'stu-1', student_name: 'Aarav Sharma', status: 'graded', score: 92, feedback: 'Great factorization work!' },
            { id: 'sub-2', assignment_id: id, student_id: 'stu-2', student_name: 'Ananya Patel', status: 'graded', score: 88, feedback: 'Well structured.' },
            { id: 'sub-3', assignment_id: id, student_id: 'stu-3', student_name: 'Rohan Gupta', status: 'submitted', score: null, feedback: '' },
            { id: 'sub-4', assignment_id: id, student_id: 'stu-4', student_name: 'Priya Nair', status: 'pending', score: null, feedback: '' },
          ],
        }
        set({ activeAssignment: detail })
        return detail
      }
      return null
    }

    try {
      const res = await fetch(`${BASE}/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const detail = await res.json()
        set({ activeAssignment: detail })
        return detail
      }
    } catch {
      // fallback
    }
    return null
  },

  createAssignment: async (data) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const tempId = `asg-${Date.now()}`
    const newAsg: AssignmentSummaryItem = {
      id: tempId,
      section_name: data.section_name || '10-A',
      subject: data.subject || 'Mathematics',
      title: data.title || 'Untitled Assignment',
      description: data.description || '',
      type: data.type || 'homework',
      total_points: data.total_points || 100,
      due_date: data.due_date || null,
      status: data.status || 'published',
      total_students: 28,
      submitted_count: 0,
      graded_count: 0,
      pending_count: 28,
      avg_score: null,
    }

    set((state) => ({ assignments: [newAsg, ...state.assignments] }))

    if (token) {
      try {
        const res = await fetch(`${BASE}/api/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const serverAsg = await res.json()
          set((state) => ({
            assignments: state.assignments.map((a) => (a.id === tempId ? serverAsg : a)),
          }))
          return serverAsg
        }
      } catch {
        // Retain optimistic
      }
    }
    return newAsg
  },

  updateAssignment: async (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      activeAssignment: state.activeAssignment?.id === id ? { ...state.activeAssignment, ...updates } : state.activeAssignment,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('asg-seed-')) {
      try {
        const res = await fetch(`${BASE}/api/assignments/${id}`, {
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
            assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
            activeAssignment: state.activeAssignment?.id === id ? { ...state.activeAssignment, ...updated } : state.activeAssignment,
          }))
          return updated
        }
      } catch {
        // Retain optimistic
      }
    }
    return get().assignments.find((a) => a.id === id)!
  },

  deleteAssignment: async (id) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
      activeAssignment: state.activeAssignment?.id === id ? null : state.activeAssignment,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('asg-seed-')) {
      try {
        await fetch(`${BASE}/api/assignments/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore
      }
    }
  },

  gradeSubmission: async (assignmentId, studentId, score, feedback) => {
    // Optimistic update in activeAssignment
    set((state) => {
      if (!state.activeAssignment || state.activeAssignment.id !== assignmentId) return state
      const updatedSubs = state.activeAssignment.submissions.map((sub) => {
        if (sub.student_id === studentId) {
          return { ...sub, score, feedback, status: 'graded' as const, graded_at: new Date().toISOString() }
        }
        return sub
      })
      return {
        activeAssignment: { ...state.activeAssignment, submissions: updatedSubs },
      }
    })

    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      try {
        await fetch(`${BASE}/api/assignments/${assignmentId}/grade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ student_id: studentId, score, feedback }),
        })
        // Refresh summary
        await get().fetchAssignments()
      } catch {
        // ignore
      }
    }
  },
}))
