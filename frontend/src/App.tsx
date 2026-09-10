import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './store'
import Activation from './pages/Activation'
import Expired from './pages/Expired'
import Shell from './components/Shell'
import Lessons from './pages/Lessons'
import ModuleDetail from './pages/ModuleDetail'
import Practice from './pages/Practice'
import Labs from './pages/Labs'
import AdminLogin from './pages/admin/AdminLogin'
import AdminShell from './pages/admin/AdminShell'
import AdminContent from './pages/admin/AdminContent'
import AdminSubject from './pages/admin/AdminSubject'
import AdminSchools from './pages/admin/AdminSchools'
import AdminUsers from './pages/admin/AdminUsers'
import TeacherLogin from './pages/teacher/TeacherLogin'
import DashboardOverview from './pages/teacher/DashboardOverview'
import SectionDeepdive from './pages/teacher/SectionDeepdive'
import StudentProfile from './pages/teacher/StudentProfile'
import { useTeacher } from './store/teacherStore'

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

/** Dashboard pages sit inside Shell (same sidebar as Content Shelf/Labs/Practice)
 *  but authenticate separately via teacherStore (a real per-teacher JWT, not the
 *  shared device token) -- this guard redirects to the teacher login until that
 *  second, independent login has happened. */
function DashboardGuard({ children }: { children: ReactNode }) {
  const teacherAuthed = useTeacher((s) => s.authed)
  if (!teacherAuthed) return <Navigate to="/dashboard/login" replace />
  return <>{children}</>
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
        <Route path="/labs" element={<Labs />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/dashboard/login" element={<TeacherLogin />} />
        <Route path="/dashboard" element={<DashboardGuard><DashboardOverview /></DashboardGuard>} />
        <Route
          path="/dashboard/section/:sectionId/chapter/:chapterId"
          element={<DashboardGuard><SectionDeepdive /></DashboardGuard>}
        />
        <Route path="/dashboard/student/:studentId" element={<DashboardGuard><StudentProfile /></DashboardGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
