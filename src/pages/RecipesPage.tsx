import { useEffect, useState } from 'react';
import { Search, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipeCard from '../components/RecipeCard';
import { getCategories, type Category } from '../lib/dashboardApi';
import { searchRecipes, toggleFavorite, toggleLike, type RecipeCard as RecipeCardData } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';

/** Catalogue complet des recettes publiées — recherche + filtre catégorie. */
export default function RecipesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        // pas bloquant — les puces de catégorie restent vides
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const timeout = setTimeout(() => {
      searchRecipes({ query, categoryId: activeCategoryId })
        .then((data) => {
          if (isMounted) setRecipes(data);
        })
        .catch((err) => {
          if (isMounted) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 250); // léger debounce pour la recherche au fil de la frappe

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [query, activeCategoryId]);

  async function handleToggleLike(recipe: RecipeCardData) {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipe.id
          ? { ...r, isLiked: !r.isLiked, likesCount: r.likesCount + (r.isLiked ? -1 : 1) }
          : r,
      ),
    );
    try {
      await toggleLike(recipe.id, recipe.isLiked);
    } catch {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, isLiked: recipe.isLiked, likesCount: recipe.likesCount } : r,
        ),
      );
    }
  }

  async function handleToggleFavorite(recipe: RecipeCardData) {
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, isFavorited: !r.isFavorited } : r)),
    );
    try {
      await toggleFavorite(recipe.id, recipe.isFavorited);
    } catch {
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, isFavorited: recipe.isFavorited } : r)),
      );
    }
  }

  return (
    <AppLayout>
      <h1 className="mb-5 text-2xl font-extrabold text-heading">Recettes</h1>

      <div className="relative mb-5 md:max-w-md">
        <Search
          size={17}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une recette…"
          className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
        />
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategoryId === null
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400'
            }`}
          >
            Toutes
          </button>
          {categories.map((c) => {
            const isActive = activeCategoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(isActive ? null : c.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {isLoading && <div className="py-20 text-center text-sm text-neutral-500">Recherche…</div>}

      {!isLoading && !error && recipes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-20 text-center text-sm text-neutral-500">
          <UtensilsCrossed size={28} strokeWidth={1.4} className="mx-auto mb-3 text-neutral-700" />
          Aucune recette ne correspond à ta recherche.
        </div>
      )}

      {!isLoading && recipes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              imageUrl={recipe.imageUrl}
              authorId={recipe.authorId}
              authorName={recipe.authorName}
              likesCount={recipe.likesCount}
              isLiked={recipe.isLiked}
              isFavorited={recipe.isFavorited}
              onToggleLike={() => handleToggleLike(recipe)}
              onToggleFavorite={() => handleToggleFavorite(recipe)}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
