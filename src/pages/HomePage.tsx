import { useEffect, useMemo, useState } from 'react';
import { Heart, Search, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../contexts/AuthContext';
import { getFeedRecipes, toggleFavorite, toggleLike, type RecipeCard as RecipeCardData } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';

export default function HomePage() {
  const { profile } = useAuth();

  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getFeedRecipes()
      .then((data) => {
        if (isMounted) setRecipes(data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

  const categories = useMemo(() => {
    const seen = new Map<number, { name: string; imageUrl: string | null }>();
    recipes.forEach((r) => {
      if (r.categoryId && r.categoryName && !seen.has(r.categoryId)) {
        seen.set(r.categoryId, { name: r.categoryName, imageUrl: r.imageUrl });
      }
    });
    return Array.from(seen, ([id, v]) => ({ id, ...v }));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (activeCategoryId !== null && r.categoryId !== activeCategoryId) return false;
      if (query.trim() && !r.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [recipes, activeCategoryId, query]);

  const featured = !query && activeCategoryId === null
    ? [...recipes].sort((a, b) => b.likesCount - a.likesCount)[0]
    : null;
  const popularRecipes = featured ? filteredRecipes.filter((r) => r.id !== featured.id) : filteredRecipes;

  return (
    <AppLayout>
      <div className="md:max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-heading sm:text-3xl">
          {`Bonjour${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋`}
        </h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          Découvre les dernières recettes publiées par la communauté.
        </p>
      </div>

      <>
          <div className="relative mb-5">
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
            <div className="mb-6 flex gap-4 overflow-x-auto pb-1">
              {categories.map((c) => {
                const isActive = activeCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategoryId(isActive ? null : c.id)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition ${
                        isActive ? 'border-accent' : 'border-neutral-800'
                      }`}
                    >
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-500">
                          <UtensilsCrossed size={20} strokeWidth={1.6} />
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${isActive ? 'text-accent' : 'text-neutral-400'}`}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {isLoading && <div className="py-20 text-center text-sm text-neutral-500">Chargement du fil…</div>}

      {!isLoading && !error && recipes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-20 text-center text-sm text-neutral-500">
          Aucune recette publiée pour l'instant.
        </div>
      )}

      {!isLoading && !error && recipes.length > 0 && filteredRecipes.length === 0 && !featured && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-20 text-center text-sm text-neutral-500">
          Aucune recette ne correspond.
        </div>
      )}

      {featured && (
        <div className="mb-7">
          <h2 className="mb-3 text-sm font-bold text-neutral-200">À la une</h2>
          <div className="relative overflow-hidden rounded-2xl">
            <Link to={`/recipe/${featured.id}`} className="group block">
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-600">
                {featured.imageUrl ? (
                  <img
                    src={featured.imageUrl}
                    alt={featured.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <UtensilsCrossed size={48} strokeWidth={1.3} />
                )}
              </div>
            </Link>
            <button
              onClick={() => handleToggleLike(featured)}
              className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
            >
              <Heart
                size={18}
                strokeWidth={2}
                className={featured.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}
              />
            </button>
          </div>
          <Link to={`/recipe/${featured.id}`}>
            <h3 className="mt-3 text-base font-extrabold text-heading">{featured.title}</h3>
          </Link>
        </div>
      )}
      </div>

      {popularRecipes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-200">Recettes populaires</h2>
            <button
              onClick={() => {
                setQuery('');
                setActiveCategoryId(null);
              }}
              className="text-xs font-semibold text-accent hover:text-accent-dark"
            >
              Voir tout
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {popularRecipes.map((recipe) => (
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
        </div>
      )}
    </AppLayout>
  );
}
