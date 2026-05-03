// src/pages/meetings/MeetingDetail.tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, QrCodeIcon, ChartBarIcon,
  MapPinIcon, CalendarIcon, UserGroupIcon,
  TrashIcon, PencilIcon, PlayIcon
} from '@heroicons/react/24/outline';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => api.get(`/meetings/${id}`).then(r => r.data.data),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['meeting-attendance', id],
    queryFn: () => api.get(`/meetings/${id}/attendance`).then(r => r.data.data),
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/meetings/${id}`),
    onSuccess: () => { toast.success('Meeting deleted'); navigate('/meetings'); },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse" />
        <div className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!meeting) return <div className="p-6 text-gray-400">Meeting not found</div>;

  const canManage = meeting.hostId === user?.id || ['ORG_ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(user?.role || '');
  const isOngoing = new Date(meeting.startTime) <= new Date() && new Date(meeting.endTime) >= new Date();
  const stats = attendanceData?.stats || {};
  const records = attendanceData?.records || [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mt-1">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white truncate">{meeting.title}</h1>
            {isOngoing && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-400/10 text-green-400 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          {meeting.description && <p className="text-gray-400 mt-1 text-sm">{meeting.description}</p>}
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <Link to={`/meetings/${id}/live`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors">
            <PlayIcon className="w-4 h-4" />
            Live View
          </Link>
          <Link to={`/meetings/${id}/qr`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
            <QrCodeIcon className="w-4 h-4" />
            QR Code
          </Link>
          <Link to={`/meetings/${id}?edit=1`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
            <PencilIcon className="w-4 h-4" />
            Edit
          </Link>
          <button onClick={() => { if (confirm('Delete this meeting?')) deleteMutation.mutate(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-xl transition-colors">
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white">Details</h2>

            <InfoRow icon={<CalendarIcon className="w-4 h-4" />} label="Start">
              {new Date(meeting.startTime).toLocaleString()}
            </InfoRow>
            <InfoRow icon={<CalendarIcon className="w-4 h-4" />} label="End">
              {new Date(meeting.endTime).toLocaleString()}
            </InfoRow>
            {meeting.location && (
              <InfoRow icon={<MapPinIcon className="w-4 h-4" />} label="Location">
                {meeting.location}
              </InfoRow>
            )}
            <InfoRow icon={<UserGroupIcon className="w-4 h-4" />} label="Host">
              {meeting.host?.firstName} {meeting.host?.lastName}
            </InfoRow>

            <div className="pt-2 border-t border-gray-800 space-y-2">
              {meeting.requireBiometric && <Badge color="purple">Biometric Required</Badge>}
              {meeting.requireGPS && <Badge color="blue">GPS Required</Badge>}
              <Badge color={meeting.type === 'PHYSICAL' ? 'blue' : meeting.type === 'VIRTUAL' ? 'purple' : 'teal'}>
                {meeting.type}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Present', value: stats.present || 0, color: 'text-green-400' },
                { label: 'Late', value: stats.late || 0, color: 'text-yellow-400' },
                { label: 'Absent', value: stats.absent || 0, color: 'text-red-400' },
                { label: 'Total', value: stats.total || 0, color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Export */}
            <div className="mt-4 flex gap-2">
              {['pdf', 'csv', 'excel'].map(fmt => (
                <a key={fmt}
                  href={`${import.meta.env.VITE_API_URL}/meetings/${id}/export?format=${fmt}`}
                  className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs text-center rounded-lg transition-colors">
                  {fmt.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Attendees table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Attendees ({records.length})</h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No check-ins yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-800">
                    <th className="pb-3 text-gray-400 font-medium">Name</th>
                    <th className="pb-3 text-gray-400 font-medium">Check-in</th>
                    <th className="pb-3 text-gray-400 font-medium">Method</th>
                    <th className="pb-3 text-gray-400 font-medium">Status</th>
                    <th className="pb-3 text-gray-400 font-medium">GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {records.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {r.user.firstName[0]}{r.user.lastName[0]}
                          </div>
                          <span className="text-white">{r.user.firstName} {r.user.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{r.checkInMethod || '—'}</td>
                      <td className="py-3"><StatusBadge status={r.status} /></td>
                      <td className="py-3 text-xs">
                        {r.gpsVerified
                          ? <span className="text-green-400">✓</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white">{children}</p>
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-400/10 text-purple-400',
    blue: 'bg-blue-400/10 text-blue-400',
    teal: 'bg-teal-400/10 text-teal-400',
    green: 'bg-green-400/10 text-green-400',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colors[color] || 'bg-gray-700 text-gray-300'}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    PRESENT: 'bg-green-400/10 text-green-400',
    LATE: 'bg-yellow-400/10 text-yellow-400',
    ABSENT: 'bg-red-400/10 text-red-400',
    EXCUSED: 'bg-blue-400/10 text-blue-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s[status] || 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  );
}
