import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protects routes requiring authentication.
 * Redirects to /login if not authenticated.
 */
export default function AuthGuard() {
  const { user, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
