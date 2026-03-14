/**
 * Nutrition system utilities for Nova Coach endurance athletes.
 * Provides pile-plan lookup, macro calculation, portion scaling and session-based recommendations.
 */

import type {
  Food,
  FoodGroup,
  MacroTotals,
  MealOption,
  MealType,
  NutritionReminder,
  PileCount,
  PilePlan,
  SessionType,
  Supplement,
  CarbLoadingPlan,
} from '../types/nutrition';

// JSON data imports (resolved at build time via bundler / ts-node)
import pilePlansData from '../data/nutrition-piles.json';
import foodEquivalentsData from '../data/food-equivalents.json';
import supplementsData from '../data/supplements.json';

/** Reference athlete weight used for base portions in the nutrition plans */
const BASE_WEIGHT_KG = 70;

// ---------------------------------------------------------------------------
// Plan accessors
// ---------------------------------------------------------------------------

/**
 * Returns the full nutritional plan for a given pile count.
 * @param pile - 1 (rest), 2 (moderate), 3 (high intensity)
 */
export function getPilePlan(pile: PileCount): PilePlan {
  const plan = (pilePlansData as PilePlan[]).find((p) => p.pile === pile);
  if (!plan) {
    throw new Error(`No plan found for pile ${pile}`);
  }
  return plan;
}

/**
 * Returns all selectable options for a specific meal within a pile plan.
 * @param pile     - Pile count (1-3)
 * @param mealType - The meal slot to retrieve
 */
export function getMealOptions(pile: PileCount, mealType: MealType): MealOption[] {
  const plan = getPilePlan(pile);
  const meal = plan.meals.find((m) => m.type === mealType);
  return meal?.options ?? [];
}

/**
 * Returns the supplement list for a given pile.
 * Falls back to the global supplements data if the plan has no embedded supplements.
 * @param pile - Pile count (1-3)
 */
export function getSupplements(pile: PileCount): Supplement[] {
  const plan = getPilePlan(pile);
  if (plan.supplements && plan.supplements.length > 0) {
    return plan.supplements;
  }
  return supplementsData as Supplement[];
}

// ---------------------------------------------------------------------------
// Portion calculations
// ---------------------------------------------------------------------------

/**
 * Scales a base portion (calibrated for a 70 kg athlete) to the user's actual weight.
 * @param basePortionGrams - Base quantity in grams from the plan
 * @param userWeight       - Athlete's body weight in kg
 * @returns Rounded gram quantity adapted to the athlete
 */
export function calculateUserPortion(basePortionGrams: number, userWeight: number): number {
  if (userWeight <= 0) {
    throw new Error('userWeight must be a positive number');
  }
  return Math.round(basePortionGrams * (userWeight / BASE_WEIGHT_KG));
}

/**
 * Calculates cumulative macros for a list of food items.
 * @param foods - Array of Food items (optional macro fields are treated as 0 when absent)
 */
export function calculateMacros(foods: Food[]): MacroTotals {
  return foods.reduce<MacroTotals>(
    (acc, food) => ({
      carbs: acc.carbs + (food.carbs ?? 0),
      protein: acc.protein + (food.protein ?? 0),
      fat: acc.fat + (food.fat ?? 0),
      calories: acc.calories + (food.calories ?? 0),
    }),
    { carbs: 0, protein: 0, fat: 0, calories: 0 },
  );
}

// ---------------------------------------------------------------------------
// Session → pile mapping
// ---------------------------------------------------------------------------

/**
 * Determines the recommended pile count for a given training session type.
 *
 * | Session | Description                     | Pile |
 * |---------|----------------------------------|------|
 * | REPOS   | Rest day                        |  1   |
 * | E1      | Easy aerobic / recovery run     |  1   |
 * | MUSCU   | Strength training               |  2   |
 * | E2      | Moderate aerobic / tempo        |  2   |
 * | E3      | Threshold / long run            |  3   |
 * | E4      | Race / VO2max / high intensity  |  3   |
 *
 * @param sessionType - Training session type
 * @returns Recommended pile count
 */
