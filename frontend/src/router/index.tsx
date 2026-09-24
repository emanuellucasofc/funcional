import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/LoginPage'
import Dashboard from '../pages/Dashboard'
import StudentsPage from '../pages/StudentsPage'
import StudentFormPage from '../pages/StudentFormPage'
import StudentProfilePage from '../pages/StudentProfilePage'
import ClassesPage from '../pages/ClassesPage'
import AttendancePage from '../pages/AttendancePage'
import AlertsPage from '../pages/AlertsPage'
import ReportsPage from '../pages/ReportsPage'
import SettingsPage from '../pages/SettingsPage'
import CalendarPage from '../pages/CalendarPage'
import UsersPage from '../pages/UsersPage'

import FrequencyPage from '../pages/FrequencyPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'alunos', element: <StudentsPage /> },
      { path: 'alunos/novo', element: <StudentFormPage /> },
      { path: 'alunos/:id', element: <StudentProfilePage /> },
      { path: 'alunos/:id/editar', element: <StudentFormPage /> },
      { path: 'turmas', element: <ClassesPage /> },
      { path: 'chamada', element: <AttendancePage /> },
      { path: 'alertas', element: <AlertsPage /> },
      { path: 'relatorios', element: <ReportsPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: 'usuarios', element: <UsersPage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'frequencia', element: <FrequencyPage /> },
    ],
  },
])
