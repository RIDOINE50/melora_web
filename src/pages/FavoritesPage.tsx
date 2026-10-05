import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../contexts/AuthContext';
import { getFavoriteRecipes, toggleFavorite, toggleLike, type RecipeCard as RecipeCardData } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';

/** Page dédiée listant les recettes mises en favoris (comme sur mobile). */
export default function FavoritesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getFavoriteRecipes(user.id)
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
  }, [user]);

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
        prev.map((r) => (r.id === recipe.id ? { ...r, isLiked: recipe.isLiked, likesCount: recipe.likesCount } : r)),
      );
    }
  }

  async function handleToggleFavorite(recipe: RecipeCardData) {
    // Retrait immédiat de la liste — cohérent avec le fait que cette page
    // ne montre QUE les favoris.
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    try {
      await toggleFavorite(recipe.id, true);
    } catch (err) {
      setRecipes((prev) => [...prev, recipe]);
      setError(getErrorMessage(err));
    }
  }

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-heading sm:text-3xl">Tes favoris</h1>
        <p className="mt-1.5 text-sm text-neutral-400">Les recettes que tu as mises de côté.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {isLoading && <div className="py-20 text-center text-sm text-neutral-500">Chargement…</div>}

      {!isLoading && recipes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-20 text-center text-sm text-neutral-500">
          <Bookmark size={28} strokeWidth={1.4} className="mx-auto mb-3 text-neutral-700" />
          Tu n'as pas encore de recette en favoris.
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
