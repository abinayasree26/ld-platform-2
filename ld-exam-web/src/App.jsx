import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './services/authStore';
import { authAPI } from './services/api';

import LoginPage from './pages/auth/LoginPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClassDetailPage from './pages/dashboard/ClassDetailPage';
import StudentDetailPage from './pages/dashboard/StudentDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCMS from './pages/admin/AdminCMS';
import AdminSchoolPage from './pages/admin/AdminSchoolPage';
import AdminStudents from './pages/admin/AdminStudents';
import AdminScreening from './pages/admin/AdminScreening';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminBilling from './pages/admin/AdminBilling';
import AdminChats from './pages/admin/AdminChats';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import StudentInvitePage from './pages/auth/StudentInvitePage';
import ParentScorecard from './pages/parent/ParentScorecard';
import MessagingPage from './pages/messages/MessagingPage';
import StudentDashboardWeb from './pages/student/StudentDashboardWeb';
import StudentTestSpace from './pages/student/StudentTestSpace';
import StudentScreeningPage from './pages/student/StudentScreeningPage';
import PracticePage from './pages/student/PracticePage';
import RecommendationsPage from './pages/student/RecommendationsPage';
import StudentAnalyticsPage from './pages/student/StudentAnalyticsPage';
import UserProfilePage from './pages/student/UserProfilePage';
import CertificationPage from './pages/student/CertificationPage';
import HelpSupportPage from './pages/student/HelpSupportPage';
import SchoolSettingsPage from './pages/settings/SchoolSettingsPage';
import InviteAcceptPage from './pages/onboarding/InviteAcceptPage';

// Extra profile fields shown for demo accounts (currently just the student profile module)
const DEMO_PROFILE_EXTRAS = {
  student: {
    email: 'demo.student@ldsupport.in',
    phone: '+91 98765 43210',
    class: 'Class 5 - A',
    school: 'Sunrise Public School',
    board: 'CBSE',
    subscription: 'advanced',
  },
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, setDemoAuth } = useAuthStore();
  const role = allowedRoles?.[0] || 'teacher';
  const wrongRole = allowedRoles && user?.role && !allowedRoles.includes(user.role);

  // No login screen for local/demo use — auto-provision (or switch to) a demo
  // account for the module being opened, so every module is just a click away.
  useEffect(() => {
    if (!token || wrongRole) {
      const fallbackUser = {
        id: `demo-${role}`,
        name: `Demo ${role.charAt(0).toUpperCase()}${role.slice(1)}`,
        role,
        school_id: 'demo-school',
        ...DEMO_PROFILE_EXTRAS[role],
      };
      // Get a real JWT from the backend so authenticated API calls actually succeed
      // instead of 401ing; fall back to a local-only identity if it's unreachable.
      authAPI.demo(role)
        .then((result) => setDemoAuth({ ...fallbackUser, ...result.user }, result.token))
        .catch(() => setDemoAuth(fallbackUser, 'demo-token'));
    }
  }, [token, wrongRole, role]);

  if (!token || wrongRole) return null;
  // Redirect teachers with no school to onboarding (except if already there)
  if (allowedRoles?.includes('teacher') && user?.role === 'teacher' && !user?.school_id) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: { borderRadius: '12px', fontWeight: 600 },
      }}
    />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route path="/student-invite/:token" element={<StudentInvitePage />} />

      {/* Teacher onboarding — shown when no school_id yet */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'student']}>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:classId"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <ClassDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:studentId"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <SchoolSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'parent']}>
            <MessagingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cms"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCMS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/screening"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminScreening />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBilling />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/chats"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:schoolId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSchoolPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentScorecard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardWeb />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/screening"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentScreeningPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <PracticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/recommendations"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <RecommendationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/analytics"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/tests"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentTestSpace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile/payment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/certification"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CertificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/certification/:certKey"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CertificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/help"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <HelpSupportPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
