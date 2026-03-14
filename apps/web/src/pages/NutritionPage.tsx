import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import { useNutritionStore } from '@/stores/nutrition';
import { nutritionLogSchema, type NutritionLogData } from '@/types/forms';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

const pileDescriptions = {
  1: { label: 'Light', description: 'Rest or easy activity days', calories: '~1800 kcal' },
  2: { label: 'Moderate', description: 'Standard training days', calories: '~2200 kcal' },
  3: { label: 'High', description: 'Long run or intense training days', calories: '~2600 kcal' },
} as const;

export default function NutritionPage() {
  const { user } = useAuthStore();
  const { logs, todayLog, isLoading, fetchLogs, fetchTodayLog, createLog } = useNutritionStore();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<NutritionLogData>({
    resolver: zodResolver(nutritionLogSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      pile_count: 2,
      meals: [{ meal: 'breakfast', portions: {} }],
      hydration_reminder: false,
    },
  });

  const pileCount = watch('pile_count');

  useEffect(() => {
    if (user?.id) {
      void fetchLogs(user.id);
      void fetchTodayLog(user.id);
    }
  }, [user?.id, fetchLogs, fetchTodayLog]);

  const onSubmit = async (data: NutritionLogData) => {
    if (!user?.id) return;
    try {
      await createLog({
        user_id: user.id,
        date: data.date,
        pile_count: data.pile_count as 1 | 2 | 3,
        meals: data.meals,
        hydration_reminder: data.hydration_reminder,
        supplements_taken: null,
      });
      reset();
    } catch {
      // Error handled in store
    }
  };

  if (isLoading && logs.length === 0) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const selectedPile = pileDescriptions[pileCount as keyof typeof pileDescriptions];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>

      {/* Today's status */}
      {todayLog ? (
        <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
          <div className="flex items-center gap-2 text-success-700">
            <span>✅</span>
            <span className="font-medium">Today logged!</span>
            <span className="text-sm">Pile {todayLog.pile_count} — {pileDescriptions[todayLog.pile_count as keyof typeof pileDescriptions]?.label}</span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl text-warning-700 text-sm">
          ⚠️ No nutrition log for today yet.
        </div>
      )}

      {/* Log form */}
      <Card title="Log Today's Nutrition">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Pile count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level (Pile)</label>
            <div className="grid grid-cols-3 gap-3">
              {([1, 2, 3] as const).map((pile) => {
                const pileInfo = pileDescriptions[pile];
                return (
                  <label
                    key={pile}
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${pileCount === pile
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input type="radio" value={pile} {...register('pile_count', { valueAsNumber: true })} className="sr-only" />
                    <span className="text-lg">{'🔥'.repeat(pile)}</span>
                    <span className="text-sm font-medium text-gray-900 mt-1">{pileInfo.label}</span>
                    <span className="text-xs text-gray-500 text-center">{pileInfo.calories}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected pile info */}
          {selectedPile && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {selectedPile.description}
            </div>
          )}

          {/* Hydration */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="hydration" {...register('hydration_reminder')} className="accent-primary-600" />
            <label htmlFor="hydration" className="text-sm text-gray-700">
              💧 Set hydration reminder (drink 2L+ today)
            </label>
          </div>

          {errors.pile_count && (
            <p className="text-xs text-error-600">{errors.pile_count.message}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Save Today&apos;s Log
          </Button>
        </form>
      </Card>

      {/* Recent logs */}
      <Card title="Recent Logs">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No nutrition logs yet. Start tracking your nutrition above!
          </div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 14).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="text-sm text-gray-700">{format(new Date(log.date), 'EEEE, MMM d')}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {'🔥'.repeat(log.pile_count)} {pileDescriptions[log.pile_count as keyof typeof pileDescriptions]?.label}
                  </span>
                  {log.hydration_reminder && <span title="Hydration reminder set">💧</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
