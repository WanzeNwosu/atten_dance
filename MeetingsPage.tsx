// src/pages/meetings/MeetingsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import {
  PlusIcon, MagnifyingGlassIcon, CalendarIcon,
  MapPinIcon, VideoCameraIcon, UserGroupIcon
} from '@heroicons/react/24/outline';

export default function MeetingsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', page, type],
    queryFn: () => api.get(`/meetings?page=${page}&limit=15${type ? `&type=${type}` : ''}`).then(r => r.data.data),
  });

  const meetings = data?.meetings || [];
  const filtered = search
    ? meetings.filter((m: any) => m.title.toLowerCase().includes(search.toLowerCase()))
    : meetings;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Meetings</h1>
        <Link to="/meetings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
          <PlusIcon className="w-4 h-4" />
          New Meeting
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search meetings..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={type} onChange={e => setType(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          <option value="PHYSICAL">Physical</option>
          <option value="VIRTUAL">Virtual</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      {/* Meeting cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No meetings found</p>
          <Link to="/meetings/new" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
            Create your first meeting
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((meeting: any) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors">
            Prev
          </button>
          <span className="text-gray-400 text-sm">Page {page} of {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: any }) {
  const start = new Date(meeting.startTime);
  const isUpcoming = start > new Date();
  const isOngoing = start <= new Date() && new Date(meeting.endTime) >= new Date();

  const typeIcons: Record<string, React.ReactNode> = {
    PHYSICAL: <MapPinIcon className="w-4 h-4" />,
    VIRTUAL: <VideoCameraIcon className="w-4 h-4" />,
    HYBRID: <UserGroupIcon className="w-4 h-4" />,
  };
  const typeColors: Record<string, string> = {
    PHYSICAL: 'text-blue-400 bg-blue-400/10',
    VIRTUAL: 'text-purple-400 bg-purple-400/10',
    HYBRID: 'text-teal-400 bg-teal-400/10',
  };

  return (
    <Link to={`/meetings/${meeting.id}`}
      className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white line-clamp-2 flex-1">{meeting.title}</h3>
        {isOngoing && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-400/10 text-green-400 text-xs rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 flex-shrink-0" />
          <span>{start.toLocaleDateString()} • {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {meeting.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{meeting.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
          <span>{meeting._count?.attendance || 0} checked in</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[meeting.type]}`}>
          {typeIcons[meeting.type]}
          {meeting.type}
        </span>
        {meeting.department && (
          <span className="text-xs text-gray-500">{meeting.department.name}</span>
        )}
      </div>
    </Link>
  );
}
