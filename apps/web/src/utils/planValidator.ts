/**
 * planValidator.ts
 *
 * Validates the structural integrity of a TrainingPlan object against the
 * expected configuration defined in PLAN_CONFIG.
 *
 * Usage:
 *   const result = validatePlanIntegrity(plan);
 *   if (!result.valid) console.error(result.errors);
 */

import { PLAN_CONFIG } from '../config/planConfig.js';
import type {
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  ValidationResult,
  SessionsPerWeekEntry,
} from '../types/trainingPlans.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the expected session count for a given 1-based week number. */
function expectedSessionCount(
  sessionsPerWeek: TrainingPlan['sessions_per_week'],
  weekNumber: number,
): number {
  if (typeof sessionsPerWeek === 'number') {
    return sessionsPerWeek;
  }

  const entry = (sessionsPerWeek as readonly SessionsPerWeekEntry[]).find(
    (e) => (e.weeks as readonly number[]).includes(weekNumber),
  );

  // If the week isn't explicitly listed, fall back to the last entry's count.
  if (entry !== undefined) {
    return entry.count;
  }

  const last = (sessionsPerWeek as readonly SessionsPerWeekEntry[]).at(-1);
  return last?.count ?? 3;
}

// ---------------------------------------------------------------------------
// Session-level checks
// ---------------------------------------------------------------------------

function validateSession(
  session: TrainingSession,
  weekNumber: number,
  maxE3Minutes: number | undefined,
  errors: string[],
): void {
  const prefix = `Week ${weekNumber}, session ${session.session_number}`;

  // Intensity must be 1–5
  if (session.intensity_level < 1 || session.intensity_level > 5) {
    errors.push(
      `${prefix}: intensity_level ${session.intensity_level} is out of range [1, 5]`,
    );
  }

  // pile_count must be 1–3
  if (session.pile_count < 1 || session.pile_count > 3) {
    errors.push(
      `${prefix}: pile_count ${session.pile_count} is out of range [1, 3]`,
    );
  }

  // Title must be non-empty
  if (session.title.trim().length === 0) {
    errors.push(`${prefix}: title is empty`);
  }

  // Description must be non-empty
  if (session.description.trim().length === 0) {
    errors.push(`${prefix}: description is empty`);
  }

  // Duration must be positive when provided
  if (session.duration_minutes !== null && session.duration_minutes <= 0) {
    errors.push(
      `${prefix}: duration_minutes ${session.duration_minutes} must be > 0`,
    );
  }

  // E3 duration cap
  if (
    maxE3Minutes !== undefined &&
    session.session_type === 'E3' &&
    session.duration_minutes !== null &&
    session.duration_minutes > maxE3Minutes
  ) {
    errors.push(
      `${prefix}: E3 duration ${session.duration_minutes} min exceeds plan maximum of ${maxE3Minutes} min`,
    );
  }

  // Galloway sessions should carry a walk_run_pattern
  if (
    session.walk_run_pattern !== undefined &&
    session.walk_run_pattern.kind === 'repeats'
  ) {
    if (session.walk_run_pattern.sets <= 0) {
      errors.push(`${prefix}: walk_run_pattern.sets must be > 0`);
    }
    if (session.walk_run_pattern.run_seconds <= 0) {
      errors.push(`${prefix}: walk_run_pattern.run_seconds must be > 0`);
    }
  }
}

// ---------------------------------------------------------------------------
// Week-level checks
// ---------------------------------------------------------------------------

function validateWeek(
  week: TrainingWeek,
  expectedSessions: number,
  maxE3Minutes: number | undefined,
  errors: string[],
): void {
  // Check session count
  if (week.sessions.length !== expectedSessions) {
    errors.push(
      `Week ${week.week_number}: expected ${expectedSessions} sessions, got ${week.sessions.length}`,
    );
  }

  // Check session numbers are 1-based and sequential
  week.sessions.forEach((session, idx) => {
    const expected = idx + 1;
    if (session.session_number !== expected) {
      errors.push(
        `Week ${week.week_number}, session at index ${idx}: session_number should be ${expected}, got ${session.session_number}`,
      );
    }
    validateSession(session, week.week_number, maxE3Minutes, errors);
  });
}

// ---------------------------------------------------------------------------
// Plan-level validation
// ---------------------------------------------------------------------------

/**
 * Validates the structural integrity of `plan` against PLAN_CONFIG.
 *
 * Checks performed:
 *  - Total week count matches config
 *  - Week numbers are 1-based and sequential
 *  - Each week has the correct number of sessions
 *  - Session intensity levels are within [1, 5]
 *  - Session pile counts are within [1, 3]
 *  - E3 session durations don't exceed the plan maximum
 *  - Titles and descriptions are non-empty
 *
 * @returns A `ValidationResult` with `valid: true` when there are no errors.
 */
export function validatePlanIntegrity(plan: TrainingPlan): ValidationResult {
  const errors: string[] = [];
  const config = PLAN_CONFIG[plan.plan_type];

  // 1. Total week count
  if (plan.weeks.length !== config.total_weeks) {
    errors.push(
      `Expected ${config.total_weeks} weeks, got ${plan.weeks.length}`,
    );
  }

  // 2. Week numbers must be 1-based and sequential
  plan.weeks.forEach((week, idx) => {
    const expectedWeekNum = idx + 1;
    if (week.week_number !== expectedWeekNum) {
      errors.push(
        `Week at index ${idx}: week_number should be ${expectedWeekNum}, got ${week.week_number}`,
      );
    }
  });

  // 3. Per-week checks
  const maxE3 =
    'max_duration_e3_minutes' in config
      ? (config.max_duration_e3_minutes as number)
      : undefined;

  plan.weeks.forEach((week) => {
    const expectedSessions = expectedSessionCount(
      config.sessions_per_week,
      week.week_number,
    );
    validateWeek(week, expectedSessions, maxE3, errors);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
