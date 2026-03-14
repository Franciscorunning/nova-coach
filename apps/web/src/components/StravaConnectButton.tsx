import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { initiateStravaAuth, disconnectStrava } from '@/utils/stravaAuth';
import { getAthleteProfile } from '@/utils/stravaAPI';
import type { StravaAthlete } from '@/types/strava';
import Button from '@/components/Button';

interface StravaConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function StravaConnectButton({
  onConnect,
  onDisconnect,
}: StravaConnectButtonProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      void checkConnection();
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkConnection() {
    try {
      setChecking(true);
      const profile = await getAthleteProfile(user!.id);
      setAthlete(profile);
      setIsConnected(true);
      onConnect?.();
    } catch {
      setIsConnected(false);
      setAthlete(null);
    } finally {
      setChecking(false);
    }
  }

  async function handleConnect() {
    if (!user) return;
    setLoading(true);
    try {
      const authUrl = await initiateStravaAuth(user.id);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Strava auth', error);
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!user) return;
    try {
      await disconnectStrava(user.id);
      setIsConnected(false);
      setAthlete(null);
      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect Strava', error);
    }
  }

  if (checking) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" aria-label="Chargement…" />
    );
  }

  if (isConnected && athlete) {
    return (
      <div className="flex items-center gap-4 rounded-lg bg-orange-50 p-4">
        <img
          src={athlete.profile_medium}
          alt={athlete.firstname}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold">
            {athlete.firstname} {athlete.lastname}
          </p>
          <p className="text-sm text-gray-600">Connecté à Strava</p>
        </div>
        <Button variant="secondary" onClick={() => void handleDisconnect()}>
          Déconnecter
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => void handleConnect()}
      disabled={loading}
      variant="primary"
      className="flex items-center gap-2"
    >
      {/* Strava icon */}
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      {loading ? 'Connexion…' : 'Connecter avec Strava'}
    </Button>
  );
}
