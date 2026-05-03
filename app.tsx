// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingScreen } from './components/common/LoadingScreen';
import { PrivateRoute } from './components/common/PrivateRoute';

// Lazy-loaded pages
const LoginPage        = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage     = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPassword   = React.lazy(() => import('./pages/auth/ForgotPassword'));
const DashboardPage    = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const MeetingsPage     = React.lazy(() => import('./pages/meetings/MeetingsPage'));
const MeetingCreate    = React.lazy(() => import('./pages/meetings/MeetingCreate'));
const MeetingDetail    = React.lazy(() => import('./pages/meetings/MeetingDetail'));
const MeetingLive      = React.lazy(() => import('./pages/meetings/MeetingLive'));
const ReportsPage      = React.lazy(() => import('./pages/reports/ReportsPage'));
const UsersPage        = React.lazy(() => import('./pages/users/UsersPage'));
const UserDetail       = React.lazy(() => import('./pages/users/UserDetail'));
const ProfilePage      = React.lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage     = React.lazy(() => import('./pages/settings/SettingsPage'));
const AttendancePage   = React.lazy(() => import('./pages/attendance/AttendancePage'));
const QRGeneratorPage  = React.lazy(() => import('./pages/qr/QRGeneratorPage'));
const NotFoundPage     = React.lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route path="/" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="meetings">
                <Route index             element={<MeetingsPage />} />
                <Route path="new"        element={<MeetingCreate />} />
                <Route path=":id"        element={<MeetingDetail />} />
                <Route path=":id/live"   element={<MeetingLive />} />
                <Route path=":id/qr"     element={<QRGeneratorPage />} />
              </Route>
              <Route path="attendance"  element={<AttendancePage />} />
              <Route path="reports"     element={<ReportsPage />} />
              <Route path="users">
                <Route index             element={<UsersPage />} />
                <Route path=":id"        element={<UserDetail />} />
              </Route>
              <Route path="profile"     element={<ProfilePage />} />
              <Route path="settings"    element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#e2e8f0',
            border: '1px solid #2d3748',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
