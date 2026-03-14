import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleStravaCallback } from '@/utils/stravaAuth';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Handles the Strava OAuth callback redirect.
 * Validates the CSRF state token, exchanges the code for tokens,
 * and redirects the user to the Settings page.
 */
export default function StravaCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (isLoading || handledRef.current) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      navigate('/settings?strava=error', { replace: true });
      return;
    }

    if (!code || !state) {
      navigate('/settings?strava=error', { replace: true });
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    handledRef.current = true;

    handleStravaCallback(code, state, user.id)
      .then(() => navigate('/settings?strava=connected', { replace: true }))
      .catch((err: unknown) => {
        console.error('Strava callback error:', err);
        navigate('/settings?strava=error', { replace: true });
      });
  }, [searchParams, navigate, user, isLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Connexion à Strava en cours…</p>
      </div>
    </div>
  );
}
