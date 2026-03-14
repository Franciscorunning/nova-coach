-- NOVA COACH - Training Plans Seed Data
-- Migration: 002_training_plans_seed
-- Description: Seed sample training plans for all plan types

-- ============================================================
-- GALLOWAY METHOD - 12 weeks, 3 sessions/week
-- Run/walk intervals for beginners
-- ============================================================

-- Week 1
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('galloway', 1, 1, 'E1', 'Walk/Run Introduction', 30, 3000, 'Alternate 1 min running with 2 min walking. Focus on breathing and posture. This is your first session - take it easy!', 1, 1),
('galloway', 1, 2, 'E1', 'Easy Walk/Run', 30, 3000, 'Continue the 1:2 run/walk ratio. Notice your body''s response to running. Keep a conversational pace.', 1, 1),
('galloway', 1, 3, 'E2', 'Endurance Walk/Run', 35, 3500, 'Try extending run intervals to 90 seconds with 2 min walks. Total distance should feel comfortable.', 2, 2);

-- Week 2
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('galloway', 2, 1, 'E1', 'Building Base', 30, 3500, 'Run 2 minutes, walk 1 minute. Consistent effort throughout. End feeling like you could do more.', 2, 1),
('galloway', 2, 2, 'E1', 'Rhythm Run', 30, 3500, 'Focus on finding a rhythm with your run/walk intervals. Keep breathing relaxed.', 2, 1),
('galloway', 2, 3, 'E2', 'Longer Easy Run', 40, 4000, 'Extended session with 2:1 run/walk ratio. Hydrate well before and after.', 2, 2);

-- Week 3
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('galloway', 3, 1, 'E2', 'Continuous Running Test', 35, 4000, 'Try running for 5 minutes continuously, then walk 2 minutes. Repeat. This is a milestone!', 2, 2),
('galloway', 3, 2, 'MUSCU', 'Strength Training', 30, 0, 'Core and leg strengthening: 3x15 squats, 3x15 lunges, 2x30s plank, 3x15 calf raises. No running today.', 2, 1),
('galloway', 3, 3, 'E2', 'Weekend Long Run', 45, 5000, 'Longest session so far. Mix 3 min run / 1 min walk. Enjoy the distance, not the speed.', 2, 2);

-- Week 4 (Recovery week)
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('galloway', 4, 1, 'E1', 'Recovery Run', 25, 2500, 'Easy recovery run. This is a lighter week to let your body adapt. Run/walk freely.', 1, 1),
('galloway', 4, 2, 'REPOS', 'Active Rest', 20, 0, 'Light stretching and mobility work. 10 min walk, then hip flexor stretches, calf stretches.', 1, 1),
('galloway', 4, 3, 'E1', 'Light Run', 30, 3000, 'Keep it easy. Focus on form and breathing. A short, pleasant run.', 1, 1);

-- ============================================================
-- 15KM PROGRAM - 16 weeks, 3 sessions/week  
-- Progressive build to 15km continuous
-- ============================================================

-- Week 1
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('15km', 1, 1, 'E1', 'Base Building Run', 30, 4000, 'Easy run at conversational pace. You should be able to speak full sentences. Build the aerobic base.', 2, 1),
('15km', 1, 2, 'E2', 'Tempo Introduction', 35, 5000, 'Mostly easy with 2x5 minute moderate-effort segments. This introduces tempo work.', 2, 2),
('15km', 1, 3, 'E1', 'Long Slow Run', 50, 7000, 'Your weekly long run. Easy pace throughout. Walk if needed. This is key for building endurance.', 2, 2);

-- Week 2
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('15km', 2, 1, 'E1', 'Easy Run', 30, 4500, 'Comfortable easy run. Maintain good form: tall posture, relaxed arms, light footstrike.', 2, 1),
('15km', 2, 2, 'E3', 'Interval Training', 40, 5500, '5 min warm-up, then 4x3 min at harder effort with 2 min easy recovery, 5 min cool-down.', 3, 2),
('15km', 2, 3, 'E1', 'Long Run', 55, 8000, 'Progressive long run. Start easy, finish comfortably tired but not exhausted.', 2, 2);

