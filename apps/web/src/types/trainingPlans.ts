/**
 * Training Plans – strict TypeScript types
 *
 * Covers all plan types available in NOVA COACH:
 *   • Galloway  – walk/run progression toward finishing a 5 km
 *   • 5km       – 3-cycle consolidation plan
 *   • 10km      – 3-cycle consolidation plan
 *   • 15km      – 3-cycle consolidation plan
 *   • semi      – 3-cycle semi-marathon plan
 */

// ---------------------------------------------------------------------------
// Primitive union types
// ---------------------------------------------------------------------------

/** All available training plan identifiers. */
export type PlanType = 'galloway' | '5km' | '10km' | '15km' | 'semi';

/**
 * Session type codes:
 *   E1 – Easy / endurance fondamentale (short easy run)
 *   E2 – Tempo / interval session
 *   E3 – Long run (sortie longue)
 *   E4 – Very easy recovery run
 *   MUSCU – Strength / conditioning
 *   REPOS – Rest day
 */
export type SessionType = 'E1' | 'E2' | 'E3' | 'E4' | 'MUSCU' | 'REPOS';

/** Subjective intensity on a 1–5 scale. */
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

/** Number of workout "piles" (blocks) within a session. */
export type PileCount = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Walk/run pattern (Galloway-specific)
// ---------------------------------------------------------------------------

/**
 * Describes a single repeating walk/run block used in Galloway sessions.
 * For sessions with a non-uniform structure (e.g. "20min run + 5min walk + 10min run"),
 * use the `segments` array instead.
 */
export interface WalkRunRepeats {
  readonly kind: 'repeats';
  /** Number of times the run/walk pair is repeated. */
  readonly sets: number;
  /** Duration of the running portion in seconds. */
  readonly run_seconds: number;
  /** Duration of the walking portion in seconds (0 for pure run). */
  readonly walk_seconds: number;
}

/** One sequential segment within a Galloway session (run or walk). */
export interface WalkRunSegment {
  readonly type: 'run' | 'walk';
  readonly duration_seconds: number;
}

/** Galloway session composed of sequential non-uniform segments. */
export interface WalkRunSequence {
  readonly kind: 'sequence';
  readonly segments: readonly WalkRunSegment[];
}

export type WalkRunPattern = WalkRunRepeats | WalkRunSequence;

// ---------------------------------------------------------------------------
// Training session
// ---------------------------------------------------------------------------

/** One training session within a week. */
export interface TrainingSession {
  /** Position within the week: 1, 2 or 3 (occasionally 4 for semi). */
  readonly session_number: number;
  /** Functional category of the session. */
  readonly session_type: SessionType;
  /** Short human-readable label shown in the UI. */
  readonly title: string;
  /** Approximate total session duration in minutes (null for race days). */
  readonly duration_minutes: number | null;
  /** Full workout description with repetitions, paces and instructions. */
  readonly description: string;
  /** Perceived / target intensity on a 1–5 scale. */
  readonly intensity_level: IntensityLevel;
  /**
   * Number of distinct workout blocks ("piles"):
   *   1 – single continuous effort (E1 / E3 easy runs, rest)
   *   2 – two blocks (warm-up + intervals, or run + finish)
   *   3 – three blocks (warm-up + intervals + cool-down)
   */
  readonly pile_count: PileCount;
  /**
   * Walk/run pattern descriptor – only present for Galloway sessions.
   * Undefined for all consolidation plans.
   */
  readonly walk_run_pattern?: WalkRunPattern;
}

// ---------------------------------------------------------------------------
// Training week
// ---------------------------------------------------------------------------

/** One week inside a training plan. */
export interface TrainingWeek {
  /** 1-based week number within the plan. */
  readonly week_number: number;
  /** 1-based cycle number (null for Galloway which has no formal cycles). */
  readonly cycle_number: number | null;
  /** Human-readable cycle name, e.g. "Cycle 1 – Vitesse". */
  readonly cycle_name: string | null;
  /** Ordered list of sessions for this week. */
  readonly sessions: readonly TrainingSession[];
}

// ---------------------------------------------------------------------------
// Training plan
// ---------------------------------------------------------------------------

/** A complete training plan ready for Supabase import. */
export interface TrainingPlan {
  /** Unique plan identifier used as the primary key in Supabase. */
  readonly id: string;
  readonly plan_type: PlanType;
  /** Marketing name of the plan. */
  readonly name: string;
  /** Short description shown on the plan selection screen. */
  readonly description: string;
  /** Total number of weeks in the plan. */
  readonly total_weeks: number;
  /** Nominal sessions per week (number) or a variable schedule (array). */
  readonly sessions_per_week: number | readonly SessionsPerWeekEntry[];
  /** Race / target distance in metres. */
  readonly target_distance: number;
  /** Ordered list of weeks. Length must equal `total_weeks`. */
  readonly weeks: readonly TrainingWeek[];
}

/** Variable session-count descriptor for plans where weekly volume changes. */
export interface SessionsPerWeekEntry {
  readonly weeks: readonly number[];
  readonly count: number;
}

// ---------------------------------------------------------------------------
// PlanConfig – per-plan structural constraints used by the validator
// ---------------------------------------------------------------------------

interface GallowayConfig {
  readonly plan_type: 'galloway';
  readonly sessions_per_week: 3;
  /** Galloway sessions always use walk/run intervals. */
  readonly walk_run_pattern: true;
  readonly total_weeks: 12;
  readonly target_distance: 5000;
}

interface ConsolidationConfig {
  readonly plan_type: '5km' | '10km' | '15km' | 'semi';
  readonly cycles: 3;
  /** Fixed number of sessions/week or a variable schedule. */
  readonly sessions_per_week: number | readonly SessionsPerWeekEntry[];
  readonly total_weeks: number;
  readonly target_distance: number;
  /** Maximum allowed duration (minutes) for any E3 session in this plan. */
  readonly max_duration_e3_minutes: number;
}

export type PlanConfigEntry = GallowayConfig | ConsolidationConfig;

/** Map from PlanType to its structural configuration. */
export type PlanConfig = {
  readonly [K in PlanType]: PlanConfigEntry & { readonly plan_type: K };
};

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

/** Result returned by `validatePlanIntegrity`. */
export interface ValidationResult {
  /** True when no errors were found. */
  readonly valid: boolean;
  /** Human-readable descriptions of each detected problem. */
  readonly errors: readonly string[];
}
