import { STRAVA_CONFIG, validateStravaConfig } from '@/config/strava';
import { encrypt, decrypt, generateSecureToken } from '@/utils/crypto';
import type { StravaTokens } from '@/types/strava';
import { supabase } from '@/utils/supabase';

validateStravaConfig();

/**
 * Initiate Strava OAuth flow.
 * Stores a CSRF state token in the database and returns the OAuth authorization URL.
 */
export async function initiateStravaAuth(userId: string): Promise<string> {
  const state = generateSecureToken();

  await supabase.from('strava_auth_states').insert({
    user_id: userId,
    state,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  const params = new URLSearchParams({
    client_id: STRAVA_CONFIG.client_id,
    redirect_uri: STRAVA_CONFIG.redirect_uri,
    response_type: 'code',
    scope: STRAVA_CONFIG.scope,
    state,
  });

  return `${STRAVA_CONFIG.oauth_url}?${params.toString()}`;
}

/**
 * Validate OAuth CSRF state token.
 * Returns the user_id associated with the state token.
 * Marks the token as used to prevent replay attacks.
 */
export async function validateAuthState(state: string): Promise<string> {
  const { data, error } = await supabase
    .from('strava_auth_states')
    .select('user_id, expires_at, used')
    .eq('state', state)
    .single();

  if (error || !data) throw new Error('Invalid state token');
  if (data.used) throw new Error('State token already used');
  if (new Date(data.expires_at as string) < new Date()) throw new Error('State token expired');

  await supabase.from('strava_auth_states').update({ used: true }).eq('state', state);

  return data.user_id as string;
}

/**
 * Exchange an OAuth authorization code for Strava tokens.
 *
 * NOTE: In production this exchange should be performed server-side (e.g. via a
 * Supabase Edge Function) to avoid exposing the client secret in the browser.
 */
export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET || '';
  const response = await fetch(STRAVA_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CONFIG.client_id,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) throw new Error('Failed to exchange code for tokens');
  return response.json() as Promise<StravaTokens>;
}

/**
 * Handle Strava OAuth callback.
 * Validates the state token, exchanges the code for tokens, encrypts them,
 * and persists them to the user's profile.
 */
export async function handleStravaCallback(
  code: string,
  state: string,
  userId?: string
): Promise<void> {
  const resolvedUserId = userId ?? (await validateAuthState(state));
  const tokens = await exchangeCodeForTokens(code);

  const [encryptedAccessToken, encryptedRefreshToken] = await Promise.all([
    encrypt(tokens.access_token),
    encrypt(tokens.refresh_token),
  ]);

  const { error } = await supabase
    .from('users_profiles')
    .update({
      strava_athlete_id: tokens.athlete.id,
      strava_access_token: encryptedAccessToken,
      strava_refresh_token: encryptedRefreshToken,
      strava_connected_at: new Date().toISOString(),
      strava_last_sync: new Date().toISOString(),
    })
    .eq('id', resolvedUserId);

  if (error) throw new Error('Failed to save Strava tokens');
}

/**
 * Refresh an expired Strava access token.
 * Persists the new encrypted tokens to the database.
 * Returns the new plaintext access token.
 */
export async function refreshAccessToken(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users_profiles')
    .select('strava_refresh_token')
    .eq('id', userId)
    .single();

  if (error || !data?.strava_refresh_token)
    throw new Error('No refresh token found');

  const refreshToken = await decrypt(data.strava_refresh_token as string);
  const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET || '';
  const response = await fetch(STRAVA_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CONFIG.client_id,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) throw new Error('Failed to refresh Strava access token');
  const newTokens = (await response.json()) as StravaTokens;

  const [encryptedAccessToken, encryptedRefreshToken] = await Promise.all([
    encrypt(newTokens.access_token),
    encrypt(newTokens.refresh_token),
  ]);

  await supabase
    .from('users_profiles')
    .update({
      strava_access_token: encryptedAccessToken,
      strava_refresh_token: encryptedRefreshToken,
    })
    .eq('id', userId);

  return newTokens.access_token;
}

/**
 * Retrieve the current valid access token for a user.
 * Returns the decrypted plaintext access token.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users_profiles')
    .select('strava_access_token')
    .eq('id', userId)
    .single();

  if (error || !data?.strava_access_token)
    throw new Error('No Strava connection found');

  return decrypt(data.strava_access_token as string);
}

/**
 * Disconnect Strava from a user's profile, clearing all stored tokens.
 */
export async function disconnectStrava(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users_profiles')
    .update({
      strava_athlete_id: null,
      strava_access_token: null,
      strava_refresh_token: null,
      strava_connected_at: null,
      strava_last_sync: null,
    })
    .eq('id', userId);

  if (error) throw new Error('Failed to disconnect Strava');
}
