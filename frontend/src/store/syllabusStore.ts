import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'edova_auth_token'

export interface TopicItem {
  id: string
  title: string
  periods: number
}

export interface ChapterItem {
  id: string
  number: number
  title: string
  topics: TopicItem[]
}

export interface SyllabusUnit {
  id: string
  unitNumber: string
  title: string
  marks: number // CBSE Board weightage
  chapters: ChapterItem[]
}

// Canonical CBSE Class 10 Mathematics Syllabus (80 Marks Board distribution)
export const CBSE_CLASS_10_MATH_SYLLABUS: SyllabusUnit[] = [
  {
    id: 'unit-1',
    unitNumber: 'Unit I',
    title: 'Number Systems',
    marks: 6,
    chapters: [
      {
        id: 'ch-real-numbers',
        number: 1,
        title: 'Real Numbers',
        topics: [
          { id: 't-1-1', title: 'Fundamental Theorem of Arithmetic', periods: 4 },
          { id: 't-1-2', title: 'Proofs of Irrationality of v2, v3, v5', periods: 4 },
          { id: 't-1-3', title: 'Decimal Expansions of Rational Numbers', periods: 3 },
        ],
      },
    ],
  },
  {
    id: 'unit-2',
    unitNumber: 'Unit II',
    title: 'Algebra',
    marks: 20,
    chapters: [
      {
        id: 'ch-polynomials',
        number: 2,
        title: 'Polynomials',
        topics: [
          { id: 't-2-1', title: 'Zeros of a Polynomial & Geometric Meaning', periods: 4 },
          { id: 't-2-2', title: 'Relationship between Zeros and Coefficients', periods: 4 },
        ],
      },
      {
        id: 'ch-linear-equations',
        number: 3,
        title: 'Pair of Linear Equations in Two Variables',
        topics: [
          { id: 't-3-1', title: 'Graphical Method of Solution & Consistency', periods: 4 },
          { id: 't-3-2', title: 'Algebraic Methods: Substitution & Elimination', periods: 6 },
          { id: 't-3-3', title: 'Real-world Word Problems', periods: 4 },
        ],
      },
      {
        id: 'ch-quadratic-equations',
        number: 4,
        title: 'Quadratic Equations',
        topics: [
          { id: 't-4-1', title: 'Standard Form & Factorisation Method', periods: 5 },
          { id: 't-4-2', title: 'Quadratic Formula & Nature of Roots (Discriminant)', periods: 6 },
        ],
      },
      {
        id: 'ch-arithmetic-progressions',
        number: 5,
        title: 'Arithmetic Progressions',
        topics: [
          { id: 't-5-1', title: 'nth Term of an AP', periods: 5 },
          { id: 't-5-2', title: 'Sum of First n Terms of an AP', periods: 6 },
        ],
      },
    ],
  },
  {
    id: 'unit-3',
    unitNumber: 'Unit III',
    title: 'Coordinate Geometry',
    marks: 6,
    chapters: [
      {
        id: 'ch-coordinate-geometry',
        number: 7,
        title: 'Coordinate Geometry',
        topics: [
          { id: 't-7-1', title: 'Distance Formula & Geometric Applications', periods: 4 },
          { id: 't-7-2', title: 'Section Formula (Internal Division)', periods: 5 },
        ],
      },
    ],
  },
  {
    id: 'unit-4',
    unitNumber: 'Unit IV',
    title: 'Geometry',
    marks: 15,
    chapters: [
      {
        id: 'ch-triangles',
        number: 6,
        title: 'Triangles',
        topics: [
          { id: 't-6-1', title: 'Basic Proportionality Theorem (Thales) & Converse', periods: 6 },
          { id: 't-6-2', title: 'Criteria for Similarity of Triangles (AAA, SSS, SAS)', periods: 6 },
        ],
      },
      {
        id: 'ch-circles',
        number: 10,
        title: 'Circles',
        topics: [
          { id: 't-10-1', title: 'Tangent to a Circle at Point of Contact', periods: 4 },
          { id: 't-10-2', title: 'Lengths of Tangents from an External Point', periods: 4 },
        ],
      },
    ],
  },
  {
    id: 'unit-5',
    unitNumber: 'Unit V',
    title: 'Trigonometry',
    marks: 12,
    chapters: [
      {
        id: 'ch-intro-trig',
        number: 8,
        title: 'Introduction to Trigonometry',
        topics: [
          { id: 't-8-1', title: 'Trigonometric Ratios of Acute Angles', periods: 5 },
          { id: 't-8-2', title: 'Values of Trig Ratios for 30°, 45°, 60°', periods: 4 },
          { id: 't-8-3', title: 'Proof & Application of sin²? + cos²? = 1', periods: 5 },
        ],
      },
      {
        id: 'ch-applications-trig',
        number: 9,
        title: 'Some Applications of Trigonometry',
        topics: [
          { id: 't-9-1', title: 'Angles of Elevation and Depression', periods: 4 },
          { id: 't-9-2', title: 'Multi-step Height and Distance Problems', periods: 6 },
        ],
      },
    ],
  },
  {
    id: 'unit-6',
    unitNumber: 'Unit VI',
    title: 'Mensuration',
    marks: 10,
    chapters: [
      {
        id: 'ch-areas-circles',
        number: 11,
        title: 'Areas Related to Circles',
        topics: [
          { id: 't-11-1', title: 'Area of Sectors and Segments of a Circle', periods: 5 },
        ],
      },
      {
        id: 'ch-surface-areas',
        number: 12,
        title: 'Surface Areas and Volumes',
        topics: [
          { id: 't-12-1', title: 'Surface Areas of Combinations of Solids', periods: 5 },
          { id: 't-12-2', title: 'Volume of Combinations of Solids', periods: 5 },
        ],
      },
    ],
  },
  {
    id: 'unit-7',
    unitNumber: 'Unit VII',
    title: 'Statistics & Probability',
    marks: 11,
    chapters: [
      {
        id: 'ch-statistics',
        number: 13,
        title: 'Statistics',
        topics: [
          { id: 't-13-1', title: 'Mean, Median and Mode of Grouped Data', periods: 7 },
        ],
      },
      {
        id: 'ch-probability',
        number: 14,
        title: 'Probability',
        topics: [
          { id: 't-14-1', title: 'Classical Definition of Probability & Simple Problems', periods: 5 },
        ],
      },
    ],
  },
]

