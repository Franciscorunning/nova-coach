import { useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuthStore } from '@/stores/auth';
import { useSessionsStore } from '@/stores/sessions';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

function renderPieLabel({ name, percent }: { name: string; percent: number }) {
  return `${name} ${Math.round(percent * 100)}%`;
}

export default function StatisticsPage() {
  const { user } = useAuthStore();
  const { sessions, isLoading, fetchSessions } = useSessionsStore();

  useEffect(() => {
    if (user?.id) void fetchSessions(user.id);
  }, [user?.id, fetchSessions]);

  // Last 30 days activity
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const daySession = sessions.find((s) => s.scheduled_date === date);
    return {
      date: format(subDays(new Date(), 29 - i), 'MMM d'),
      completed: daySession?.status === 'completed' ? 1 : 0,
      skipped: daySession?.status === 'skipped' ? 1 : 0,
    };
  });

  // Status distribution
  const statusData = [
    { name: 'Completed', value: sessions.filter((s) => s.status === 'completed').length },
    { name: 'Pending', value: sessions.filter((s) => s.status === 'pending').length },
    { name: 'Skipped', value: sessions.filter((s) => s.status === 'skipped').length },
    { name: 'Failed', value: sessions.filter((s) => s.status === 'failed').length },
  ].filter((d) => d.value > 0);

  // Weekly distance
  const weeklyData = sessions
    .filter((s) => s.status === 'completed' && s.actual_distance_meters)
    .reduce<Record<string, number>>((acc, s) => {
      const week = format(new Date(s.scheduled_date), "'Week' w");
      acc[week] = (acc[week] ?? 0) + Number(s.actual_distance_meters ?? 0) / 1000;
      return acc;
    }, {});

  const weeklyChartData = Object.entries(weeklyData).map(([week, km]) => ({
    week,
    km: Math.round(km * 10) / 10,
  }));

  if (isLoading && sessions.length === 0) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalDistance = completedSessions.reduce((sum, s) => sum + Number(s.actual_distance_meters ?? 0), 0);
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.actual_duration_seconds ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-2xl font-bold text-primary-600">{completedSessions.length}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions Done</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-success-600">{(totalDistance / 1000).toFixed(1)}km</div>
          <div className="text-xs text-gray-500 mt-1">Total Distance</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-secondary-600">{Math.round(totalDuration / 60)}min</div>
          <div className="text-xs text-gray-500 mt-1">Total Time</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-warning-600">
            {sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Completion Rate</div>
        </Card>
      </div>

      {/* Activity chart - last 30 days */}
      <Card title="Activity (Last 30 Days)">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Complete sessions to see your activity chart</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last30Days} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" />
              <Bar dataKey="skipped" fill="#f59e0b" name="Skipped" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly distance */}
        <Card title="Weekly Distance (km)">
          {weeklyChartData.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Log your distances to see weekly progress</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="km" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status distribution */}
        <Card title="Session Distribution">
          {statusData.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={renderPieLabel} labelLine={false}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
