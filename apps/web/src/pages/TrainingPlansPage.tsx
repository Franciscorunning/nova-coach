import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import { useSessionsStore } from '@/stores/sessions';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

const planDescriptions = {
  galloway: {
    name: 'Galloway Method',
    description: 'Run/walk intervals designed for beginners. Build endurance without injury.',
    duration: '12 weeks',
    icon: '🚶‍♂️',
  },
  '15km': {
    name: '15km Program',
    description: 'Progressive training to run 15km continuously.',
    duration: '16 weeks',
    icon: '🏃',
  },
  semi: {
    name: 'Semi-Marathon',
    description: 'Complete 21.1km. For runners with a solid base.',
    duration: '20 weeks',
    icon: '🏅',
  },
} as const;

const sessionTypeColors: Record<string, string> = {
  E1: 'bg-blue-100 text-blue-700',
  E2: 'bg-green-100 text-green-700',
  E3: 'bg-yellow-100 text-yellow-700',
  E4: 'bg-orange-100 text-orange-700',
  MUSCU: 'bg-purple-100 text-purple-700',
  REPOS: 'bg-gray-100 text-gray-600',
};

export default function TrainingPlansPage() {
  const { user, profile } = useAuthStore();
  const { sessions, trainingPlans, isLoading, fetchSessions, fetchTrainingPlans, assignPlan } = useSessionsStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(profile?.target_plan ?? 'galloway');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (user?.id) {
      void fetchSessions(user.id);
    }
    void fetchTrainingPlans(selectedPlan);
  }, [user?.id, selectedPlan, fetchSessions, fetchTrainingPlans]);

  const weekGroups = trainingPlans.reduce<Record<number, typeof trainingPlans>>((acc, plan) => {
    if (!acc[plan.week_number]) acc[plan.week_number] = [];
    acc[plan.week_number].push(plan);
    return acc;
  }, {});

  const handleAssignPlan = async () => {
    if (!user?.id) return;
    setIsAssigning(true);
    try {
      await assignPlan(user.id, selectedPlan, new Date());
      await fetchSessions(user.id);
    } catch {
      // Error handled in store
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading && trainingPlans.length === 0) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Plans</h1>
        {sessions.length > 0 && (
          <span className="text-sm text-success-600 font-medium">✅ Plan assigned ({sessions.length} sessions)</span>
        )}
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(planDescriptions) as [string, typeof planDescriptions[keyof typeof planDescriptions]][]).map(([key, plan]) => (
          <button
            key={key}
            onClick={() => setSelectedPlan(key)}
            className={`
              text-left p-4 rounded-xl border-2 transition-all duration-200
              ${selectedPlan === key
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="text-2xl mb-2">{plan.icon}</div>
            <div className="font-semibold text-gray-900 text-sm">{plan.name}</div>
            <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
            <div className="text-xs text-primary-600 font-medium mt-2">{plan.duration}</div>
          </button>
        ))}
      </div>

      {/* Assign button */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {planDescriptions[selectedPlan as keyof typeof planDescriptions]?.name ?? selectedPlan}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Start date: {format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
          <Button onClick={handleAssignPlan} isLoading={isAssigning}>
            {sessions.length > 0 ? 'Reassign Plan' : 'Start This Plan'}
          </Button>
        </div>
      </Card>

      {/* Week-by-week schedule */}
      {Object.entries(weekGroups).map(([week, planSessions]) => (
        <Card key={week} title={`Week ${week}`} noPadding>
          <div className="divide-y divide-gray-100">
            {planSessions.map((plan) => {
              const userSession = sessions.find((s) => s.plan_session_id === plan.id);
              return (
                <div key={plan.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${sessionTypeColors[plan.session_type ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                      {plan.session_type ?? 'SESSION'}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                      <div className="text-xs text-gray-400">
                        {plan.duration_minutes && `${plan.duration_minutes}min`}
                        {plan.distance_meters && ` • ${(plan.distance_meters / 1000).toFixed(1)}km`}
                        {plan.intensity_level && ` • Intensity ${plan.intensity_level}/5`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {userSession && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(userSession.scheduled_date), 'MMM d')}
                      </span>
                    )}
                    {userSession ? (
                      <Link to={`/training/session/${userSession.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
