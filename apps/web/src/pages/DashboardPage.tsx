import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import { useSessionsStore } from '@/stores/sessions';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

function SessionStatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-warning-100 text-warning-700',
    completed: 'bg-success-100 text-success-700',
    skipped: 'bg-gray-100 text-gray-600',
    failed: 'bg-error-100 text-error-700',
  }[status] ?? 'bg-gray-100 text-gray-600';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const { sessions, isLoading, fetchSessions } = useSessionsStore();

  useEffect(() => {
    if (user?.id) {
      void fetchSessions(user.id);
    }
  }, [user?.id, fetchSessions]);

  const todaySessions = sessions.filter((s) => isToday(new Date(s.scheduled_date)));
  const upcomingSessions = sessions
    .filter((s) => !isPast(new Date(s.scheduled_date)) || isToday(new Date(s.scheduled_date)))
    .filter((s) => s.status === 'pending')
    .slice(0, 5);

  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const completionRate = sessions.length > 0
    ? Math.round((completedCount / sessions.length) * 100)
    : 0;

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {profile?.target_plan
            ? `Training plan: ${profile.target_plan.toUpperCase()}`
            : 'Set up your training plan to get started'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-3xl font-bold text-primary-600">{sessions.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Sessions</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-success-600">{completedCount}</div>
          <div className="text-sm text-gray-500 mt-1">Completed</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-secondary-600">{completionRate}%</div>
          <div className="text-sm text-gray-500 mt-1">Completion Rate</div>
        </Card>
      </div>

      {/* Today's session */}
      <Card title="Today's Session" actions={<Link to="/training"><Button size="sm" variant="ghost">View all</Button></Link>}>
        {todaySessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌟</div>
            <p>No session scheduled today. Rest and recover!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((session) => (
              <Link
                key={session.id}
                to={`/training/session/${session.id}`}
                className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {session.training_plan?.title ?? 'Training Session'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.training_plan?.duration_minutes && `${session.training_plan.duration_minutes} min`}
                    {session.training_plan?.distance_meters && ` • ${(session.training_plan.distance_meters / 1000).toFixed(1)}km`}
                  </div>
                </div>
                <SessionStatusBadge status={session.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming sessions */}
      <Card title="Upcoming Sessions">
        {upcomingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {sessions.length === 0 ? (
              <>
                <div className="text-4xl mb-2">🎯</div>
                <p>No training plan assigned yet.</p>
                <Link to="/training">
                  <Button className="mt-4" size="sm">Start a plan</Button>
                </Link>
              </>
            ) : (
              <p>All sessions completed! 🎉</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <Link
                key={session.id}
                to={`/training/session/${session.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-500 w-16 shrink-0">
                    {format(new Date(session.scheduled_date), 'MMM d')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.training_plan?.title ?? 'Training Session'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.training_plan?.session_type} •{' '}
                      Intensity {session.training_plan?.intensity_level}/5
                    </div>
                  </div>
                </div>
                <SessionStatusBadge status={session.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
