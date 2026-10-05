import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Comme ProtectedRoute, mais réservé aux comptes créateur. */
export default function CreatorRoute({ children }: { children: ReactNode }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">
        Chargement…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'creator') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
