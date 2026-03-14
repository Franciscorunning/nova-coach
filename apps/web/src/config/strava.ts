export const STRAVA_CONFIG = {
  client_id: import.meta.env.VITE_STRAVA_CLIENT_ID || '',
  redirect_uri: `${import.meta.env.VITE_APP_URL}/auth/strava/callback`,
  scope: 'read,activity:read_all',
  oauth_url: 'https://www.strava.com/oauth/authorize',
  token_url: 'https://www.strava.com/oauth/token',
  api_url: 'https://www.strava.com/api/v3',
} as const;

export function validateStravaConfig(): void {
  if (!STRAVA_CONFIG.client_id) throw new Error('VITE_STRAVA_CLIENT_ID not set');
  if (!STRAVA_CONFIG.redirect_uri) throw new Error('VITE_APP_URL not set');
}
