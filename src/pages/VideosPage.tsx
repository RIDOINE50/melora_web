import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, PlayCircle, Search, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  getFeedRecipes,
  toggleFavorite,
  toggleLike,
  type RecipeCard as RecipeCardData,
} from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';

/** Transforme une URL Cloudinary de vidéo en URL de miniature JPG. */
function cloudinaryVideoThumbnail(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  if (!videoUrl.includes('/video/upload/')) return null;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace(/\.(mp4|mov|webm|avi|mkv)$/i, '.jpg');
}

export default function VideosPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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

  // Filtre : uniquement les recettes avec vidéo
  const videoRecipes = useMemo(() => {
    return recipes
      .filter((r) => r.videoUrl)
      .filter((r) =>
        query.trim() ? r.title.toLowerCase().includes(query.trim().toLowerCase()) : true,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [recipes, query]);

  return (
    <AppLayout>
      {/* ===== En-tête ===== */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 text-neutral-300 transition hover:bg-neutral-900"
          title="Retour"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-heading sm:text-2xl">Vidéos</h1>
          <p className="text-xs text-neutral-500">
            {videoRecipes.length} vidéo{videoRecipes.length > 1 ? 's' : ''} publiée
            {videoRecipes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ===== Recherche ===== */}
      <div className="relative mb-6">
        <Search
          size={17}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une vidéo…"
          className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
        />
      </div>

      {/* ===== Erreurs ===== */}
      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* ===== Chargement ===== */}
      {isLoading && (
        <div className="py-20 text-center text-sm text-neutral-500">Chargement des vidéos…</div>
      )}

      {/* ===== Aucune vidéo ===== */}
      {!isLoading && !error && videoRecipes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-20 text-center text-sm text-neutral-500">
          <PlayCircle size={40} strokeWidth={1.3} className="mx-auto mb-3 text-neutral-700" />
          {query.trim()
            ? 'Aucune vidéo ne correspond à ta recherche.'
            : 'Aucune vidéo publiée pour l’instant.'}
        </div>
      )}

      {/* ===== Grille de vidéos ===== */}
      {!isLoading && videoRecipes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {videoRecipes.map((recipe) => {
            const thumb = cloudinaryVideoThumbnail(recipe.videoUrl);
            return (
              <article
                key={recipe.id}
                className="animate-fade-in overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700"
              >
                <div className="relative">
                  <Link to={`/recipe/${recipe.id}`} className="block">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-600">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={recipe.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UtensilsCrossed size={36} strokeWidth={1.3} />
                      )}
                      {/* Overlay play */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition group-hover:bg-black/70">
                          <PlayCircle size={26} strokeWidth={1.8} />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Like */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleLike(recipe);
                    }}
                    title="J'aime"
                    className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
                  >
                    <Heart
                      size={16}
                      strokeWidth={2}
                      className={recipe.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                  </button>
                </div>

                <div className="p-3 pt-2">
                  <Link to={`/recipe/${recipe.id}`}>
                    <h3 className="mb-1.5 line-clamp-2 text-[13px] font-bold leading-snug text-neutral-50">
                      {recipe.title}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/creator/${recipe.authorId}`}
                      className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200"
                    >
                      <span className="avatar-gradient flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white">
                        {(recipe.authorName ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{recipe.authorName ?? 'Créateur Mealora'}</span>
                    </Link>

                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-neutral-500">
                      <Heart
                        size={12}
                        strokeWidth={2}
                        className={recipe.isLiked ? 'fill-red-500 text-red-500' : ''}
                      />
                      {recipe.likesCount}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}