import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'edova_auth_token'

export interface LessonPlanPhases {
  warmup: string
  instruction: string
  activity: string
  assessment: string
  homework: string
}

export interface LessonPlanItem {
  id: string
  tenant_id?: string
  user_id?: string
  title: string
  subject: string
  class_label: string
  section_name: string
  unit_id?: string
  chapter_id?: string
  topic_id?: string
  duration_minutes: number
  objective: string
  outcomes: string[]
  bloom_levels: string[]
  nep_tags: string[]
  phases: LessonPlanPhases
  materials: string[]
  scheduled_date?: string | null
  calendar_event_id?: string | null
  status: 'draft' | 'planned' | 'scheduled' | 'completed'
  created_at?: string
  updated_at?: string
}

interface LessonPlanState {
  plans: LessonPlanItem[]
  loading: boolean
  error: string | null
  selectedPlan: LessonPlanItem | null
  filterStatus: string
  searchQuery: string
  fetchPlans: () => Promise<void>
  createPlan: (plan: Omit<LessonPlanItem, 'id'>) => Promise<LessonPlanItem>
  updatePlan: (id: string, updates: Partial<LessonPlanItem>) => Promise<LessonPlanItem>
  deletePlan: (id: string) => Promise<void>
  schedulePlan: (id: string, sched: { scheduled_date: string; start_time: string; location: string }) => Promise<LessonPlanItem>
  setSelectedPlan: (plan: LessonPlanItem | null) => void
  setFilterStatus: (status: string) => void
  setSearchQuery: (q: string) => void
}

const DEFAULT_PLANS: LessonPlanItem[] = [
  {
    id: 'lp-seed-1',
    title: 'Quadratic Equations: Factorisation & Roots',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: 'Section A',
    unit_id: 'unit-2',
    chapter_id: 'ch-2-2',
    topic_id: 'topic-2-2-1',
    duration_minutes: 45,
    objective: 'Understand the standard form ax^2 + bx + c = 0 and solve quadratic equations by splitting the middle term.',
    outcomes: [
      'Identify real-world scenarios that produce quadratic models',
      'Factorise quadratic polynomials with integer coefficients',
      'State the zero-product property and solve for roots',
    ],
    bloom_levels: ['Understand', 'Apply'],
    nep_tags: ['Concept', 'Application'],
    phases: {
      warmup: 'Review multiplication of binomials (x+a)(x+b) with 3 quick mental math prompts on whiteboard.',
      instruction: 'Derive the splitting-the-middle-term technique using product p*q = a*c and sum p+q = b. Address common sign error misconceptions.',
      activity: 'Paired problem set: Students solve 4 equations with varied sign patterns (+/+, -/+, +/-). Peer check steps.',
      assessment: 'Exit ticket: Solve 2x^2 - 5x + 3 = 0. Verify roots by substitution.',
      homework: 'NCERT Exercise 4.2: Questions 1(i-v), 3, and 5.',
    },
    materials: ['Graph paper', 'Equation Board', 'NCERT Class 10 Textbook'],
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'scheduled',
  },
  {
    id: 'lp-seed-2',
    title: 'Real Numbers: Fundamental Theorem of Arithmetic',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: 'Section A',
    unit_id: 'unit-1',
    chapter_id: 'ch-1-1',
    topic_id: 'topic-1-1-1',
    duration_minutes: 45,
    objective: 'Express composite numbers as products of primes uniquely and apply prime factorisation to determine HCF and LCM.',
    outcomes: [
      'State the Fundamental Theorem of Arithmetic precisely',
      'Find HCF(a, b) and LCM(a, b) using prime factorisation',
      'Verify the relationship HCF(a, b) * LCM(a, b) = a * b',
    ],
    bloom_levels: ['Remember', 'Understand', 'Apply'],
    nep_tags: ['Concept', 'Critical thinking'],
    phases: {
      warmup: 'Factor tree puzzle: decompose 144 and 216 into prime powers within 3 minutes.',
      instruction: 'Formal proof overview of uniqueness of prime factorisation. Demonstrate why 4^n cannot end with 0.',
      activity: 'Group activity: prove or disprove whether HCF * LCM = a * b holds for three numbers.',
      assessment: 'Formative question: If HCF(306, 657) = 9, calculate LCM(306, 657).',
      homework: 'NCERT Exercise 1.2: Problems 2, 4, and 7.',
    },
    materials: ['Prime factor cards', 'NCERT Textbook'],
    scheduled_date: new Date(Date.now() + 86400 * 1000 * 2).toISOString().split('T')[0],
    status: 'planned',
  },
  {
    id: 'lp-seed-3',
    title: 'Introduction to Trigonometric Ratios',
    subject: 'Mathematics',
    class_label: 'Class 10',
    section_name: 'Section B',
    unit_id: 'unit-5',
    chapter_id: 'ch-5-1',
    topic_id: 'topic-5-1-1',
    duration_minutes: 45,
    objective: 'Define sine, cosine, tangent, cosecant, secant, and cotangent in a right-angled triangle.',
    outcomes: [
      'Identify opposite, adjacent, and hypotenuse relative to an acute angle',
      'Calculate basic trig ratios given two sides of a right triangle',
      'Recognize reciprocal relationships among ratios',
    ],
    bloom_levels: ['Remember', 'Understand'],
    nep_tags: ['Concept', 'Application'],
    phases: {
      warmup: 'Display right triangle shadow measurement of a flagpole. Ask how height can be found without climbing.',
      instruction: 'Introduce mnemonic SOH CAH TOA / Pandit Badri Prasad. Emphasize that ratios depend only on angle, not triangle size.',
      activity: 'Trig ratio matching game using triangles of varying orientations.',
      assessment: 'Given tan A = 4/3, calculate sin A and cos A.',
      homework: 'NCERT Exercise 8.1: Questions 1 to 5.',
    },
    materials: ['Protractor', 'Right triangle cutouts', 'Interactive Virtual Lab'],
    status: 'draft',
  },
]

