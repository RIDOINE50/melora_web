import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bookmark,
  Clock,
  Flame,
  Heart,
  Send,
  Star,
  Trash2,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { getRecipeById, toggleFavorite, toggleLike, type RecipeDetail } from '../lib/recipesApi';
import { addComment, deleteComment, getComments, type RecipeComment } from '../lib/commentsApi';
import {
  getMyRecipeRating,
  getRecipeIngredients,
  getRecipeNutritionExtra,
  getRecipeRatingSummary,
  getRecipeSteps,
  rateRecipe,
  type RecipeIngredientItem,
  type RecipeNutritionExtra,
  type RecipeRatingSummary,
  type RecipeStepItem,
} from '../lib/recipeExtrasApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

type TabKey = 'about' | 'ingredients' | 'steps' | 'comments';

function StarRating({
  value,
  onRate,
  disabled,
}: {
  value: number;
  onRate?: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onRate || disabled}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(n)}
          className={onRate ? 'cursor-pointer' : 'cursor-default'}
          title={onRate ? `Noter ${n}/5` : undefined}
        >
          <Star
            size={onRate ? 22 : 14}
            strokeWidth={2}
            className={n <= display ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}
          />
        </button>
      ))}
    </div>
  );
}

/** Page de consultation d'une recette — infos complètes, nutrition, vidéo, ingrédients, étapes, notes et commentaires (parité avec le détail mobile). */
export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = id ? Number(id) : NaN;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredientItem[]>([]);
  const [steps, setSteps] = useState<RecipeStepItem[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RecipeRatingSummary>({ average: 0, count: 0 });
  const [nutritionExtra, setNutritionExtra] = useState<RecipeNutritionExtra>({ fiberG: null, sugarG: null });
  const [myRating, setMyRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [tab, setTab] = useState<TabKey>('about');

  useEffect(() => {
    if (!recipeId || Number.isNaN(recipeId)) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getRecipeById(recipeId),
      getComments(recipeId),
      getRecipeIngredients(recipeId),
      getRecipeSteps(recipeId),
      getRecipeRatingSummary(recipeId),
      getMyRecipeRating(recipeId, user?.id ?? null),
      getRecipeNutritionExtra(recipeId).catch(() => ({ fiberG: null, sugarG: null })),
    ])
      .then(([recipeData, commentsData, ingredientsData, stepsData, ratingData, myRatingData, nutritionExtraData]) => {
        if (!isMounted) return;
        setRecipe(recipeData);
        setComments(commentsData);
        setIngredients(ingredientsData);
        setSteps(stepsData);
        setRatingSummary(ratingData);
        setMyRating(myRatingData);
        setNutritionExtra(nutritionExtraData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, user?.id]);

  async function handleToggleLike() {
    if (!recipe) return;
    const wasLiked = recipe.isLiked;
    setRecipe({ ...recipe, isLiked: !wasLiked, likesCount: recipe.likesCount + (wasLiked ? -1 : 1) });
    try {
      await toggleLike(recipe.id, wasLiked);
    } catch (err) {
      setRecipe((prev) => (prev ? { ...prev, isLiked: wasLiked, likesCount: recipe.likesCount } : prev));
      setError(getErrorMessage(err));
    }
  }

  async function handleToggleFavorite() {
    if (!recipe) return;
    const wasFavorited = recipe.isFavorited;
    setRecipe({ ...recipe, isFavorited: !wasFavorited });
    try {
      await toggleFavorite(recipe.id, wasFavorited);
      showToast(wasFavorited ? 'Retiré des favoris.' : 'Ajouté aux favoris.');
    } catch (err) {
      setRecipe((prev) => (prev ? { ...prev, isFavorited: wasFavorited } : prev));
      setError(getErrorMessage(err));
    }
  }

  async function handleRate(rating: number) {
    if (!recipe || !user) return;
    const previous = myRating;
    const previousSummary = ratingSummary;
    // optimiste : recalcul simple de la moyenne affichée
    const wasRated = previous !== null;
    const newCount = wasRated ? ratingSummary.count : ratingSummary.count + 1;
    const newTotal = (wasRated ? ratingSummary.average * ratingSummary.count - previous! : ratingSummary.average * ratingSummary.count) + rating;
    setMyRating(rating);
    setRatingSummary({ average: newCount > 0 ? newTotal / newCount : 0, count: newCount });
    try {
      await rateRecipe(recipe.id, rating);
      showToast('Merci pour ta note !');
    } catch (err) {
      setMyRating(previous);
      setRatingSummary(previousSummary);
      setError(getErrorMessage(err));
    }
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !recipe) return;
    setIsPostingComment(true);
    try {
      await addComment({ recipeId: recipe.id, content: commentText });
      setCommentText('');
      setComments(await getComments(recipe.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPostingComment(false);
    }
  }

  async function handleDeleteComment(comment: RecipeComment) {
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    try {
      await deleteComment(comment.id);
    } catch (err) {
      setError(getErrorMessage(err));
      setComments((prev) => [...prev, comment].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
          Chargement de la recette…
        </div>
      </AppLayout>
    );
  }

  if (!recipe) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          {error ?? 'Recette introuvable.'}
        </div>
      </AppLayout>
    );
  }

  const hasNutrition =
    recipe.caloriesKcal != null ||
    recipe.carbsG != null ||
    recipe.fatG != null ||
    recipe.proteinG != null ||
    nutritionExtra.fiberG != null ||
    nutritionExtra.sugarG != null;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'about', label: 'À propos' },
    { key: 'ingredients', label: `Ingrédients${ingredients.length ? ` (${ingredients.length})` : ''}` },
    { key: 'steps', label: `Étapes${steps.length ? ` (${steps.length})` : ''}` },
    { key: 'comments', label: `Commentaires${comments.length ? ` (${comments.length})` : ''}` },
  ];

  return (
    <AppLayout>
      <div className="md:max-w-3xl">
        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="relative">
            {recipe.resolvedVideoUrl ? (
              <video
                src={recipe.resolvedVideoUrl}
                poster={recipe.imageUrl ?? undefined}
                controls
                className="aspect-video w-full bg-black object-contain"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-600">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
                ) : (
                  <UtensilsCrossed size={48} strokeWidth={1.3} />
                )}
              </div>
            )}
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={handleToggleLike}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
              >
                <Heart size={17} strokeWidth={2} className={recipe.isLiked ? 'fill-red-500 text-red-500' : 'text-white'} />
              </button>
              <button
                onClick={handleToggleFavorite}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
              >
                <Bookmark
                  size={17}
                  strokeWidth={2}
                  className={recipe.isFavorited ? 'fill-accent text-accent' : 'text-white'}
                />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {recipe.categoryName && (
              <span className="mb-2 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                {recipe.categoryName}
              </span>
            )}
            <h1 className="mb-2 text-xl font-extrabold text-heading sm:text-2xl">{recipe.title}</h1>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/creator/${recipe.authorId}`}
                className="flex w-fit items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-neutral-200"
              >
                <span className="avatar-gradient flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {(recipe.authorName ?? '?').charAt(0).toUpperCase()}
                </span>
                {recipe.authorName ?? 'Créateur Mealora'}
              </Link>

              <div className="flex items-center gap-2">
                <StarRating value={myRating ?? Math.round(ratingSummary.average)} onRate={user ? handleRate : undefined} />
                <span className="text-xs font-semibold text-neutral-400">
                  {ratingSummary.count > 0
                    ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} avis)`
                    : 'Pas encore noté'}
                </span>
              </div>
            </div>

            {recipe.description && <p className="mb-4 text-sm text-neutral-300">{recipe.description}</p>}

            <div className="mb-2 flex flex-wrap gap-4 text-xs font-semibold text-neutral-400">
              {(recipe.prepTime || recipe.cookTime) && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={2} />
                  {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5">
                  <Users size={14} strokeWidth={2} />
                  {recipe.servings} portion{recipe.servings > 1 ? 's' : ''}
                </span>
              )}
              {recipe.difficulty && (
                <span className="flex items-center gap-1.5">
                  <UtensilsCrossed size={14} strokeWidth={2} />
                  {recipe.difficulty}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Heart size={14} strokeWidth={2} className={recipe.isLiked ? 'fill-red-500 text-red-500' : ''} />
                {recipe.likesCount} like{recipe.likesCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {hasNutrition && (
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold text-heading">Valeurs nutritionnelles</h2>
            <div className="flex flex-wrap items-center gap-6">
              {recipe.caloriesKcal != null && (
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-accent/60 text-center">
                  <Flame size={13} strokeWidth={2} className="text-accent" />
                  <span className="text-[13px] font-extrabold leading-tight text-heading">{recipe.caloriesKcal}</span>
                  <span className="text-[8px] font-semibold text-neutral-500">kcal</span>
                </div>
              )}
              <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm">
                {recipe.carbsG != null && (
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-500">Glucides</span>
                    <span className="font-bold text-neutral-100">{recipe.carbsG} g</span>
                  </div>
                )}
                {recipe.fatG != null && (
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-500">Lipides</span>
                    <span className="font-bold text-neutral-100">{recipe.fatG} g</span>
                  </div>
                )}
                {recipe.proteinG != null && (
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-500">Protéines</span>
                    <span className="font-bold text-neutral-100">{recipe.proteinG} g</span>
                  </div>
                )}
                {nutritionExtra.fiberG != null && (
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-500">Fibres</span>
                    <span className="font-bold text-neutral-100">{nutritionExtra.fiberG} g</span>
                  </div>
                )}
                {nutritionExtra.sugarG != null && (
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-500">Sucres</span>
                    <span className="font-bold text-neutral-100">{nutritionExtra.sugarG} g</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-full border border-neutral-800 bg-neutral-900 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                tab === t.key ? 'bg-accent text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'about' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            {recipe.instructions ? (
              <>
                <h2 className="mb-2 text-sm font-bold text-heading">Préparation</h2>
                <p className="whitespace-pre-line text-sm text-neutral-300">{recipe.instructions}</p>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-neutral-500">Aucune description détaillée.</p>
            )}
          </div>
        )}

        {tab === 'ingredients' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            {ingredients.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">Aucun ingrédient renseigné.</p>
            ) : (
              <ul className="space-y-3">
                {ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-neutral-500">
                      {ing.imageUrl ? (
                        <img src={ing.imageUrl} alt={ing.name} className="h-full w-full object-cover" />
                      ) : (
                        <UtensilsCrossed size={16} strokeWidth={1.6} />
                      )}
                    </span>
                    <span className="flex-1 text-sm text-neutral-200">
                      {ing.name}
                      {ing.optional && <span className="ml-1.5 text-xs text-neutral-500">(facultatif)</span>}
                    </span>
                    {(ing.quantity || ing.unit) && (
                      <span className="shrink-0 text-xs font-semibold text-neutral-400">
                        {ing.quantity ?? ''} {ing.unit ?? ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'steps' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            {steps.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">Aucune étape détaillée pour l'instant.</p>
            ) : (
              <ol className="space-y-5">
                {steps.map((step) => (
                  <li key={step.id} className="flex gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white">
                      {step.stepNumber}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-200">{step.instruction}</p>
                      {step.imageUrl && (
                        <img
                          src={step.imageUrl}
                          alt={`Étape ${step.stepNumber}`}
                          className="mt-2.5 max-h-56 w-full rounded-xl object-cover"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <form onSubmit={handlePostComment} className="mb-5 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? 'Ajouter un commentaire…' : 'Connecte-toi pour commenter'}
                disabled={!user || isPostingComment}
                className="w-full rounded-full border border-neutral-800 bg-neutral-950 py-2.5 px-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim() || isPostingComment}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </form>

            {comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Aucun commentaire pour l'instant — sois le premier à réagir !
              </p>
            ) : (
              <div className="space-y-4">
                {comments
                  .filter((c) => !c.isHidden)
                  .map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <span className="avatar-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        {(c.authorName ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-100">
                            {c.authorName ?? 'Utilisateur'}
                          </span>
                          <span className="text-[11px] text-neutral-500">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-neutral-300">{c.content}</p>
                      </div>
                      {user?.id === c.userId && (
                        <button
                          onClick={() => handleDeleteComment(c)}
                          title="Supprimer"
                          className="shrink-0 rounded-full p-1 text-neutral-600 hover:text-red-400"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
