// src/components/layout/AppLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  HomeIcon, CalendarIcon, ClipboardDocumentListIcon,
  UsersIcon, ChartBarIcon, Cog6ToothIcon, BellIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
  QrCodeIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';

const navItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/meetings', icon: CalendarIcon, label: 'Meetings' },
  { to: '/attendance', icon: ClipboardDocumentListIcon, label: 'Attendance' },
  { to: '/reports', icon: ChartBarIcon, label: 'Reports' },
  { to: '/users', icon: UsersIcon, label: 'Users', roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'] },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AttendX</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Org name */}
        {user?.organization && (
          <div className="px-6 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span className="truncate">{user.organization.name}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <NavLink to="/notifications" className="relative text-gray-400 hover:text-white transition-colors">
              <BellIcon className="w-6 h-6" />
              {(notifData?.count || 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {notifData.count > 9 ? '9+' : notifData.count}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