interface SyllabusState {
  units: SyllabusUnit[]
  completedTopicIds: Record<string, boolean>
  loading: boolean
  error: string | null
  fetchPacing: () => Promise<void>
  toggleTopic: (topicId: string) => Promise<void>
  getUnitProgress: (unitId: string) => number
  getOverallProgress: () => number
}

const LOCAL_STORAGE_KEY = 'edova_syllabus_completed_topics'

function getInitialCompleted(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  // Default seed completed topics
  return { 't-1-1': true, 't-1-2': true, 't-2-1': true, 't-8-1': true }
}

export const useSyllabusStore = create<SyllabusState>((set, get) => ({
  units: CBSE_CLASS_10_MATH_SYLLABUS,
  completedTopicIds: getInitialCompleted(),
  loading: false,
  error: null,

  fetchPacing: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    set({ loading: true })
    try {
      const res = await fetch(`${BASE}/api/syllabus/pacing`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const mapping: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(data.completed_topics || {})) {
          mapping[k] = (v as any).is_completed
        }
        if (Object.keys(mapping).length > 0) {
          set({ completedTopicIds: { ...get().completedTopicIds, ...mapping }, loading: false })
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get().completedTopicIds))
          return
        }
      }
    } catch {
      // ignore
    }
    set({ loading: false })
  },

  toggleTopic: async (topicId: string) => {
    const current = !!get().completedTopicIds[topicId]
    const nextVal = !current
    const updated = { ...get().completedTopicIds, [topicId]: nextVal }

    set({ completedTopicIds: updated })
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }

    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      try {
        await fetch(`${BASE}/api/syllabus/pacing/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ topic_id: topicId, is_completed: nextVal }),
        })
      } catch {
        // Optimistic update retained
      }
    }
  },

  getUnitProgress: (unitId: string) => {
    const unit = get().units.find((u) => u.id === unitId)
    if (!unit) return 0
    let total = 0
    let done = 0
    for (const ch of unit.chapters) {
      for (const t of ch.topics) {
        total += 1
        if (get().completedTopicIds[t.id]) done += 1
      }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  },

  getOverallProgress: () => {
    let total = 0
    let done = 0
    for (const u of get().units) {
      for (const ch of u.chapters) {
        for (const t of ch.topics) {
          total += 1
          if (get().completedTopicIds[t.id]) done += 1
        }
      }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  },
}))
