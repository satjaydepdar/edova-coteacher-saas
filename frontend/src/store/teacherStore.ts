import { create } from 'zustand'
import { TEACHER_TOKEN_KEY, TeacherApiError, setTeacherToken, teacherApi } from '../lib/teacherApi'

interface TeacherState {
  authed: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useTeacher = create<TeacherState>((set) => ({
  authed: localStorage.getItem(TEACHER_TOKEN_KEY) !== null,
  error: null,

  login: async (email, password) => {
    set({ error: null })
    try {
      const { access_token } = await teacherApi.login(email, password)
      setTeacherToken(access_token)
      await teacherApi.sections() // 403 here = valid login, not a teacher on any active school
      set({ authed: true })
    } catch (e) {
      setTeacherToken(null)
      const msg =
        e instanceof TeacherApiError && e.status === 403
          ? 'This account does not have teacher access.'
          : e instanceof TeacherApiError && e.status === 401
            ? 'Invalid email or password.'
            : 'Login failed. Is the API running?'
      set({ authed: false, error: msg })
      throw e
    }
  },

  logout: () => {
    setTeacherToken(null)
    set({ authed: false, error: null })
  },
}))
