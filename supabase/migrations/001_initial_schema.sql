-- NOVA COACH - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Create all tables, indexes, and RLS policies

-- ============================================================
-- USERS PROFILES
-- Extends Supabase auth.users with app-specific data
-- ============================================================
CREATE TABLE users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  weight DECIMAL(4,1) NOT NULL,
  target_plan TEXT CHECK(target_plan IN ('galloway', '15km', 'semi')),
  current_level INTEGER DEFAULT 1,
  subscription_status TEXT DEFAULT 'free' CHECK(subscription_status IN ('free', 'premium')),
  stripe_customer_id TEXT UNIQUE,
  strava_athlete_id BIGINT UNIQUE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_profiles_updated_at
  BEFORE UPDATE ON users_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRAINING PLANS (static reference data)
-- ============================================================
CREATE TABLE training_plans (
  id SERIAL PRIMARY KEY,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('galloway', '15km', 'semi')),
  week_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  session_type TEXT CHECK(session_type IN ('E1', 'E2', 'E3', 'E4', 'MUSCU', 'REPOS')),
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  distance_meters INTEGER,
  description TEXT NOT NULL,
  intensity_level INTEGER CHECK(intensity_level BETWEEN 1 AND 5),
  pile_count INTEGER CHECK(pile_count IN (1, 2, 3)),
  UNIQUE(plan_type, week_number, session_number)
);

-- ============================================================
-- USER SESSIONS (assigned training instances)
-- ============================================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_profiles(id) ON DELETE CASCADE,
  plan_session_id INTEGER REFERENCES training_plans(id),
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'skipped', 'failed')),
  completed_at TIMESTAMPTZ,
  strava_activity_id BIGINT UNIQUE,
  actual_duration_seconds INTEGER,
  actual_distance_meters DECIMAL(8,2),
  user_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_session_id, scheduled_date)
);

-- ============================================================
-- NUTRITION LOGS
-- ============================================================
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pile_count INTEGER NOT NULL CHECK(pile_count IN (1, 2, 3)),
  meals JSONB NOT NULL DEFAULT '[]',
  hydration_reminder BOOLEAN DEFAULT FALSE,
  supplements_taken JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN DASHBOARD STATS (materialized for performance)
-- ============================================================
CREATE TABLE admin_dashboard_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_users INTEGER,
  active_users INTEGER,
  mrr DECIMAL(10,2),
  completion_rate DECIMAL(5,2),
  top_strava_records JSONB,
  refreshed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_user_sessions_user_date ON user_sessions(user_id, scheduled_date);
CREATE INDEX idx_user_sessions_strava ON user_sessions(strava_activity_id) WHERE strava_activity_id IS NOT NULL;
CREATE INDEX idx_nutrition_user_date ON nutrition_logs(user_id, date);
CREATE INDEX idx_users_profiles_strava ON users_profiles(strava_athlete_id) WHERE strava_athlete_id IS NOT NULL;
CREATE INDEX idx_users_profiles_stripe ON users_profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- users_profiles policies
CREATE POLICY "Users can view own profile"
  ON users_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- user_sessions policies
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- nutrition_logs policies
CREATE POLICY "Users can view own nutrition logs"
  ON nutrition_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create nutrition logs"
  ON nutrition_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
  ON nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- training_plans is publicly readable (static reference data)
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training plans are publicly readable"
  ON training_plans FOR SELECT
  USING (true);
