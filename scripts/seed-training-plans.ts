/**
 * seed-training-plans.ts
 *
 * CLI script that loads supabase/seed/training-plans.json, validates every
 * plan, then upserts all rows into Supabase (local or cloud).
 *
 * Usage:
 *   pnpm seed:plans
 *
 * Environment variables (read from .env / process.env):
 *   SUPABASE_URL       – Supabase project URL (default: http://localhost:54321)
 *   SUPABASE_SERVICE_KEY – service-role key with write access (required)
 *
 * The script is idempotent – it can be re-run without creating duplicate rows
 * because all upserts use ON CONFLICT … DO UPDATE semantics via Supabase's
 * `upsert` method with `onConflict: 'id'`.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { validatePlanIntegrity } from '../apps/web/src/utils/planValidator.js';
import type {
  TrainingPlan,
  SessionsPerWeekEntry,
  WalkRunPattern,
} from '../apps/web/src/types/trainingPlans.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env['SUPABASE_URL'] ?? 'http://localhost:54321';

const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_KEY'];

if (!SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ SUPABASE_SERVICE_KEY environment variable is required.\n' +
      '   For local dev run: export SUPABASE_SERVICE_KEY=<service-role key>\n' +
      '   Find your key in: supabase start → "service_role key"',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load seed data
// ---------------------------------------------------------------------------

const seedPath = resolve(ROOT, 'supabase', 'seed', 'training-plans.json');

let seedData: { plans: TrainingPlan[] };

try {
  seedData = JSON.parse(readFileSync(seedPath, 'utf8')) as {
    plans: TrainingPlan[];
  };
} catch (err) {
  console.error(`❌ Failed to read seed file at ${seedPath}:`, err);
  process.exit(1);
}

const { plans } = seedData;
console.log(`📂 Loaded ${plans.length} plans from ${seedPath}`);

// ---------------------------------------------------------------------------
// Validate all plans before touching the database
// ---------------------------------------------------------------------------

let validationFailed = false;

for (const plan of plans) {
  const result = validatePlanIntegrity(plan);
  if (!result.valid) {
    console.error(`\n❌ Validation failed for plan "${plan.plan_type}":`);
    result.errors.forEach((e) => console.error(`   • ${e}`));
    validationFailed = true;
  } else {
    console.log(
      `✅ ${plan.plan_type}: ${plan.weeks.length} weeks validated OK`,
    );
  }
}

if (validationFailed) {
  console.error('\n⛔ Aborting import – fix validation errors first.');
  process.exit(1);
}

console.log('\n📤 All plans validated. Starting Supabase import …\n');

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Import helpers
// ---------------------------------------------------------------------------

/** Asserts that a Supabase response has no error, throwing if it does. */
function assertNoError<T>(
  response: { data: T; error: unknown },
  context: string,
): T {
  if (response.error) {
    throw new Error(`Supabase error in ${context}: ${JSON.stringify(response.error)}`);
  }
  return response.data;
}

// ---------------------------------------------------------------------------
// Import plan rows
// ---------------------------------------------------------------------------

interface PlanRow {
  id: string;
  plan_type: string;
  name: string;
  description: string;
  total_weeks: number;
  sessions_per_week: number | readonly SessionsPerWeekEntry[];
  target_distance_meters: number;
}

interface WeekRow {
  id: string;
  plan_id: string;
  week_number: number;
  cycle_number: number | null;
  cycle_name: string | null;
}

interface SessionRow {
  id: string;
  week_id: string;
  session_number: number;
  session_type: string;
  title: string;
  duration_minutes: number | null;
  description: string;
  intensity_level: number;
  pile_count: number;
  walk_run_pattern: WalkRunPattern | null;
}

async function importPlans(): Promise<void> {
  let totalWeeks = 0;
  let totalSessions = 0;

  for (const plan of plans) {
    // --- training_plans row -------------------------------------------------
    const planRow: PlanRow = {
      id: plan.id,
      plan_type: plan.plan_type,
      name: plan.name,
      description: plan.description,
      total_weeks: plan.total_weeks,
      sessions_per_week: plan.sessions_per_week as number | readonly SessionsPerWeekEntry[],
      target_distance_meters: plan.target_distance,
    };

    assertNoError(
      await supabase
        .from('training_plans')
        .upsert(planRow, { onConflict: 'id' }),
      `training_plans upsert (${plan.id})`,
    );

    // --- training_weeks rows ------------------------------------------------
    const weekRows: WeekRow[] = plan.weeks.map((week) => ({
      id: `${plan.id}-w${String(week.week_number).padStart(2, '0')}`,
      plan_id: plan.id,
      week_number: week.week_number,
      cycle_number: week.cycle_number,
      cycle_name: week.cycle_name,
    }));

    assertNoError(
      await supabase
        .from('training_weeks')
        .upsert(weekRows, { onConflict: 'id' }),
      `training_weeks upsert (${plan.id})`,
    );

    // --- training_sessions rows ---------------------------------------------
    const sessionRows: SessionRow[] = plan.weeks.flatMap((week) => {
      const weekId = `${plan.id}-w${String(week.week_number).padStart(2, '0')}`;
      return week.sessions.map((session) => ({
        id: `${weekId}-s${session.session_number}`,
        week_id: weekId,
        session_number: session.session_number,
        session_type: session.session_type,
        title: session.title,
        duration_minutes: session.duration_minutes,
        description: session.description,
        intensity_level: session.intensity_level,
        pile_count: session.pile_count,
        walk_run_pattern: (session.walk_run_pattern ?? null) as WalkRunPattern | null,
      }));
    });

    assertNoError(
      await supabase
        .from('training_sessions')
        .upsert(sessionRows, { onConflict: 'id' }),
      `training_sessions upsert (${plan.id})`,
    );

    const wCount = plan.weeks.length;
    const sCount = plan.weeks.reduce((sum, w) => sum + w.sessions.length, 0);
    totalWeeks += wCount;
    totalSessions += sCount;

    console.log(
      `  ✅ ${plan.plan_type.padEnd(8)} – ${wCount} weeks, ${sCount} sessions`,
    );
  }

  console.log(
    `\n🎉 Import complete!\n` +
      `   Plans:    ${plans.length}\n` +
      `   Weeks:    ${totalWeeks}\n` +
      `   Sessions: ${totalSessions}\n` +
      `   Target:   ${SUPABASE_URL}`,
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

importPlans().catch((err: unknown) => {
  console.error('\n❌ Import failed:', err);
  process.exit(1);
});
