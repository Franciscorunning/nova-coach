import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Hook that provides auth state and actions.
 * Initializes the auth listener on first use.
 */
export function useAuth() {
  const { user, session, profile, isLoading, error, initialize, login, loginWithGoogle, loginWithStrava, register, logout, updateProfile, clearError } = useAuthStore();

  useEffect(() => {
    // Initialize auth state and listener
    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    session,
    profile,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    loginWithStrava,
    register,
    logout,
    updateProfile,
    clearError,
  };
}
