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
import StudentDashboardWeb from './pages/student/dashboard/StudentDashboard';
import StudentTestSpace from './pages/student/test/TestSpace';
import StudentScreeningPage from './pages/student/screening/ScreeningPage';
import RecommendationsPage from './pages/student/recommendations/RecommendationsPage';
import StudentAnalyticsPage from './pages/student/analytics/AnalyticsPage';
import UserProfilePage from './pages/student/profile/ProfilePage';
import CertificationPage from './pages/student/certification/CertificationPage';
import HelpSupportPage from './pages/student/help/HelpSupportPage';
import SchoolSettingsPage from './pages/settings/SchoolSettingsPage';
import InviteAcceptPage from './pages/onboarding/InviteAcceptPage';
import { AccessibilityToolbar } from './components/accessibility';
import './components/accessibility/accessibility.css';
import { initFirebase, onForegroundMessage } from './services/firebase';
import toast from 'react-hot-toast';

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
  const { token, user } = useAuthStore();

  let savedUser = null;
  try {
    const raw = localStorage.getItem('user_data') || localStorage.getItem('auth_user');
    if (raw && raw !== 'undefined' && raw !== 'null') savedUser = JSON.parse(raw);
  } catch { savedUser = null; }

  const savedToken = localStorage.getItem('auth_token');

  if ((!token && !savedToken) || (!user && !savedUser)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  // Initialize Firebase and listen for foreground push notifications
  useEffect(() => {
    try {
      initFirebase();
      onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'LD Schools';
        const body = payload.notification?.body || '';
        toast(
          `🔔 ${title}\n${body}`,
          { duration: 5000, icon: '🔔' }
        );
        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
          try { new Notification(title, { body, icon: '/icons/ld-icon-192.png' }); } catch {}
        }
      });
    } catch {}
  }, []);

  return (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: { borderRadius: '12px', fontWeight: 600 },
      }}
    />
    <AccessibilityToolbar />
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
  );
};

export default App;
