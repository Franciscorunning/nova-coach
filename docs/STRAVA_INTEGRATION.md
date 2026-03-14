# Strava Integration

## OAuth Flow

```
1. User clicks "Connect Strava" in Settings
2. Redirect to Strava OAuth: strava.com/oauth/authorize
3. User authorizes the app on Strava
4. Strava redirects to callback URL with ?code=xxx
5. Exchange code for access_token + refresh_token
6. Store tokens in users_profiles (encrypted at rest by Supabase)
7. Set strava_athlete_id in profile
```

## Webhook Flow

```
1. User completes a run on Strava
2. Strava sends POST to /functions/v1/strava-sync
3. Edge function verifies the event
4. Fetches activity details from Strava API
5. Finds matching pending session by date
6. Marks session as completed with actual stats
```

## Token Refresh

Strava access tokens expire after 6 hours. The refresh flow should be handled server-side (Edge Function) to avoid exposing the client secret.

## Scope

The app requests `read,activity:read_all` scope which allows:
- Reading the athlete's profile
- Reading all activities (private and public)
