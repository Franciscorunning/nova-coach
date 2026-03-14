import { STRAVA_CONFIG } from '@/config/strava';
import { getValidAccessToken, refreshAccessToken } from '@/utils/stravaAuth';
import type { StravaActivity, StravaAthlete } from '@/types/strava';

async function stravaFetch<T>(
  userId: string,
  path: string,
  retry = true
): Promise<T> {
  const accessToken = await getValidAccessToken(userId);
  const response = await fetch(`${STRAVA_CONFIG.api_url}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401 && retry) {
    await refreshAccessToken(userId);
    return stravaFetch<T>(userId, path, false);
  }

  if (!response.ok) throw new Error(`Strava API error: ${response.statusText}`);
  return response.json() as Promise<T>;
}

/**
 * Get the authenticated athlete's profile.
 */
export async function getAthleteProfile(userId: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>(userId, '/athlete');
}

/**
 * Get recent activities for the authenticated athlete.
 */
export async function getAthleteActivities(
  userId: string,
  limit: number = 30
): Promise<StravaActivity[]> {
  return stravaFetch<StravaActivity[]>(userId, `/athlete/activities?per_page=${limit}`);
}

/**
 * Get full details for a single activity.
 */
export async function getActivityDetails(
  userId: string,
  activityId: number
): Promise<StravaActivity> {
  return stravaFetch<StravaActivity>(userId, `/activities/${activityId}`);
}
