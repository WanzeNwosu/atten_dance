// src/components/common/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export function PrivateRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


// src/components/common/LoadingScreen.tsx
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 19v1M6.343 17.657l-.707.707M5 12H4M6.343 6.343l.707.707" />
          </svg>
        </div>
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-gray-400 text-sm">Loading AttendX...</p>
      </div>
      <style>{`
        @keyframes loading {
          0% { width: 0; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
