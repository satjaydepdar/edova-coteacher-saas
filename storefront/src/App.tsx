import { Navigate, Route, Routes } from 'react-router-dom'
import Pricing from './pages/Pricing'
import SignIn from './pages/SignIn'
import Onboarding from './pages/Onboarding'
import Checkout from './pages/Checkout'
import Success from './pages/Success'

/** Public purchase funnel: / → pricing; the rest of the flow is linear. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Pricing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
