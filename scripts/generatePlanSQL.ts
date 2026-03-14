/**
 * generatePlanSQL.ts
 *
 * Reads supabase/seed/training-plans.json and generates ready-to-run
 * SQL INSERT statements for all plan data.
 *
 * The generated SQL targets three tables:
 *   training_plans   – one row per plan
 *   training_weeks   – one row per week
 *   training_sessions – one row per session
 *
 * Usage:
 *   pnpm generate:sql                  # prints SQL to stdout
 *   pnpm generate:sql > output.sql     # saves to file
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load seed data
// ---------------------------------------------------------------------------

interface WalkRunSegment {
  type: 'run' | 'walk';
  duration_seconds: number;
}

interface WalkRunPattern {
  kind: 'repeats' | 'sequence';
  sets?: number;
  run_seconds?: number;
  walk_seconds?: number;
  segments?: WalkRunSegment[];
}

interface Session {
  session_number: number;
  session_type: string;
  title: string;
  duration_minutes: number | null;
  description: string;
  intensity_level: number;
  pile_count: number;
  walk_run_pattern?: WalkRunPattern | null;
}

interface Week {
  week_number: number;
  cycle_number: number | null;
  cycle_name: string | null;
  sessions: Session[];
}

interface Plan {
  id: string;
  plan_type: string;
  name: string;
  description: string;
  total_weeks: number;
  sessions_per_week: number | unknown[];
  target_distance: number;
  weeks: Week[];
}

interface SeedData {
  plans: Plan[];
}

const seedPath = resolve(ROOT, 'supabase', 'seed', 'training-plans.json');
const seed: SeedData = JSON.parse(readFileSync(seedPath, 'utf8')) as SeedData;

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/** Escapes a string for use in a SQL single-quoted literal. */
function esc(value: string): string {
  return value.replace(/'/g, "''");
}

/** Converts a value to a SQL literal (handles null, strings, numbers, json). */
function sqlVal(value: string | number | null | object): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `'${esc(value)}'`;
  // Objects/arrays → jsonb
  return `'${esc(JSON.stringify(value))}'::jsonb`;
}

/** Converts sessions_per_week to a SQL-safe value (integer or jsonb). */
function sessionsPerWeekVal(spw: number | unknown[]): string {
  if (typeof spw === 'number') return String(spw);
  return `'${esc(JSON.stringify(spw))}'::jsonb`;
}

// ---------------------------------------------------------------------------
// SQL generation
// ---------------------------------------------------------------------------

const lines: string[] = [];

lines.push('-- =============================================================');
lines.push('-- NOVA COACH – Training Plans seed data');
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('-- =============================================================');
lines.push('');
lines.push('BEGIN;');
lines.push('');

// ---- training_plans table --------------------------------------------------
lines.push('-- -----------------------------------------------------------');
lines.push('-- training_plans');
lines.push('-- -----------------------------------------------------------');
lines.push('');

for (const plan of seed.plans) {
  const spw = sessionsPerWeekVal(plan.sessions_per_week);
  lines.push(
    `INSERT INTO training_plans (id, plan_type, name, description, total_weeks, sessions_per_week, target_distance_meters)` +
    ` VALUES (` +
    `${sqlVal(plan.id)}, ` +
    `${sqlVal(plan.plan_type)}, ` +
    `${sqlVal(plan.name)}, ` +
    `${sqlVal(plan.description)}, ` +
    `${sqlVal(plan.total_weeks)}, ` +
    `${spw}, ` +
    `${sqlVal(plan.target_distance)}` +
    `)` +
    ` ON CONFLICT (id) DO UPDATE SET` +
    ` name = EXCLUDED.name,` +
    ` description = EXCLUDED.description,` +
    ` total_weeks = EXCLUDED.total_weeks,` +
    ` sessions_per_week = EXCLUDED.sessions_per_week,` +
    ` target_distance_meters = EXCLUDED.target_distance_meters;`,
  );
}

lines.push('');

// ---- training_weeks table --------------------------------------------------
lines.push('-- -----------------------------------------------------------');
lines.push('-- training_weeks');
lines.push('-- -----------------------------------------------------------');
lines.push('');

for (const plan of seed.plans) {
  for (const week of plan.weeks) {
    const weekId = `${plan.id}-w${String(week.week_number).padStart(2, '0')}`;
    lines.push(
      `INSERT INTO training_weeks (id, plan_id, week_number, cycle_number, cycle_name)` +
      ` VALUES (` +
      `${sqlVal(weekId)}, ` +
      `${sqlVal(plan.id)}, ` +
      `${sqlVal(week.week_number)}, ` +
      `${sqlVal(week.cycle_number)}, ` +
      `${sqlVal(week.cycle_name)}` +
      `)` +
      ` ON CONFLICT (id) DO UPDATE SET` +
      ` cycle_number = EXCLUDED.cycle_number,` +
      ` cycle_name = EXCLUDED.cycle_name;`,
    );
  }
}

lines.push('');

// ---- training_sessions table -----------------------------------------------
lines.push('-- -----------------------------------------------------------');
lines.push('-- training_sessions');
lines.push('-- -----------------------------------------------------------');
lines.push('');

for (const plan of seed.plans) {
  for (const week of plan.weeks) {
    const weekId = `${plan.id}-w${String(week.week_number).padStart(2, '0')}`;
    for (const session of week.sessions) {
      const sessionId = `${weekId}-s${session.session_number}`;
      const patternVal =
        session.walk_run_pattern != null
          ? sqlVal(session.walk_run_pattern as object)
          : 'NULL';
      lines.push(
        `INSERT INTO training_sessions (id, week_id, session_number, session_type, title, duration_minutes, description, intensity_level, pile_count, walk_run_pattern)` +
        ` VALUES (` +
        `${sqlVal(sessionId)}, ` +
        `${sqlVal(weekId)}, ` +
        `${sqlVal(session.session_number)}, ` +
        `${sqlVal(session.session_type)}, ` +
        `${sqlVal(session.title)}, ` +
        `${sqlVal(session.duration_minutes)}, ` +
        `${sqlVal(session.description)}, ` +
        `${sqlVal(session.intensity_level)}, ` +
        `${sqlVal(session.pile_count)}, ` +
        `${patternVal}` +
        `)` +
        ` ON CONFLICT (id) DO UPDATE SET` +
        ` title = EXCLUDED.title,` +
        ` duration_minutes = EXCLUDED.duration_minutes,` +
        ` description = EXCLUDED.description,` +
        ` intensity_level = EXCLUDED.intensity_level,` +
        ` pile_count = EXCLUDED.pile_count,` +
        ` walk_run_pattern = EXCLUDED.walk_run_pattern;`,
      );
    }
  }
}

lines.push('');
lines.push('COMMIT;');
lines.push('');
lines.push(`-- Total plans: ${seed.plans.length}`);
const totalWeeks = seed.plans.reduce((sum, p) => sum + p.weeks.length, 0);
const totalSessions = seed.plans.reduce(
  (sum, p) => sum + p.weeks.reduce((ws, w) => ws + w.sessions.length, 0),
  0,
);
lines.push(`-- Total weeks: ${totalWeeks}`);
lines.push(`-- Total sessions: ${totalSessions}`);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
process.stdout.write(lines.join('\n') + '\n');
process.stderr.write(
  `✅ Generated SQL: ${seed.plans.length} plans, ${totalWeeks} weeks, ${totalSessions} sessions\n`,
);
