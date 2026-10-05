import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomePage from './HomePage';

/**
 * Route "/" : les créateurs sont redirigés vers leur tableau de bord,
 * les utilisateurs simples voient le fil d'accueil normalement.
 */
export default function RootRedirect() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">
        Chargement…
      </div>
    );
  }

  if (profile?.role === 'creator') {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
}