-- Migration 003: Nutrition tables
-- Stores plans, meals, supplements and food equivalences for the 3-pile system.

-- ---------------------------------------------------------------------------
-- nutrition_plans
-- ---------------------------------------------------------------------------
CREATE TABLE nutrition_plans (
  id          SERIAL PRIMARY KEY,
  pile        INT     NOT NULL CHECK (pile IN (1, 2, 3)),
  day_type    TEXT    NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- nutrition_meals
-- One row per (plan, meal_type, option_number).
-- The foods column holds a JSON array of Food objects.
-- ---------------------------------------------------------------------------
CREATE TABLE nutrition_meals (
  id            SERIAL PRIMARY KEY,
  plan_id       INT  REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  meal_type     TEXT NOT NULL,
  option_number INT  NOT NULL,
  option_name   TEXT,
  foods         JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (plan_id, meal_type, option_number)
);

CREATE INDEX idx_nutrition_meals_plan_id ON nutrition_meals (plan_id);
CREATE INDEX idx_nutrition_meals_meal_type ON nutrition_meals (meal_type);

-- ---------------------------------------------------------------------------
-- nutrition_supplements
-- ---------------------------------------------------------------------------
CREATE TABLE nutrition_supplements (
  id         SERIAL PRIMARY KEY,
  pile       INT  NOT NULL CHECK (pile IN (1, 2, 3)),
  name       TEXT NOT NULL,
  dosage     TEXT NOT NULL,
  timing     TEXT NOT NULL,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- food_equivalents
-- Reference table for portion equivalences by food group and meal context.
-- ---------------------------------------------------------------------------
CREATE TABLE food_equivalents (
  id           SERIAL PRIMARY KEY,
  category     TEXT    NOT NULL,
  meal_context TEXT,
  food_name    TEXT    NOT NULL,
  quantity     NUMERIC NOT NULL,
  unit         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_equivalents_category ON food_equivalents (category);

-- ---------------------------------------------------------------------------
-- nutrition_logs
-- Per-user daily log: which pile, which options chosen, supplements taken.
-- ---------------------------------------------------------------------------
CREATE TABLE nutrition_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  date                DATE NOT NULL,
  pile                INT  NOT NULL CHECK (pile IN (1, 2, 3)),
  meals_logged        JSONB NOT NULL DEFAULT '[]',
  supplements_taken   TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs (user_id);
CREATE INDEX idx_nutrition_logs_date    ON nutrition_logs (date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE nutrition_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_equivalents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs       ENABLE ROW LEVEL SECURITY;

-- Plans, meals, supplements and food equivalents are readable by all
-- authenticated users (read-only reference data).
CREATE POLICY "nutrition_plans_select"
  ON nutrition_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "nutrition_meals_select"
  ON nutrition_meals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "nutrition_supplements_select"
  ON nutrition_supplements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "food_equivalents_select"
  ON food_equivalents FOR SELECT
  TO authenticated
  USING (true);

-- Logs: users can only read/write their own rows.
CREATE POLICY "nutrition_logs_select"
  ON nutrition_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "nutrition_logs_insert"
  ON nutrition_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nutrition_logs_update"
  ON nutrition_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nutrition_logs_delete"
  ON nutrition_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
