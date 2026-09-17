import { create } from 'zustand'
import { setToken as setAppToken } from '../lib/api'
import { setTeacherToken } from '../lib/teacherApi'
import { setAdminToken } from '../lib/adminApi'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''
export const AUTH_TOKEN_KEY = 'edova_auth_token'
export const AUTH_USER_KEY = 'edova_auth_user'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  tenant_id: string | null
  tenant_name: string
  tenant_type: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  authed: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
  init: () => Promise<void>
}

function syncAllTokens(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    setAppToken(token)
    setTeacherToken(token)
    setAdminToken(token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setAppToken(null)
    setTeacherToken(null)
    setAdminToken(null)
  }
}

const cachedToken = localStorage.getItem(AUTH_TOKEN_KEY)
let cachedUser: AuthUser | null = null
try {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (raw) cachedUser = JSON.parse(raw)
} catch {
  // ignore json parse error
}

// Initial sync
if (cachedToken) {
  syncAllTokens(cachedToken)
}

export const useAuthStore = create<AuthState>((set) => ({
  token: cachedToken,
  user: cachedUser,
  authed: cachedToken !== null && cachedUser !== null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        let errorMsg = 'Invalid email or password'
        try {
          const body = await res.json()
          if (body?.detail) {
            errorMsg = body.detail
          }
        } catch {
          // non-json response
        }
        set({ loading: false, error: errorMsg })
        throw new Error(errorMsg)
      }

      const data = await res.json()
      const token = data.access_token as string
      const user = data.user as AuthUser

      syncAllTokens(token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))

      set({
        token,
        user,
        authed: true,
        loading: false,
        error: null,
      })

      return user
    } catch (e: unknown) {
      syncAllTokens(null)
      const err = e instanceof Error ? e.message : 'Login failed'
      set({ authed: false, user: null, token: null, loading: false, error: err })
      throw e
    }
  },

  logout: () => {
    syncAllTokens(null)
    set({
      token: null,
      user: null,
      authed: false,
      loading: false,
      error: null,
    })
  },

  init: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      syncAllTokens(null)
      set({ authed: false, user: null, token: null })
      return
    }

    try {
      const res = await fetch(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Session invalid')
      }
      const data = await res.json()
      const user = data.user as AuthUser
      syncAllTokens(token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      set({ authed: true, user, token })
    } catch {
      syncAllTokens(null)
      set({ authed: false, user: null, token: null })
    }
  },
}))
