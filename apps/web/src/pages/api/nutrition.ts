/**
 * Nutrition API routes for Nova Coach.
 *
 * Supported endpoints (query-string routing on a single Next.js API route):
 *
 *   GET  /api/nutrition?resource=plan&pile=<1|2|3>[&sessionType=<type>]
 *        → Returns the full PilePlan for the given pile.
 *
 *   GET  /api/nutrition?resource=equivalents[&category=<group>][&mealContext=<ctx>]
 *        → Returns food equivalences, optionally filtered.
 *
 *   GET  /api/nutrition?resource=supplements&pile=<1|2|3>
 *        → Returns supplement list for the given pile.
 *
 *   POST /api/nutrition  { body: NutritionLogPayload }
 *        → Records a nutrition log entry (upserts by user_id + date).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  FoodGroup,
  MealType,
  PileCount,
  SessionType,
} from '../../types/nutrition';
import {
  getPilePlan,
  getMealOptions,
  getSupplements,
  getFoodEquivalents,
  getPileCountForSession,
} from '../../utils/nutritionSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NutritionLogPayload {
  user_id: string;
  date: string; // ISO date string
  pile: PileCount;
  meals_logged: {
    mealType: MealType;
    optionChosen: number;
    timestamp: string;
  }[];
  supplements_taken: string[];
}

type ApiResponse =
  | Record<string, unknown>
  | Record<string, unknown>[]
  | { error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePile(raw: unknown): PileCount | null {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n as PileCount;
  return null;
}

function isValidSessionType(s: unknown): s is SessionType {
  return ['E1', 'E2', 'E3', 'E4', 'MUSCU', 'REPOS'].includes(s as string);
}

function isValidFoodGroup(s: unknown): s is FoodGroup {
  return ['féculents', 'protéines', 'graisses', 'fruits', 'suppléments'].includes(
    s as string,
  );
}

function isValidMealContext(
  s: unknown,
): s is 'petit-déjeuner' | 'déjeuner-souper' | 'général' {
  return ['petit-déjeuner', 'déjeuner-souper', 'général'].includes(s as string);
}

// ---------------------------------------------------------------------------
// GET handlers
// ---------------------------------------------------------------------------

function handleGetPlan(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const { pile: rawPile, sessionType: rawSession } = req.query;

  // If sessionType is provided it takes priority for determining the pile
  let pile: PileCount | null = null;
  if (rawSession && isValidSessionType(rawSession)) {
    pile = getPileCountForSession(rawSession as SessionType);
  } else {
    pile = parsePile(rawPile);
  }

  if (!pile) {
    return res
      .status(400)
      .json({ error: 'pile must be 1, 2 or 3; or provide a valid sessionType' });
  }

  try {
    const plan = getPilePlan(pile);
    return res.status(200).json(plan as unknown as Record<string, unknown>);
  } catch (err) {
    return res.status(404).json({ error: (err as Error).message });
  }
}

function handleGetEquivalents(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const { category, mealContext } = req.query;

  if (category && !isValidFoodGroup(category)) {
    return res.status(400).json({ error: `Invalid category: ${String(category)}` });
  }

  if (mealContext && !isValidMealContext(mealContext)) {
    return res.status(400).json({ error: `Invalid mealContext: ${String(mealContext)}` });
  }

  const items = getFoodEquivalents(
    isValidFoodGroup(category) ? (category as FoodGroup) : undefined,
    isValidMealContext(mealContext) ? mealContext : undefined,
  );

  return res.status(200).json(items as unknown as Record<string, unknown>[]);
}

function handleGetSupplements(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const pile = parsePile(req.query.pile);
  if (!pile) {
    return res.status(400).json({ error: 'pile must be 1, 2 or 3' });
  }
  const supplements = getSupplements(pile);
  return res.status(200).json(supplements as unknown as Record<string, unknown>[]);
}

function handleGetMealOptions(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const pile = parsePile(req.query.pile);
  const mealType = req.query.mealType as MealType | undefined;

  if (!pile) {
    return res.status(400).json({ error: 'pile must be 1, 2 or 3' });
  }
  if (!mealType) {
    return res.status(400).json({ error: 'mealType is required' });
  }

  const options = getMealOptions(pile, mealType);
  return res.status(200).json(options as unknown as Record<string, unknown>[]);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

function handlePostLog(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const body = req.body as NutritionLogPayload | undefined;

  if (!body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  const { user_id, date, pile, meals_logged, supplements_taken } = body;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date is required (ISO string)' });
  }
  const parsedPile = parsePile(pile);
  if (!parsedPile) {
    return res.status(400).json({ error: 'pile must be 1, 2 or 3' });
  }
  if (!Array.isArray(meals_logged)) {
    return res.status(400).json({ error: 'meals_logged must be an array' });
  }
  if (!Array.isArray(supplements_taken)) {
    return res.status(400).json({ error: 'supplements_taken must be an array' });
  }

  // In a real implementation this would upsert into the nutrition_logs Supabase table.
  // For now we acknowledge the payload and return a 201 with the log structure.
  const logEntry = {
    id: crypto.randomUUID(),
    user_id,
    date,
    pile: parsedPile,
    meals_logged,
    supplements_taken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return res.status(201).json(logEntry);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  const { method } = req;
  const resource = req.query.resource as string | undefined;

  if (method === 'GET') {
    switch (resource) {
      case 'plan':
        return handleGetPlan(req, res);
      case 'equivalents':
        return handleGetEquivalents(req, res);
      case 'supplements':
        return handleGetSupplements(req, res);
      case 'meals':
        return handleGetMealOptions(req, res);
      default:
        return res.status(400).json({
          error:
            'resource must be one of: plan, equivalents, supplements, meals',
        });
    }
  }

  if (method === 'POST') {
    return handlePostLog(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${String(method)} not allowed` });
}
