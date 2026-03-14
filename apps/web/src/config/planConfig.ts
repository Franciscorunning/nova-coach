/**
 * planConfig.ts
 *
 * Structural configuration for each training plan type.
 * The validator uses these constraints to verify that imported plan data
 * matches the expected shape (week count, session count, max durations, etc.).
 */

import type { PlanConfig } from '../types/trainingPlans.js';

export const PLAN_CONFIG: PlanConfig = {
  /**
   * GALLOWAY – Finish your first 5 km (12 weeks)
   * Walk/run intervals that gradually shift to continuous running.
   * All sessions are done in Zone 1–2 (very easy effort).
   */
  galloway: {
    plan_type: 'galloway',
    sessions_per_week: 3,
    walk_run_pattern: true,
    total_weeks: 12,
    target_distance: 5000,
  },

  /**
   * CONSOLIDATION 5 KM (12 weeks = 3 cycles of 4 weeks)
   * Cycle 1 – Vitesse    : short fast repetitions (30 s – 1'30)
   * Cycle 2 – Résistance : longer intervals (2–4 min at 5 km pace)
   * Cycle 3 – Spécifique : race-specific preparation (3–7 min at target pace)
   */
  '5km': {
    plan_type: '5km',
    cycles: 3,
    sessions_per_week: 3,
    total_weeks: 12,
    target_distance: 5000,
    max_duration_e3_minutes: 40,
  },

  /**
   * CONSOLIDATION 10 KM (12 weeks = 3 cycles of 4 weeks)
   * Cycle 1 – Vitesse    : 8 × 40 s to 8 × 1'30 fast
   * Cycle 2 – Résistance : 5–6 × 2–4 min at 10 km / I-pace
   * Cycle 3 – Spécifique : 3–6 × 3–8 min at 10 km pace
   * Long run grows from 40 min to 70 min.
   */
  '10km': {
    plan_type: '10km',
    cycles: 3,
    sessions_per_week: 3,
    total_weeks: 12,
    target_distance: 10000,
    max_duration_e3_minutes: 70,
  },

  /**
   * CONSOLIDATION 15 KM (12 weeks = 3 cycles of 4 weeks)
   * Cycle 1 – Vitesse    : 10 × 1 min to 6 × 2 min fast
   * Cycle 2 – Résistance : 5 × 3–5 min at 15 km / I-pace
   * Cycle 3 – Spécifique : 3–6 × 3–10 min at 15 km pace
   * Long run grows from 50 min to 90 min.
   */
  '15km': {
    plan_type: '15km',
    cycles: 3,
    sessions_per_week: 3,
    total_weeks: 12,
    target_distance: 15000,
    max_duration_e3_minutes: 90,
  },

  /**
   * SEMI-MARATHON (12 weeks = 3 cycles of 4 weeks)
   * Cycle 1 – Vitesse    : 6–8 × 1'30–2 min fast
   * Cycle 2 – Résistance : 4 × 5–8 min at 15 km / I-pace
   * Cycle 3 – Spécifique : 3–4 × 6–10 min at semi pace
   * Long run grows from 50 min to 100 min.
   * Sessions per week: 3 throughout (can be extended to 4 for advanced runners).
   */
  semi: {
    plan_type: 'semi',
    cycles: 3,
    sessions_per_week: [
      { weeks: [1, 2, 3, 4], count: 3 },
      { weeks: [5, 6, 7, 8, 9, 10, 11, 12], count: 3 },
    ],
    total_weeks: 12,
    target_distance: 21097,
    max_duration_e3_minutes: 100,
  },
} as const;
