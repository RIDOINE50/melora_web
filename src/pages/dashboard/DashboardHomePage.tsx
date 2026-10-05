import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Star, UsersRound, UtensilsCrossed } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatCard from '../../components/dashboard/StatCard';
import TrendChart from '../../components/dashboard/TrendChart';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCreatorRecipes,
  getDashboardStats,
  getLikesTrend,
  type CreatorRecipeRow,
  type DashboardStats,
  type TrendPoint,
} from '../../lib/dashboardApi';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  published: { label: 'Publié', className: 'bg-green-50 text-green-700' },
  draft: { label: 'Brouillon', className: 'bg-neutral-100 text-neutral-600' },
};

export default function DashboardHomePage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<CreatorRecipeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([
      getDashboardStats(user.id),
      getLikesTrend(user.id, 7),
      getCreatorRecipes(user.id, 5),
    ])
      .then(([s, t, r]) => {
        if (!isMounted) return;
        setStats(s);
        setTrend(t);
        setRecentRecipes(r);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <DashboardShell title="Tableau de bord">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">
            Bonjour, {profile?.full_name?.split(' ')[0] || 'Créateur'} 👋
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Voici un aperçu de votre activité aujourd'hui.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/recipes/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ajouter une recette
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Recettes"
          value={stats?.recipesCount ?? '—'}
          icon={UtensilsCrossed}
          hint={stats ? `${stats.publishedCount} publiée${stats.publishedCount !== 1 ? 's' : ''}` : undefined}
        />
        <StatCard label="Vues (likes)" value={stats?.totalLikes ?? '—'} icon={Heart} hint="Sur toutes tes recettes" />
        <StatCard label="Favoris" value={stats?.totalFavorites ?? '—'} icon={Star} hint="Enregistrements" />
        <StatCard label="Abonnés" value={stats?.followersCount ?? '—'} icon={UsersRound} />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Évolution des likes (7 derniers jours)</h3>
        </div>
        <TrendChart data={trend} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h3 className="text-sm font-bold text-neutral-900">Recettes récentes</h3>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">Chargement…</div>
        ) : recentRecipes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            Aucune recette pour l'instant — clique sur "Ajouter une recette" pour commencer.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase text-neutral-500">
                <th className="px-5 py-3">Recette</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Likes</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentRecipes.map((r) => {
                const status = STATUS_LABEL[r.status ?? 'draft'] ?? STATUS_LABEL.draft;
                return (
                  <tr key={r.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-neutral-900">{r.title}</td>
                    <td className="px-5 py-3 text-neutral-500">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">{r.likesCount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}