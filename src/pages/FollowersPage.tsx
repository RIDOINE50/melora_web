import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { getFollowers, type FollowerRow } from '../lib/dashboardApi';

/** Espace créateur — liste des abonnés. */
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
    <AppLayout>
      <h1 className="mb-5 text-2xl font-extrabold text-heading">Abonnés</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {followers.length} abonné{followers.length !== 1 ? 's' : ''}
      </p>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
      ) : followers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          Personne ne te suit encore.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          {followers.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border-b border-neutral-800/60 px-5 py-3.5 last:border-0"
            >
              <span className="avatar-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
                {(f.fullName ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-sm font-semibold text-neutral-100">
                {f.fullName ?? 'Utilisateur Mealora'}
              </span>
              <span className="text-xs text-neutral-500">
                Depuis le {new Date(f.followedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
