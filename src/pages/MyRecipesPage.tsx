import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { getCreatorRecipes, type CreatorRecipeRow } from '../lib/dashboardApi';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  published: { label: 'Publié', className: 'bg-green-950/50 text-green-400' },
  draft: { label: 'Brouillon', className: 'bg-neutral-800 text-neutral-400' },
};

/** Espace créateur — liste de ses propres recettes, publiées ou en brouillon. */
export default function MyRecipesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<CreatorRecipeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getCreatorRecipes(user.id)
      .then((data) => {
        if (isMounted) setRecipes(data);
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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-heading">Mes recettes</h1>
        <button
          onClick={() => navigate('/my-recipes/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark"
        >
          <Plus size={16} strokeWidth={2.5} />
          Créer une recette
        </button>
      </div>

      <p className="mb-6 text-sm text-neutral-400">
        {recipes.length} recette{recipes.length !== 1 ? 's' : ''} au total
      </p>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
      ) : recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          Tu n'as pas encore de recette. Clique sur "Créer une recette" pour commencer.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs font-semibold uppercase text-neutral-500">
                <th className="px-5 py-3">Recette</th>
                <th className="px-5 py-3">Likes</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => {
                const status = STATUS_LABEL[r.status ?? 'draft'] ?? STATUS_LABEL.draft;
                return (
                  <tr key={r.id} className="border-b border-neutral-800/60 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 text-neutral-500">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
                          ) : (
                            <UtensilsCrossed size={18} strokeWidth={1.5} />
                          )}
                        </div>
                        <span className="font-semibold text-neutral-100">{r.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">{r.likesCount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
