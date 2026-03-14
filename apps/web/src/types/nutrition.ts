/**
 * Nutrition system types for endurance athletes (Nova Coach)
 * Supports 3-pile periodization model: rest/recovery, moderate training, high intensity.
 */

export type FoodGroup = 'féculents' | 'protéines' | 'graisses' | 'fruits' | 'suppléments';

/**
 * Meal slot identifiers used across all pile plans.
 * Note: 'dîner' and 'souper' both represent the evening meal;
 * 'souper' is used in the current meal plans while 'dîner' is kept
 * for future compatibility and alternate plan formats.
 */
export type MealType =
  | 'petit-déjeuner'
  | 'encas matin'
  | 'déjeuner'
  | 'encas après-midi'
  | 'dîner'
  | 'souper'
  | 'suppléments';

/** Number of nutritional "piles" (energy layers) for the day */
export type PileCount = 1 | 2 | 3;

/** Training session types used to recommend a PileCount */
export type SessionType = 'E1' | 'E2' | 'E3' | 'E4' | 'MUSCU' | 'REPOS';

/** A single food item with optional macro data */
export interface Food {
  name: string;
  quantity: number | string;
  /** e.g. 'gr', 'ml', '1', 'tranche' */
  unit?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

/** One selectable option within a meal */
export interface MealOption {
  optionNumber: number;
  name: string;
  foods: Food[];
}

/** A meal slot containing one or more selectable options */
export interface Meal {
  type: MealType;
  options: MealOption[];
}

/** A supplement recommendation with dosage and timing */
export interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  comment?: string;
}

/** Full nutritional plan for a given pile/day type */
export interface PilePlan {
  pile: PileCount;
  dayType: string;
  description: string;
  meals: Meal[];
  supplements?: Supplement[];
  trainingNotes?: string[];
}

/** User-recorded nutrition log entry */
export interface NutritionLog {
  id: string;
  user_id: string;
  date: Date;
  pile: PileCount;
  meals_logged: {
    mealType: MealType;
    optionChosen: number;
    foods: Food[];
    timestamp: Date;
  }[];
  supplements_taken: string[];
  created_at: Date;
  updated_at: Date;
}

/** Food equivalences grouped by category and meal context */
export interface FoodEquivalentGroup {
  category: FoodGroup;
  mealContext: 'petit-déjeuner' | 'déjeuner-souper' | 'général';
  items: Food[];
}

/** Macronutrient totals */
export interface MacroTotals {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

/** Carb loading plan for race preparation */
export interface CarbLoadingPlan {
  start_date: Date;
  end_date: Date;
  carbs_per_kg_min: number;
  carbs_per_kg_max: number;
  total_daily_carbs_grams: number;
}

/** Contextual nutrition reminder */
export interface NutritionReminder {
  type: 'hydration' | 'supplements' | 'gel' | 'recovery';
  message: string;
}
