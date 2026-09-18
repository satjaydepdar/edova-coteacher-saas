import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import Shell from './components/Shell'
import Lessons from './pages/Lessons'
import ModuleDetail from './pages/ModuleDetail'
import Practice from './pages/Practice'
import Labs from './pages/Labs'
import AdminShell from './pages/admin/AdminShell'
import AdminContent from './pages/admin/AdminContent'
import AdminSubject from './pages/admin/AdminSubject'
import AdminSchools from './pages/admin/AdminSchools'
import AdminUsers from './pages/admin/AdminUsers'
import AdminLlmProviders from './pages/admin/AdminLlmProviders'
import DashboardOverview from './pages/teacher/DashboardOverview'
import SectionDeepdive from './pages/teacher/SectionDeepdive'
import StudentProfile from './pages/teacher/StudentProfile'
import CalendarPage from './pages/teacher/CalendarPage'
import SyllabusPage from './pages/teacher/SyllabusPage'
import LessonPlannerPage from './pages/teacher/LessonPlannerPage'
import AssignmentTrackerPage from './pages/teacher/AssignmentTrackerPage'
import AssessmentBuilderPage from './pages/teacher/AssessmentBuilderPage'
import LearningResourcesPage from './pages/teacher/LearningResourcesPage'
import AttendancePage from './pages/teacher/AttendancePage'
import LearningHubPage from './pages/student/LearningHubPage'
import MyAssignmentsPage from './pages/student/MyAssignmentsPage'
import StudentWikiPage from './pages/student/StudentWikiPage'
import StudentResourcesPage from './pages/student/StudentResourcesPage'
import Settings from './pages/Settings'

export default function App() {
  const { authed, user, init } = useAuthStore()

  useEffect(() => {
    void init()
  }, [init])

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const homePath = user?.role === 'STUDENT' ? '/learning' : '/dashboard'

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={homePath} replace />} />
      <Route path="/cms" element={user?.role === 'ADMIN' ? <AdminShell /> : <Navigate to="/dashboard" replace />}>
        <Route index element={<Navigate to="/cms/content" replace />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="content/:subjectId" element={<AdminSubject />} />
        <Route path="schools" element={<AdminSchools />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="llm-providers" element={<AdminLlmProviders />} />
      </Route>
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/syllabus" element={<SyllabusPage />} />
        <Route path="/lesson-planner" element={<LessonPlannerPage />} />
        <Route path="/assignments" element={<AssignmentTrackerPage />} />
        <Route path="/assessment-builder" element={<AssessmentBuilderPage />} />
        <Route path="/resources" element={<LearningResourcesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/module/:moduleId" element={<ModuleDetail />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route
          path="/dashboard/section/:sectionId/chapter/:chapterId"
          element={<SectionDeepdive />}
        />
        <Route path="/dashboard/student/:studentId" element={<StudentProfile />} />
        <Route path="/learning" element={<LearningHubPage />} />
        <Route path="/my-assignments" element={<MyAssignmentsPage />} />
        <Route path="/wiki" element={<StudentWikiPage />} />
        <Route path="/my-resources" element={<StudentResourcesPage />} />
      </Route>
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  )
}
