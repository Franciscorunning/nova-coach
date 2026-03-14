// Strava OAuth integration utilities

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URI = `${import.meta.env.VITE_APP_URL}/settings?tab=integrations`;
const STRAVA_SCOPE = 'read,activity:read_all';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

/**
 * Generates the Strava OAuth authorization URL
 */
export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'force',
    scope: STRAVA_SCOPE,
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Formats distance from meters to kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Formats duration from seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Calculates pace in min/km from distance (meters) and duration (seconds)
 */
export function calculatePace(distanceMeters: number, durationSeconds: number): string {
  if (distanceMeters === 0) return '--:--';
  const paceSecPerKm = (durationSeconds / distanceMeters) * 1000;
  const paceMin = Math.floor(paceSecPerKm / 60);
  const paceSec = Math.round(paceSecPerKm % 60);
  return `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  sport_type: string;
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed: number;
}

/**
 * Fetches recent activities from Strava API
 * Note: Requires a valid access token from Supabase user profile
 */
export async function fetchStravaActivities(
  accessToken: string,
  perPage = 10
): Promise<StravaActivity[]> {
  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`);
  }

  return response.json() as Promise<StravaActivity[]>;
}