export function getPileCountForSession(sessionType: SessionType): PileCount {
  switch (sessionType) {
    case 'REPOS':
    case 'E1':
      return 1;
    case 'MUSCU':
    case 'E2':
      return 2;
    case 'E3':
    case 'E4':
      return 3;
    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = sessionType;
      throw new Error(`Unknown session type: ${String(_exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Food equivalents
// ---------------------------------------------------------------------------

/**
 * Retrieves all food equivalents for a given food group.
 * If no group is provided, all food equivalents are returned.
 * @param group       - Optional food group category
 * @param mealContext - Optional meal context filter
 */
export function getFoodEquivalents(
  group?: FoodGroup,
  mealContext?: 'petit-déjeuner' | 'déjeuner-souper' | 'général',
): Food[] {
  const allGroups = foodEquivalentsData as Array<{
    category: FoodGroup;
    mealContext: string;
    items: Food[];
  }>;

  return allGroups
    .filter(
      (g) =>
        (group === undefined || g.category === group) &&
        (mealContext === undefined || g.mealContext === mealContext),
    )
    .flatMap((g) => g.items);
}

/**
 * Finds food items matching a partial name (case-insensitive) across all equivalence groups.
 * @param foodName - Partial or full food name to search
 */
export function findFoodByName(foodName: string): Food[] {
  const allGroups = foodEquivalentsData as Array<{ items: Food[] }>;
  const query = foodName.toLowerCase();
  return allGroups
    .flatMap((g) => g.items)
    .filter((f) => f.name.toLowerCase().includes(query));
}

// ---------------------------------------------------------------------------
// Nutrition reminders
// ---------------------------------------------------------------------------

/**
 * Returns contextual nutrition reminders based on plan type and session.
 * @param planType    - Training plan identifier (e.g. '15km', 'semi')
 * @param sessionType - Session type
 */
export function getNutritionReminders(
  planType: string,
  sessionType: SessionType,
): NutritionReminder[] {
  const reminders: NutritionReminder[] = [];

  if (['15km', 'semi'].includes(planType) && ['E2', 'E3'].includes(sessionType)) {
    reminders.push({
      type: 'hydration',
      message: 'Électrolytes + Gel 25-30g pendant la séance',
    });
  }

  if (planType === 'semi') {
    reminders.push({
      type: 'supplements',
      message: 'Check : Magnésium, Vit D, Oméga 3',
    });
  }

  if (['E3', 'E4'].includes(sessionType)) {
    reminders.push({
      type: 'gel',
      message: 'Gel 25-40g toutes les 40 min (toutes les 30 min si séries)',
    });
  }

  if (['E2', 'E3', 'E4'].includes(sessionType)) {
    reminders.push({
      type: 'recovery',
      message:
        'Si > 1h avant le prochain repas après entraînement : ajouter shake récupération',
    });
  }

  return reminders;
}

// ---------------------------------------------------------------------------
// Carb loading (race preparation)
// ---------------------------------------------------------------------------

/**
 * Builds a carb-loading plan starting 3 days before race day.
 * Targets 8-10g of carbohydrates per kg of body weight per day.
 *
 * @param raceDate   - Date of the race
 * @param userWeight - Athlete's body weight in kg
 */
export function getCarbLoadingPlan(raceDate: Date, userWeight: number): CarbLoadingPlan {
  if (userWeight <= 0) {
    throw new Error('userWeight must be a positive number');
  }
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const startDate = new Date(raceDate.getTime() - THREE_DAYS_MS);

  const carbsPerKgMin = 8;
  const carbsPerKgMax = 10;
  // Use the midpoint (9 g/kg) as the daily target
  const totalDailyCarbsGrams = Math.round(userWeight * 9);

  return {
    start_date: startDate,
    end_date: raceDate,
    carbs_per_kg_min: carbsPerKgMin,
    carbs_per_kg_max: carbsPerKgMax,
    total_daily_carbs_grams: totalDailyCarbsGrams,
  };
}
