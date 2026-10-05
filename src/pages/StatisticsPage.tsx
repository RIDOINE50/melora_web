import { useEffect, useState } from 'react';
import { Heart, Star, UsersRound, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import { useAuth } from '../contexts/AuthContext';
import {
  getCreatorRecipes,
  getDashboardStats,
  getLikesTrend,
  type CreatorRecipeRow,
  type DashboardStats,
  type TrendPoint,
} from '../lib/dashboardApi';

type Period = 7 | 30;

/** Espace créateur — statistiques (recettes, likes, favoris, abonnés). */
export default function StatisticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topRecipes, setTopRecipes] = useState<CreatorRecipeRow[]>([]);
  const [period, setPeriod] = useState<Period>(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    Promise.all([getDashboardStats(user.id), getLikesTrend(user.id, period), getCreatorRecipes(user.id)])
      .then(([s, t, recipes]) => {
        if (!isMounted) return;
        setStats(s);
        setTrend(t);
        setTopRecipes([...recipes].sort((a, b) => b.likesCount - a.likesCount).slice(0, 5));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user, period]);

  return (
    <AppLayout>
      <h1 className="mb-5 text-2xl font-extrabold text-heading">Statistiques</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Recettes" value={stats?.recipesCount ?? '—'} icon={UtensilsCrossed} />
        <StatCard label="Likes reçus" value={stats?.totalLikes ?? '—'} icon={Heart} />
        <StatCard label="Favoris" value={stats?.totalFavorites ?? '—'} icon={Star} />
        <StatCard label="Abonnés" value={stats?.followersCount ?? '—'} icon={UsersRound} />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-heading">Évolution des likes</h3>
          <div className="flex gap-1 rounded-lg bg-neutral-950 p-1">
            {([7, 30] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  period === p ? 'bg-accent text-white' : 'text-neutral-400'
                }`}
              >
                {p} jours
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
        ) : (
          <TrendChart data={trend} />
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 px-5 py-4">
          <h3 className="text-sm font-bold text-heading">Recettes les plus aimées</h3>
        </div>
        {topRecipes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            Pas encore assez de données.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs font-semibold uppercase text-neutral-500">
                <th className="px-5 py-3">Recette</th>
                <th className="px-5 py-3">Likes</th>
              </tr>
            </thead>
            <tbody>
              {topRecipes.map((r) => (
                <tr key={r.id} className="border-b border-neutral-800/60 last:border-0">
                  <td className="px-5 py-3 font-semibold text-neutral-100">{r.title}</td>
                  <td className="px-5 py-3 text-neutral-400">{r.likesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
