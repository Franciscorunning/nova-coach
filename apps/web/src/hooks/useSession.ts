import { useEffect } from 'react';
import { useSessionsStore } from '@/stores/sessions';
import { useAuth } from './useAuth';

/**
 * Hook that provides session state and actions for the current user.
 */
export function useSessions() {
  const { user } = useAuth();
  const store = useSessionsStore();

  useEffect(() => {
    if (user?.id) {
      void store.fetchSessions(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const upcomingSessions = store.sessions.filter((s) => s.status === 'pending');
  const completedSessions = store.sessions.filter((s) => s.status === 'completed');
  const completionRate =
    store.sessions.length > 0
      ? Math.round((completedSessions.length / store.sessions.length) * 100)
      : 0;

  return {
    ...store,
    upcomingSessions,
    completedSessions,
    completionRate,
  };
}
