import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../contexts/AuthContext';
import { getFollowers, type FollowerRow } from '../../lib/dashboardApi';

export default function FollowersPage() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<FollowerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getFollowers(user.id)
      .then((data) => {
        if (isMounted) setFollowers(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <DashboardShell title="Abonnés">
      <p className="mb-6 text-sm text-neutral-500">
        {followers.length} abonné{followers.length !== 1 ? 's' : ''}
      </p>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
      ) : followers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
          Personne ne te suit encore.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {followers.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border-b border-neutral-50 px-5 py-3.5 last:border-0"
            >
              <span className="avatar-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
                {(f.fullName ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-sm font-semibold text-neutral-900">
                {f.fullName ?? 'Utilisateur Mealora'}
              </span>
              <span className="text-xs text-neutral-500">
                Depuis le {new Date(f.followedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}