-- Week 3
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('15km', 3, 1, 'E2', 'Moderate Run', 35, 5000, 'Slightly more effort than easy pace. A comfortable challenge.', 2, 2),
('15km', 3, 2, 'MUSCU', 'Cross-training & Strength', 40, 0, 'Strength focus: hip stability work, single-leg exercises, core training. Improves running economy.', 2, 2),
('15km', 3, 3, 'E1', 'Long Run', 65, 9000, 'Longest run so far. Fuel with a snack 30 min before. Hydrate during.', 2, 3);

-- Week 4 (Recovery)
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('15km', 4, 1, 'E1', 'Recovery Run', 25, 3500, 'Very easy recovery run. This week is shorter to let adaptations happen.', 1, 1),
('15km', 4, 2, 'E1', 'Easy Run', 30, 4000, 'Easy and enjoyable. Focus on running form and relaxation.', 1, 1),
('15km', 4, 3, 'E1', 'Moderate Long Run', 45, 6000, 'Shorter long run this week. Keep it easy.', 2, 2);

-- ============================================================
-- SEMI-MARATHON PROGRAM - 20 weeks, 3-4 sessions/week
-- Build to 21.1km
-- ============================================================

-- Week 1
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('semi', 1, 1, 'E1', 'Aerobic Foundation', 35, 5000, 'Easy aerobic run. Heart rate should stay in zone 2 (60-70% max HR). Builds the engine.', 2, 1),
('semi', 1, 2, 'E3', 'Threshold Run', 40, 6000, '10 min easy warm-up, 20 min at threshold pace (comfortably hard), 10 min cool-down.', 3, 2),
('semi', 1, 3, 'E1', 'Long Slow Distance', 70, 10000, 'The cornerstone of half-marathon training. Easy pace, focus on time on feet.', 2, 3);

-- Week 2
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('semi', 2, 1, 'E1', 'Easy Recovery Run', 35, 5000, 'Active recovery. Loose, easy running to flush out fatigue from long run.', 1, 1),
('semi', 2, 2, 'E4', 'Speed Work', 45, 7000, '10 min warm-up, 6x1 min fast with 2 min recovery jog, 10 min cool-down. Builds speed.', 4, 2),
('semi', 2, 3, 'E1', 'Medium Long Run', 60, 9000, 'Mid-week longer effort. Builds weekly volume progressively.', 2, 2);

-- Week 3
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('semi', 3, 1, 'E2', 'Steady State Run', 40, 6000, 'Comfortable effort, slightly above easy pace. Aerobic development run.', 2, 2),
('semi', 3, 2, 'MUSCU', 'Running Strength Circuit', 45, 0, 'Running-specific strength: hip hinges, single-leg squats, plyometrics, core. Injury prevention focus.', 3, 2),
('semi', 3, 3, 'E1', 'Long Run', 80, 12000, 'Progressive long run. Cover the distance comfortably. Nutrition practice: gel or snack at 45 min.', 2, 3);

-- Week 4 (Recovery)
INSERT INTO training_plans (plan_type, week_number, session_number, session_type, title, duration_minutes, distance_meters, description, intensity_level, pile_count) VALUES
('semi', 4, 1, 'E1', 'Easy Run', 30, 4500, 'Recovery week easy run. Embrace the rest - it''s when you get stronger.', 1, 1),
('semi', 4, 2, 'E2', 'Moderate Run', 35, 5000, 'Light moderate effort. Enjoy the reduced load.', 2, 2),
('semi', 4, 3, 'E1', 'Shorter Long Run', 55, 8000, 'Recovery long run. Easy pace, reduced distance.', 2, 2);
