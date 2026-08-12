import { create } from 'zustand'
import {
  api,
  ApiError,
  getDeviceId,
  setToken,
  type ActivationSession,
  type Features,
  type Subject,
} from './lib/api'

interface AppState {
  authed: boolean
  session: ActivationSession | null
  subjects: Subject[]
  features: Features | null
  bootError: string | null
  /** true when the backend rejected the device token (expired/revoked) — show the expired screen */
  activationExpired: boolean
  activate: (keyCode: string) => Promise<void>
  boot: () => Promise<void>
  deactivate: () => void
}

export const useApp = create<AppState>((set) => ({
  authed: false, // set from initStorage() in main.tsx before first render
  session: null,
  subjects: [],
  features: null,
  bootError: null,
  activationExpired: false,

  activate: async (keyCode) => {
    const res = await api.activate(keyCode, getDeviceId())
    setToken(res.access_token)
    set({
      authed: true,
      activationExpired: false,
      session: {
        tenant: res.tenant,
        features: res.features,
        expires_at: res.expires_at,
      },
      features: res.features,
    })
  },

  boot: async () => {
    try {
      const [session, shelf] = await Promise.all([api.activationSession(), api.appSubjects()])
      set({
        session,
        subjects: shelf.subjects,
        features: shelf.features,
        bootError: null,
        activationExpired: false,
      })
    } catch (e) {
      // 403 from the session endpoint = key expired / revoked / subscription lapsed
      if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
        set({ activationExpired: true, bootError: null })
        return
      }
      const msg = e instanceof Error ? e.message : 'failed to load content'
      set({ bootError: msg })
      throw e
    }
  },

  deactivate: () => {
    setToken(null)
    set({
      authed: false,
      session: null,
      subjects: [],
      features: null,
      bootError: null,
      activationExpired: false,
    })
  },
}))
