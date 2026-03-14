# NOVA COACH - Database Schema

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) enforced on all user tables.

## Tables

### `users_profiles`
Extends Supabase's `auth.users` with application-specific data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references auth.users |
| `weight` | DECIMAL(4,1) | User weight in kg |
| `target_plan` | TEXT | Selected training plan (galloway/15km/semi) |
| `current_level` | INTEGER | Current progression level |
| `subscription_status` | TEXT | free or premium |
| `stripe_customer_id` | TEXT | Stripe customer ID (unique) |
| `strava_athlete_id` | BIGINT | Strava athlete ID (unique) |
| `strava_access_token` | TEXT | Strava OAuth access token |
| `strava_refresh_token` | TEXT | Strava OAuth refresh token |
| `preferences` | JSONB | User preferences (JSON) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

### `training_plans`
Static reference table for all training plan sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `plan_type` | TEXT | Plan type (galloway/15km/semi) |
| `week_number` | INTEGER | Week in the training program |
| `session_number` | INTEGER | Session within the week |
| `session_type` | TEXT | Session type (E1-E4/MUSCU/REPOS) |
| `title` | TEXT | Session title |
| `duration_minutes` | INTEGER | Planned duration |
| `distance_meters` | INTEGER | Planned distance |
| `description` | TEXT | Full session description |
| `intensity_level` | INTEGER | Effort level 1-5 |
| `pile_count` | INTEGER | Nutrition pile recommendation (1-3) |

### `user_sessions`
Assigned instances of training plan sessions for specific users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users_profiles.id |
| `plan_session_id` | INTEGER | References training_plans.id |
| `scheduled_date` | DATE | Planned session date |
| `status` | TEXT | pending/completed/skipped/failed |
| `completed_at` | TIMESTAMPTZ | Completion timestamp |
| `strava_activity_id` | BIGINT | Linked Strava activity (unique) |
| `actual_duration_seconds` | INTEGER | Actual duration |
| `actual_distance_meters` | DECIMAL(8,2) | Actual distance |
| `user_feedback` | JSONB | {difficulty, notes, felt_good} |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### `nutrition_logs`
Daily nutrition tracking records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users_profiles.id |
| `date` | DATE | Log date |
| `pile_count` | INTEGER | Energy pile (1=light, 2=moderate, 3=high) |
| `meals` | JSONB | Array of meal records |
| `hydration_reminder` | BOOLEAN | Whether hydration reminder is set |
| `supplements_taken` | JSONB | Optional supplements log |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### `admin_dashboard_stats`
Aggregated admin metrics (updated daily).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `date` | DATE | Stats date (unique) |
| `total_users` | INTEGER | Total registered users |
| `active_users` | INTEGER | Users active in last 7 days |
| `mrr` | DECIMAL(10,2) | Monthly Recurring Revenue |
| `completion_rate` | DECIMAL(5,2) | Session completion percentage |
| `top_strava_records` | JSONB | Top performance records |
| `refreshed_at` | TIMESTAMPTZ | Last refresh timestamp |

## Row Level Security

All user-facing tables have RLS enabled:

- **users_profiles**: Users can only read and update their own profile
- **user_sessions**: Users can only read, create, and update their own sessions
- **nutrition_logs**: Users can only read, create, and update their own logs
- **training_plans**: Publicly readable (no user data, static reference)

## Indexes

```sql
-- Fast session lookup by user and date
CREATE INDEX idx_user_sessions_user_date ON user_sessions(user_id, scheduled_date);

-- Strava activity lookup (sparse index)
CREATE INDEX idx_user_sessions_strava ON user_sessions(strava_activity_id) WHERE strava_activity_id IS NOT NULL;

-- Nutrition lookup by user and date
CREATE INDEX idx_nutrition_user_date ON nutrition_logs(user_id, date);
```
