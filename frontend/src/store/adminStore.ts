import { create } from 'zustand'
import {
  ADMIN_TOKEN_KEY,
  AdminApiError,
  adminAuth,
  setAdminToken,
  type AdminSession,
} from '../lib/adminApi'

interface AdminState {
  authed: boolean
  session: AdminSession | null
  error: string | null
  login: (email: string, password: string) => Promise<void>
  loadSession: () => Promise<void>
  logout: () => void
}

export const useAdmin = create<AdminState>((set) => ({
  authed: localStorage.getItem(ADMIN_TOKEN_KEY) !== null,
  session: null,
  error: null,

  login: async (email, password) => {
    set({ error: null })
    try {
      const { access_token } = await adminAuth.login(email, password)
      setAdminToken(access_token)
      const session = await adminAuth.session() // 403 here = valid login, not an admin
      set({ authed: true, session })
    } catch (e) {
      setAdminToken(null)
      const msg =
        e instanceof AdminApiError && e.status === 403
          ? 'This account does not have CMS admin access.'
          : e instanceof AdminApiError && e.status === 401
            ? 'Invalid email or password.'
            : 'Login failed. Is the API running?'
      set({ authed: false, session: null, error: msg })
      throw e
    }
  },

  loadSession: async () => {
    try {
      const session = await adminAuth.session()
      set({ session, authed: true })
    } catch (e) {
      if (e instanceof AdminApiError && (e.status === 401 || e.status === 403)) {
        setAdminToken(null)
        set({ authed: false, session: null })
      }
    }
  },

  logout: () => {
    setAdminToken(null)
    set({ authed: false, session: null, error: null })
  },
}))
