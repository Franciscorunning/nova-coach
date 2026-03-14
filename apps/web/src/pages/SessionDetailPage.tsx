import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useSessionsStore } from '@/stores/sessions';
import { sessionFeedbackSchema, type SessionFeedbackData } from '@/types/forms';
import { formatDuration } from '@/utils/strava';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';

const intensityLabels = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Maximum'];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSession, isLoading, fetchSession, completeSession, updateSessionStatus } = useSessionsStore();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SessionFeedbackData>({
    resolver: zodResolver(sessionFeedbackSchema),
    defaultValues: {
      difficulty: 3,
      felt_good: true,
    },
  });

  useEffect(() => {
    if (id) void fetchSession(id);
  }, [id, fetchSession]);

  const onComplete = async (data: SessionFeedbackData) => {
    if (!id) return;
    try {
      await completeSession(
        id,
        { difficulty: data.difficulty as 1 | 2 | 3 | 4 | 5, notes: data.notes, felt_good: data.felt_good },
        data.actual_duration_seconds,
        data.actual_distance_meters
      );
      navigate('/training');
    } catch {
      // Error handled in store
    }
  };

  const onSkip = async () => {
    if (!id) return;
    try {
      await updateSessionStatus(id, 'skipped');
      navigate('/training');
    } catch {
      // Error handled in store
    }
  };

  if (isLoading || !currentSession) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const plan = currentSession.training_plan;
  const isCompleted = currentSession.status === 'completed';
  const difficulty = watch('difficulty');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/training" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        ← Back to Training
      </Link>

      {/* Session header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{plan?.title ?? 'Training Session'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Scheduled: {format(new Date(currentSession.scheduled_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            isCompleted ? 'bg-success-100 text-success-700' :
            currentSession.status === 'skipped' ? 'bg-gray-100 text-gray-600' :
            'bg-warning-100 text-warning-700'
          }`}>
            {currentSession.status}
          </span>
        </div>

        {plan && (
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {plan.duration_minutes && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">{plan.duration_minutes}</div>
                <div className="text-xs text-gray-500">minutes</div>
              </div>
            )}
            {plan.distance_meters && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">
                  {(plan.distance_meters / 1000).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">km</div>
              </div>
            )}
            {plan.intensity_level && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">{plan.intensity_level}/5</div>
                <div className="text-xs text-gray-500">intensity</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Description */}
      {plan?.description && (
        <Card title="Instructions">
          <p className="text-sm text-gray-700 whitespace-pre-line">{plan.description}</p>
        </Card>
      )}

      {/* Strava sync indicator */}
      {currentSession.strava_activity_id && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
          <span>🔗</span>
          <span>Synced with Strava activity #{currentSession.strava_activity_id}</span>
        </div>
      )}

      {/* Actual results (if completed) */}
      {isCompleted && (
        <Card title="Results">
          <div className="grid grid-cols-2 gap-4">
            {currentSession.actual_duration_seconds && (
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium">{formatDuration(currentSession.actual_duration_seconds)}</div>
              </div>
            )}
            {currentSession.actual_distance_meters && (
              <div>
                <div className="text-sm text-gray-500">Distance</div>
                <div className="font-medium">{(Number(currentSession.actual_distance_meters) / 1000).toFixed(2)}km</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Feedback form (only for pending sessions) */}
      {!isCompleted && currentSession.status === 'pending' && (
        <Card title="Log Your Session">
          <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
            {/* Actual results */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (seconds)"
                type="number"
                placeholder="e.g. 1800"
                hint="Optional"
                error={errors.actual_duration_seconds?.message}
                {...register('actual_duration_seconds', { valueAsNumber: true })}
              />
              <Input
                label="Distance (meters)"
                type="number"
                placeholder="e.g. 5000"
                hint="Optional"
                error={errors.actual_distance_meters?.message}
                {...register('actual_distance_meters', { valueAsNumber: true })}
              />
            </div>

            {/* Difficulty rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty: {intensityLabels[difficulty] ?? 'Moderate'}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                className="w-full accent-primary-600"
                {...register('difficulty', { valueAsNumber: true })}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Very Easy</span>
                <span>Maximum</span>
              </div>
            </div>

            {/* Felt good */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="felt_good" {...register('felt_good')} className="accent-primary-600" />
              <label htmlFor="felt_good" className="text-sm text-gray-700">I felt good during this session</label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                className="input resize-none h-20"
                placeholder="How did it go? Any observations..."
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                ✅ Mark Complete
              </Button>
              <Button type="button" variant="secondary" onClick={onSkip} isLoading={isLoading}>
                Skip
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
