// src/pages/dashboard/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import {
  UsersIcon, CalendarIcon, CheckCircleIcon,
  ClockIcon, ExclamationCircleIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: trends } = useQuery({
    queryKey: ['trends', 14],
    queryFn: () => api.get('/reports/trends?days=14').then(r => r.data.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-meetings'],
    queryFn: () => api.get('/meetings/upcoming').then(r => r.data.data),
  });

  const todayStats = dashboard?.todayAttendance?.reduce((acc: any, item: any) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {}) || {};

  const statsCards = [
    { label: 'Present Today', value: todayStats.PRESENT || 0, icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Late Today', value: todayStats.LATE || 0, icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Absent Today', value: todayStats.ABSENT || 0, icon: ExclamationCircleIcon, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Active Meetings', value: dashboard?.activeMeetings?.length || 0, icon: CalendarIcon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  // Build chart data
  const trendLabels = trends ? Object.keys(trends).slice(-14).map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }) : [];
  const presentData = trends ? Object.values(trends).slice(-14).map((d: any) => d.present || 0) : [];
  const lateData = trends ? Object.values(trends).slice(-14).map((d: any) => d.late || 0) : [];

  const chartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Present',
        data: presentData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Late',
        data: lateData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
    },
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()}, {user?.firstName}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/meetings/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <CalendarIcon className="w-4 h-4" />
          New Meeting
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{isLoading ? '—' : value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Attendance Trends (14 days)</h2>
          </div>
          <div className="h-52">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Upcoming meetings */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Upcoming Meetings</h2>
          {(!upcoming || upcoming.length === 0) ? (
            <p className="text-gray-500 text-sm text-center py-8">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((m: any) => (
                <Link key={m.id} to={`/meetings/${m.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-300 leading-none">
                      {new Date(m.startTime).getDate()}
                    </span>
                    <span className="text-[10px] text-indigo-400 uppercase">
                      {new Date(m.startTime).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(m.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent check-ins */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Recent Check-ins</h2>
        {(!dashboard?.recentCheckins || dashboard.recentCheckins.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-8">No check-ins today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  <th className="pb-3 text-gray-400 font-medium">Name</th>
                  <th className="pb-3 text-gray-400 font-medium">Meeting</th>
                  <th className="pb-3 text-gray-400 font-medium">Time</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {dashboard.recentCheckins.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-3 text-white">
                      {r.user.firstName} {r.user.lastName}
                    </td>
                    <td className="py-3 text-gray-400 truncate max-w-[160px]">{r.meeting.title}</td>
                    <td className="py-3 text-gray-400">
                      {new Date(r.checkInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PRESENT: 'bg-green-400/10 text-green-400',
    LATE: 'bg-yellow-400/10 text-yellow-400',
    ABSENT: 'bg-red-400/10 text-red-400',
    EXCUSED: 'bg-blue-400/10 text-blue-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