export const useLessonPlanStore = create<LessonPlanState>((set, get) => ({
  plans: DEFAULT_PLANS,
  loading: false,
  error: null,
  selectedPlan: null,
  filterStatus: 'all',
  searchQuery: '',

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchPlans: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/lessons/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch lesson plans')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        set({ plans: data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  createPlan: async (planData) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const tempId = `lp-${Date.now()}`
    const newPlan: LessonPlanItem = { ...planData, id: tempId }

    set((state) => ({ plans: [newPlan, ...state.plans] }))

    if (token) {
      try {
        const res = await fetch(`${BASE}/api/lessons/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(planData),
        })
        if (res.ok) {
          const serverPlan = await res.json()
          set((state) => ({
            plans: state.plans.map((p) => (p.id === tempId ? serverPlan : p)),
          }))
          return serverPlan
        }
      } catch {
        // Fallback already in place
      }
    }
    return newPlan
  },

  updatePlan: async (id, updates) => {
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedPlan: state.selectedPlan?.id === id ? { ...state.selectedPlan, ...updates } : state.selectedPlan,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('lp-seed-')) {
      try {
        const res = await fetch(`${BASE}/api/lessons/plans/${id}`, {
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
            plans: state.plans.map((p) => (p.id === id ? updated : p)),
            selectedPlan: state.selectedPlan?.id === id ? updated : state.selectedPlan,
          }))
          return updated
        }
      } catch {
        // Retain optimistic
      }
    }
    return get().plans.find((p) => p.id === id)!
  },

  deletePlan: async (id) => {
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      selectedPlan: state.selectedPlan?.id === id ? null : state.selectedPlan,
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('lp-seed-')) {
      try {
        await fetch(`${BASE}/api/lessons/plans/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore
      }
    }
  },

  schedulePlan: async (id, sched) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('lp-seed-')) {
      try {
        const res = await fetch(`${BASE}/api/lessons/plans/${id}/schedule`, {
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
            plans: state.plans.map((p) => (p.id === id ? updated : p)),
            selectedPlan: state.selectedPlan?.id === id ? updated : state.selectedPlan,
          }))
          return updated
        }
      } catch {
        // Fallback optimistic
      }
    }

    // Local optimistic fallback
    const fallbackUpdates: Partial<LessonPlanItem> = {
      scheduled_date: sched.scheduled_date,
      status: 'scheduled',
    }
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...fallbackUpdates } : p)),
      selectedPlan: state.selectedPlan?.id === id ? { ...state.selectedPlan, ...fallbackUpdates } : state.selectedPlan,
    }))
    return get().plans.find((p) => p.id === id)!
  },
}))
