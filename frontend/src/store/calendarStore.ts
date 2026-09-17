import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'edova_auth_token'

export type EventKind = 'class' | 'exam' | 'homework' | 'holiday' | 'meeting'

export interface CalendarEventItem {
  id: string
  title: string
  description: string
  event_type: EventKind
  start_at: string // ISO 8601
  end_at?: string
  all_day: boolean
  location?: string
}

interface CalendarState {
  events: CalendarEventItem[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  addEvent: (event: Omit<CalendarEventItem, 'id'>) => Promise<CalendarEventItem>
  deleteEvent: (id: string) => Promise<void>
}

// Fallback seed events for preview or offline
const DEFAULT_EVENTS: CalendarEventItem[] = [
  {
    id: 'ev-seed-1',
    title: 'Class 10A - Quadratic Equations',
    description: 'Factoring, completing the square, discriminant analysis',
    event_type: 'class',
    start_at: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    end_at: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
    all_day: false,
    location: 'Room 204',
  },
  {
    id: 'ev-seed-2',
    title: 'Term 1 Mid-Term Examination',
    description: 'CBSE Mathematics Assessment on Units I & II',
    event_type: 'exam',
    start_at: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    end_at: new Date(Date.now() + 86400 * 1000 * 2 + 10800 * 1000).toISOString(),
    all_day: false,
    location: 'Examination Hall A',
  },
  {
    id: 'ev-seed-3',
    title: 'Homework 3: Trigonometric Derivations',
    description: 'Step-by-step proofs on Equation Board',
    event_type: 'homework',
    start_at: new Date(Date.now() + 86400 * 1000 * 4).toISOString(),
    all_day: true,
  },
  {
    id: 'ev-seed-4',
    title: 'Staff Pedagogy Sync',
    description: 'NEP 2020 competency framework alignment',
    event_type: 'meeting',
    start_at: new Date(Date.now() + 86400 * 1000 * 5 + 3600 * 1000 * 4).toISOString(),
    end_at: new Date(Date.now() + 86400 * 1000 * 5 + 3600 * 1000 * 5).toISOString(),
    all_day: false,
    location: 'Conference Room 1',
  },
  {
    id: 'ev-seed-5',
    title: 'National Holiday: Gandhi Jayanti',
    description: 'School closed',
    event_type: 'holiday',
    start_at: new Date(Date.now() + 86400 * 1000 * 10).toISOString(),
    all_day: true,
  },
]

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: DEFAULT_EVENTS,
  loading: false,
  error: null,

  fetchEvents: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/calendar/events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch calendar events')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        set({ events: data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      // Keep local events on network error
      set({ loading: false })
    }
  },

  addEvent: async (ev) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const tempId = `ev-${Date.now()}`
    const newEv: CalendarEventItem = { ...ev, id: tempId }

    // Optimistic update
    set((state) => ({ events: [...state.events, newEv] }))

    if (token) {
      try {
        const res = await fetch(`${BASE}/api/calendar/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ev),
        })
        if (res.ok) {
          const serverEv = await res.json()
          set((state) => ({
            events: state.events.map((item) => (item.id === tempId ? serverEv : item)),
          }))
          return serverEv
        }
      } catch {
        // Fallback already handled optimistically
      }
    }
    return newEv
  },

  deleteEvent: async (id: string) => {
    set((state) => ({
      events: state.events.filter((item) => item.id !== id),
    }))

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !id.startsWith('ev-seed-')) {
      try {
        await fetch(`${BASE}/api/calendar/events/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Silent fail on local dev
      }
    }
  },
}))
