/**
 * NutritionPanel – Daily nutrition plan display component.
 *
 * Shows the recommended pile plan for the day, allows the user to pick one
 * option per meal, displays estimated macros, logs choices and surfaces
 * hydration / gel reminders.
 */

import React, { useState, useMemo } from 'react';
import type {
  Food,
  MacroTotals,
  MealOption,
  MealType,
  PileCount,
  SessionType,
  Supplement,
} from '../types/nutrition';
import {
  getPilePlan,
  getMealOptions,
  getSupplements,
  calculateMacros,
  calculateUserPortion,
  getPileCountForSession,
  getNutritionReminders,
} from '../utils/nutritionSystem';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NutritionPanelProps {
  /** Athlete's body weight in kg – used to scale portions */
  userWeightKg: number;
  /** Manually override pile count; if omitted sessionType drives the choice */
  pile?: PileCount;
  /** Today's training session type */
  sessionType?: SessionType;
  /** Training plan identifier for contextual reminders (e.g. '15km', 'semi') */
  planType?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Meal slot display order */
const MEAL_ORDER: MealType[] = [
  'petit-déjeuner',
  'encas matin',
  'déjeuner',
  'encas après-midi',
  'souper',
];

const MEAL_ICONS: Record<MealType, string> = {
  'petit-déjeuner': '🌅',
  'encas matin': '🍎',
  'déjeuner': '☀️',
  'encas après-midi': '🍊',
  'dîner': '🌙',
  'souper': '🌙',
  'suppléments': '💊',
};

function MacroBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ minWidth: 70, fontSize: 13, color: '#555' }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 8,
          background: '#e5e7eb',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, (value / 200) * 100)}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
        {Math.round(value)}g
      </span>
    </div>
  );
}

function FoodList({ foods, userWeightKg }: { foods: Food[]; userWeightKg: number }) {
  return (
    <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
      {foods.map((food, idx) => {
        const qty =
          typeof food.quantity === 'number'
            ? calculateUserPortion(food.quantity, userWeightKg)
            : food.quantity;
        return (
          <li
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 0',
              borderBottom: '1px solid #f3f4f6',
              fontSize: 14,
            }}
          >
            <span>{food.name}</span>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>
              {qty}
              {food.unit ? ` ${food.unit}` : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function MealCard({
  mealType,
  options,
  selectedOption,
  onSelectOption,
  userWeightKg,
}: {
  mealType: MealType;
  options: MealOption[];
  selectedOption: number;
  onSelectOption: (opt: number) => void;
  userWeightKg: number;
}) {
  const chosen = options.find((o) => o.optionNumber === selectedOption) ?? options[0];

  if (!chosen) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 20, marginRight: 8 }}>{MEAL_ICONS[mealType] ?? '🍽️'}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1 }}>
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </h3>
      </div>

      {/* Option selector */}
      {options.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {options.map((opt) => (
            <button
              key={opt.optionNumber}
              onClick={() => onSelectOption(opt.optionNumber)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: selectedOption === opt.optionNumber ? '#3b82f6' : '#d1d5db',
                background: selectedOption === opt.optionNumber ? '#eff6ff' : '#f9fafb',
                color: selectedOption === opt.optionNumber ? '#1d4ed8' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: selectedOption === opt.optionNumber ? 600 : 400,
              }}
            >
              Option {opt.optionNumber}
            </button>
          ))}
        </div>
      )}

      {/* Option name */}
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151', fontStyle: 'italic' }}>
        {chosen.name}
      </p>

      {/* Food list */}
      <FoodList foods={chosen.foods} userWeightKg={userWeightKg} />
    </div>
  );
}

