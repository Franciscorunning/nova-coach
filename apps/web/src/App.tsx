import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TrainingPlansPage = lazy(() => import('@/pages/TrainingPlansPage'));
const SessionDetailPage = lazy(() => import('@/pages/SessionDetailPage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const NutritionPage = lazy(() => import('@/pages/NutritionPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/training" element={<TrainingPlansPage />} />
              <Route path="/training/session/:id" element={<SessionDetailPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
