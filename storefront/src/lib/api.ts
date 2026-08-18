/** Storefront API client — public purchase endpoints + shared /auth/login.
 *  Token is the purchaser's own user JWT (no admin role involved). */

const TOKEN_KEY = 'edova_storefront_token'

let token: string | null = localStorage.getItem(TOKEN_KEY)

export function getToken() { return token }
export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(public status: number, public detail: string) { super(detail) }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { detail = (await res.json()).detail ?? detail } catch { /* non-JSON */ }
    throw new ApiError(res.status, detail)
  }
  return res.json()
}

export interface Plan {
  id: string; name: string; tier_level: number
  allow_video: boolean; allow_lab: boolean; allow_quiz: boolean
  price_inr: number; blurb: string
}

export interface Order {
  order_id: string; amount_paise: number; currency: string; plan_name: string; mode: string
}

export interface License {
  activated: boolean; tenant_id: string; school_name: string
  key_code: string; max_devices: number
  subscription_start: string; subscription_end: string
}

export const api = {
  signup: (email: string, password: string, full_name: string) =>
    call<{ access_token: string }>('/api/public/signup', {
      method: 'POST', body: JSON.stringify({ email, password, full_name }),
    }),
  login: (email: string, password: string) =>
    call<{ access_token: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  plans: () => call<{ plans: Plan[] }>('/api/public/plans'),
  onboard: (school_name: string, address: string, seat_count: number) =>
    call<{ tenant_id: string; name: string; existing: boolean }>('/api/public/schools/onboard', {
      method: 'POST', body: JSON.stringify({ school_name, address, seat_count }),
    }),
  createOrder: (plan_id: string, tenant_id: string, seat_count: number) =>
    call<Order>('/api/public/checkout/create-order', {
      method: 'POST', body: JSON.stringify({ plan_id, tenant_id, seat_count }),
    }),
  verify: (order_id: string, payment_id: string) =>
    call<License>('/api/public/checkout/verify', {
      method: 'POST', body: JSON.stringify({ order_id, payment_id }),
    }),
}
