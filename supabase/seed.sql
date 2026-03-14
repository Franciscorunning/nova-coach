-- NOVA COACH - Development Seed Data
-- This file is used for local development only

-- Insert a test user profile (assumes test user exists in auth.users)
-- To use: create a user via Supabase Auth, then update the UUID below
-- INSERT INTO users_profiles (id, weight, target_plan, current_level, subscription_status)
-- VALUES ('your-test-user-uuid-here', 75.5, 'galloway', 1, 'premium');

-- Sample admin stats for testing the admin dashboard
INSERT INTO admin_dashboard_stats (date, total_users, active_users, mrr, completion_rate, top_strava_records)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 45, 12, 250.00, 72.5, '[]'),
  (CURRENT_DATE - INTERVAL '5 days', 48, 15, 275.00, 68.3, '[]'),
  (CURRENT_DATE - INTERVAL '4 days', 52, 18, 300.00, 71.2, '[]'),
  (CURRENT_DATE - INTERVAL '3 days', 55, 20, 325.00, 74.8, '[]'),
  (CURRENT_DATE - INTERVAL '2 days', 58, 22, 350.00, 76.1, '[]'),
  (CURRENT_DATE - INTERVAL '1 day', 61, 25, 375.00, 78.4, '[]'),
  (CURRENT_DATE, 63, 27, 399.00, 80.0, '[]')
ON CONFLICT (date) DO NOTHING;