function SupplementCard({ supplement }: { supplement: Supplement }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <span style={{ fontSize: 18 }}>💊</span>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
          {supplement.name} – {supplement.dosage}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
          {supplement.timing}
          {supplement.comment ? ` · ${supplement.comment}` : ''}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * NutritionPanel displays the full daily nutrition plan for an endurance athlete.
 *
 * Features:
 * - Auto-selects pile count from session type (or uses explicit `pile` prop)
 * - Lets the user choose an option per meal
 * - Scales all gram quantities to the athlete's body weight
 * - Shows estimated macro totals for all chosen meals
 * - Lists supplement reminders
 * - Surfaces hydration / gel / recovery reminders
 */
export function NutritionPanel({
  userWeightKg,
  pile: pileProp,
  sessionType = 'REPOS',
  planType = '',
}: NutritionPanelProps) {
  // Resolve pile count
  const pile: PileCount = pileProp ?? getPileCountForSession(sessionType);

  const plan = useMemo(() => getPilePlan(pile), [pile]);
  const supplements = useMemo(() => getSupplements(pile), [pile]);
  const reminders = useMemo(
    () => getNutritionReminders(planType, sessionType),
    [planType, sessionType],
  );

  // Track selected option per meal (default = option 1)
  const initialSelections = useMemo(() => {
    const map: Record<string, number> = {};
    MEAL_ORDER.forEach((mt) => {
      const opts = getMealOptions(pile, mt);
      if (opts.length > 0) {
        map[mt] = opts[0].optionNumber;
      }
    });
    return map;
  }, [pile]);

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, number>>(initialSelections);

  const handleSelectOption = (mealType: MealType, optionNumber: number) => {
    setSelectedOptions((prev) => ({ ...prev, [mealType]: optionNumber }));
  };

  // Calculate aggregated macros for all chosen meals
  const totalMacros = useMemo<MacroTotals>(() => {
    return MEAL_ORDER.reduce<MacroTotals>(
      (acc, mt) => {
        const opts = getMealOptions(pile, mt);
        if (opts.length === 0) return acc;
        const chosen = opts.find((o) => o.optionNumber === selectedOptions[mt]) ?? opts[0];
        const macros = calculateMacros(chosen.foods);
        return {
          carbs: acc.carbs + macros.carbs,
          protein: acc.protein + macros.protein,
          fat: acc.fat + macros.fat,
          calories: acc.calories + macros.calories,
        };
      },
      { carbs: 0, protein: 0, fat: 0, calories: 0 },
    );
  }, [pile, selectedOptions]);

  const pileColors: Record<PileCount, string> = {
    1: '#10b981',
    2: '#f59e0b',
    3: '#ef4444',
  };
  const pileColor = pileColors[pile];

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#111827',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: pileColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          color: '#fff',
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.85 }}>
          Plan nutrition du jour
        </p>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          {pile} Pile{pile > 1 ? 's' : ''} – {plan.dayType}
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>{plan.description}</p>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div
          style={{
            background: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#92400e' }}>
            ⚡ Rappels
          </p>
          {reminders.map((r, i) => (
            <p key={i} style={{ margin: '3px 0', fontSize: 13, color: '#78350f' }}>
              {r.type === 'hydration' ? '💧' : r.type === 'gel' ? '🍬' : r.type === 'recovery' ? '🔄' : '💊'}{' '}
              {r.message}
            </p>
          ))}
        </div>
      )}

      {/* Macro summary */}
      <div
        style={{
          background: '#f9fafb',
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          border: '1px solid #e5e7eb',
        }}
      >
        <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14 }}>
          📊 Macros estimées (total journée)
        </p>
        <MacroBar label="Glucides" value={totalMacros.carbs} color="#3b82f6" />
        <MacroBar label="Protéines" value={totalMacros.protein} color="#10b981" />
        <MacroBar label="Graisses" value={totalMacros.fat} color="#f59e0b" />
        {totalMacros.calories > 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
            ≈ {Math.round(totalMacros.calories)} kcal
          </p>
        )}
      </div>

      {/* Meals */}
      {MEAL_ORDER.map((mt) => {
        const options = getMealOptions(pile, mt);
        if (options.length === 0) return null;
        return (
          <MealCard
            key={mt}
            mealType={mt}
            options={options}
            selectedOption={selectedOptions[mt] ?? 1}
            onSelectOption={(opt) => handleSelectOption(mt, opt)}
            userWeightKg={userWeightKg}
          />
        );
      })}

      {/* Supplements */}
      {supplements.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}
        >
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
            💊 Suppléments
          </h3>
          {supplements.map((s, i) => (
            <SupplementCard key={i} supplement={s} />
          ))}
        </div>
      )}

      {/* Training notes (pile 3 only) */}
      {plan.trainingNotes && plan.trainingNotes.length > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: 14,
            marginTop: 16,
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#991b1b' }}>
            🏃 Notes entraînement
          </p>
          {plan.trainingNotes.map((note, i) => (
            <p key={i} style={{ margin: '3px 0', fontSize: 13, color: '#7f1d1d' }}>
              • {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default NutritionPanel;
