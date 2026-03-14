-- NOVA COACH - Strava OAuth Secure Integration
-- Migration: 003_strava_oauth
-- Description: Add strava_auth_states table and missing Strava columns

-- ============================================================
-- ADD MISSING STRAVA COLUMNS TO users_profiles
-- ============================================================
ALTER TABLE users_profiles ADD COLUMN IF NOT EXISTS strava_connected_at TIMESTAMPTZ;
ALTER TABLE users_profiles ADD COLUMN IF NOT EXISTS strava_last_sync TIMESTAMPTZ;

-- ============================================================
-- STRAVA AUTH STATES (CSRF state tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS strava_auth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_strava_auth_states_state
  ON strava_auth_states(state);

CREATE INDEX IF NOT EXISTS idx_strava_auth_states_user_id
  ON strava_auth_states(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE strava_auth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auth states"
  ON strava_auth_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auth states"
  ON strava_auth_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auth states"
  ON strava_auth_states FOR UPDATE
  USING (auth.uid() = user_id);
