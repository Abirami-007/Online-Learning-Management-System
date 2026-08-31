import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CourseProgressProvider } from './context/CourseProgressContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import DashboardPage from './pages/DashboardPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import CertificatesPage from './pages/CertificatesPage';
import NotificationsPage from './pages/NotificationsPage';
import DiscussionsPage from './pages/DiscussionsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <CourseProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/catalog" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />

              {/* Protected: any authenticated user */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/learn/:courseId" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
              <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
              <Route path="/assessments/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/discussions" element={<ProtectedRoute><DiscussionsPage /></ProtectedRoute>} />

              {/* Protected: INSTRUCTOR and ADMIN only */}
              <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><AdminCoursesPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CourseProgressProvider>
    </AuthProvider>
  );
}
