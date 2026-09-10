import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setToken, type License, type Order, type Plan } from '../lib/api'

/** Draft school as created at onboarding; seat count comes from the plan, not the form. */
export interface SchoolDraft {
  tenantId: string
  name: string
}

/** Purchase funnel state. Funnel state (plan/school/order/license) survives reload via
 *  persist — a mid-funnel refresh must not strand the buyer. The JWT lives in its own
 *  localStorage key via setToken and is not duplicated here. */
interface PurchaseState {
  authed: boolean
  plan: Plan | null
  school: SchoolDraft | null
  order: Order | null
  license: License | null
  signIn: (token: string) => void
  signOut: () => void
  selectPlan: (p: Plan) => void
  setSchool: (s: SchoolDraft) => void
  setOrder: (o: Order | null) => void
  setLicense: (l: License) => void
}

export const usePurchase = create<PurchaseState>()(persist((set) => ({
  authed: !!localStorage.getItem('edova_storefront_token'),
  plan: null,
  school: null,
  order: null,
  license: null,
  signIn: (t) => { setToken(t); set({ authed: true }) },
  signOut: () => { setToken(null); set({ authed: false, plan: null, school: null, order: null, license: null }) },
  selectPlan: (plan) => set({ plan }),
  setSchool: (school) => set({ school }),
  setOrder: (order) => set({ order }),
  setLicense: (license) => set({ license }),
}), {
  name: 'edova_purchase_funnel',
  partialize: (s) => ({ plan: s.plan, school: s.school, order: s.order, license: s.license }),
}))
