import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export interface AttendanceRecord {
  student_id: string
  student_name: string
  roll_no: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note: string
}

export interface AttendanceSummarySession {
  section_name: string
  date: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number
}

export interface AttendanceSummary {
  average_rate: number
  total_sessions: number
  history: AttendanceSummarySession[]
}

interface AttendanceState {
  sectionName: string
  attendanceDate: string
  records: AttendanceRecord[]
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  totalStudents: number
  isSaved: boolean
  loading: boolean
  saving: boolean
  error: string | null
  saveSuccessToast: boolean
  summary: AttendanceSummary | null

  fetchDailyAttendance: (section?: string, date?: string) => Promise<void>
  setStudentStatus: (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => void
  setStudentNote: (studentId: string, note: string) => void
  markAllPresent: () => void
  saveAttendance: () => Promise<void>
  fetchSummary: (section?: string) => Promise<void>
  setSectionName: (sec: string) => void
  setAttendanceDate: (dateStr: string) => void
  dismissToast: () => void
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('edova_auth_token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function recalculateCounts(records: AttendanceRecord[]) {
  let presentCount = 0
  let absentCount = 0
  let lateCount = 0
  let excusedCount = 0
  for (const r of records) {
    if (r.status === 'present') presentCount++
    else if (r.status === 'absent') absentCount++
    else if (r.status === 'late') lateCount++
    else if (r.status === 'excused') excusedCount++
  }
  return {
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    totalStudents: records.length,
  }
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sectionName: '10-A',
  attendanceDate: getTodayString(),
  records: [],
  presentCount: 0,
  absentCount: 0,
  lateCount: 0,
  excusedCount: 0,
  totalStudents: 0,
  isSaved: false,
  loading: false,
  saving: false,
  error: null,
  saveSuccessToast: false,
  summary: null,

  fetchDailyAttendance: async (sec, d) => {
    const section = sec ?? get().sectionName
    const dateStr = d ?? get().attendanceDate
    set({ loading: true, error: null, sectionName: section, attendanceDate: dateStr })

    try {
      const res = await fetch(`${BASE}/api/attendance?section_name=${encodeURIComponent(section)}&attendance_date=${encodeURIComponent(dateStr)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch attendance`)
      const data = await res.json()

      const records: AttendanceRecord[] = data.records || []
      const counts = recalculateCounts(records)

      set({
        records,
        isSaved: data.is_saved,
        ...counts,
        loading: false,
      })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  setStudentStatus: (studentId, status) => {
    const updated = get().records.map((r) =>
      r.student_id === studentId ? { ...r, status } : r
    )
    const counts = recalculateCounts(updated)
    set({ records: updated, ...counts })
  },

  setStudentNote: (studentId, note) => {
    const updated = get().records.map((r) =>
      r.student_id === studentId ? { ...r, note } : r
    )
    set({ records: updated })
  },

  markAllPresent: () => {
    const updated = get().records.map((r) => ({ ...r, status: 'present' as const }))
    const counts = recalculateCounts(updated)
    set({ records: updated, ...counts })
  },

  saveAttendance: async () => {
    const { sectionName, attendanceDate, records } = get()
    set({ saving: true, error: null })

    try {
      const res = await fetch(`${BASE}/api/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          section_name: sectionName,
          attendance_date: attendanceDate,
          records,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to save attendance`)
      const data = await res.json()

      set({
        isSaved: true,
        saving: false,
        saveSuccessToast: true,
        presentCount: data.present_count,
        absentCount: data.absent_count,
        lateCount: data.late_count,
        excusedCount: data.excused_count,
        totalStudents: data.total_students,
      })

      setTimeout(() => {
        set({ saveSuccessToast: false })
      }, 3500)
    } catch (err: any) {
      set({ error: err.message, saving: false })
    }
  },

  fetchSummary: async (sec) => {
    const section = sec ?? get().sectionName
    try {
      const res = await fetch(`${BASE}/api/attendance/summary?section_name=${encodeURIComponent(section)}`, {
        headers: getAuthHeader(),
      })
      if (res.ok) {
        const summaryData = await res.json()
        set({ summary: summaryData })
      }
    } catch (err) {
      console.error('Error fetching attendance summary', err)
    }
  },

  setSectionName: (sec) => {
    set({ sectionName: sec })
    void get().fetchDailyAttendance(sec, get().attendanceDate)
    void get().fetchSummary(sec)
  },

  setAttendanceDate: (dateStr) => {
    set({ attendanceDate: dateStr })
    void get().fetchDailyAttendance(get().sectionName, dateStr)
  },

  dismissToast: () => set({ saveSuccessToast: false }),
}))
