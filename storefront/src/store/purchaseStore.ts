import { create } from 'zustand'
import { setToken, type License, type Order, type Plan } from '../lib/api'

/** Purchase funnel state. Survives route changes; only the token survives reloads. */
interface PurchaseState {
  authed: boolean
  plan: Plan | null
  tenantId: string | null
  schoolName: string
  seats: number
  order: Order | null
  license: License | null
  signIn: (token: string) => void
  signOut: () => void
  selectPlan: (p: Plan) => void
  setSchool: (tenantId: string, name: string, seats: number) => void
  setOrder: (o: Order) => void
  setLicense: (l: License) => void
}

export const usePurchase = create<PurchaseState>((set) => ({
  authed: !!localStorage.getItem('edova_storefront_token'),
  plan: null,
  tenantId: null,
  schoolName: '',
  seats: 25,
  order: null,
  license: null,
  signIn: (t) => { setToken(t); set({ authed: true }) },
  signOut: () => { setToken(null); set({ authed: false, plan: null, tenantId: null, order: null, license: null }) },
  selectPlan: (plan) => set({ plan }),
  setSchool: (tenantId, schoolName, seats) => set({ tenantId, schoolName, seats }),
  setOrder: (order) => set({ order }),
  setLicense: (license) => set({ license }),
}))
