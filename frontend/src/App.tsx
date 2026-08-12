import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './store'
import Activation from './pages/Activation'
import Expired from './pages/Expired'
import Shell from './components/Shell'
import Lessons from './pages/Lessons'
import ModuleDetail from './pages/ModuleDetail'
import Practice from './pages/Practice'
import AdminLogin from './pages/admin/AdminLogin'
import AdminShell from './pages/admin/AdminShell'
import AdminContent from './pages/admin/AdminContent'
import AdminSubject from './pages/admin/AdminSubject'
import AdminSchools from './pages/admin/AdminSchools'
import AdminUsers from './pages/admin/AdminUsers'

/** Admin CMS routes — independent of the device-activation flow below
 *  (CMS authenticates with user JWTs via adminStore, not device tokens).
 *  Paths live under /cms because /admin/* is the API namespace (Vite proxy). */
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/cms/login" element={<AdminLogin />} />
      <Route path="/cms" element={<AdminShell />}>
        <Route index element={<Navigate to="/cms/content" replace />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="content/:subjectId" element={<AdminSubject />} />
        <Route path="schools" element={<AdminSchools />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/cms/content" replace />} />
    </Routes>
  )
}

export default function App() {
  const authed = useApp((s) => s.authed)
  const activationExpired = useApp((s) => s.activationExpired)
  const { pathname } = useLocation()
  if (pathname.startsWith('/cms')) return <AdminRoutes />
  if (!authed) {
    return (
      <Routes>
        <Route path="/activate" element={<Activation />} />
        <Route path="*" element={<Navigate to="/activate" replace />} />
      </Routes>
    )
  }
  if (activationExpired) {
    return <Expired />
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Lessons />} />
        <Route path="/module/:moduleId" element={<ModuleDetail />} />
        <Route path="/practice" element={<Practice />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
