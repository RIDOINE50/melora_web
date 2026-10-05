import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, Star } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../contexts/AuthContext';
import {
  getCreatorProfile,
  getCreatorRatingSummary,
  getMyRatingForCreator,
  rateCreator,
  type CreatorProfile,
  type RatingSummary,
} from '../lib/creatorApi';
import { getRecipesByAuthor, type RecipeSummary } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBeRated = profile?.role === 'creator' && !!profile.creator_document_path;
  const isSelf = user?.id === id;

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [creatorProfile, creatorRecipes] = await Promise.all([
          getCreatorProfile(id!),
          getRecipesByAuthor(id!),
        ]);
        if (!isMounted) return;
        setProfile(creatorProfile);
        setRecipes(creatorRecipes);

        if (creatorProfile?.role === 'creator' && creatorProfile.creator_document_path) {
          const [summary, mine] = await Promise.all([
            getCreatorRatingSummary(id!),
            user ? getMyRatingForCreator(id!) : Promise.resolve(null),
          ]);
          if (!isMounted) return;
          setRatingSummary(summary);
          setMyRating(mine);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  async function handleRate(rating: number) {
    if (!id || isSelf || isSubmittingRating) return;
    const previousSummary = ratingSummary;
    const previousMyRating = myRating;

    setMyRating(rating);
    setIsSubmittingRating(true);
    try {
      await rateCreator(id, rating);
      const fresh = await getCreatorRatingSummary(id);
      setRatingSummary(fresh);
    } catch (err) {
      setRatingSummary(previousSummary);
      setMyRating(previousMyRating);
      setError(getErrorMessage(err, "Impossible d'envoyer ta note."));
    } finally {
      setIsSubmittingRating(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
          Chargement du profil…
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          Profil introuvable.
        </div>
      </AppLayout>
    );
  }

  const initial = (profile.full_name ?? profile.username ?? '?').charAt(0).toUpperCase();

  return (
    <AppLayout>
      <div className="md:max-w-4xl">
      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <span className="avatar-gradient flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
            {initial}
          </span>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-heading sm:text-2xl">
                {profile.full_name || profile.username || 'Créateur'}
              </h1>
              {canBeRated && <BadgeCheck size={20} className="fill-accent text-white" />}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                {profile.role === 'creator' ? 'Créateur' : 'Utilisateur'}
              </span>
              {canBeRated && (
                <span className="inline-flex items-center rounded-full bg-green-950/50 px-2.5 py-1 text-[11px] font-bold text-green-400">
                  ✓ Vérifié
                </span>
              )}
              <span className="text-sm text-neutral-400">
                <b className="font-bold text-neutral-100">{recipes.length}</b> recette
                {recipes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {profile.bio && <p className="text-sm text-neutral-300">{profile.bio}</p>}
          </div>
        </div>

        {/* Section notation — n'existe pas du tout si le créateur n'est pas éligible */}
        {canBeRated && (
          <div className="mt-6 border-t border-neutral-800 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-heading">Note du créateur</span>
              {ratingSummary && ratingSummary.count > 0 && (
                <span className="text-xs text-neutral-400">
                  {ratingSummary.average.toFixed(1)} · {ratingSummary.count} avis
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isSelf
                ? renderStaticStars(ratingSummary?.average ?? 0)
                : renderInteractiveStars({
                    value: hoverRating ?? myRating ?? 0,
                    disabled: isSubmittingRating,
                    onHover: setHoverRating,
                    onLeave: () => setHoverRating(null),
                    onSelect: handleRate,
                  })}
            </div>

            {!isSelf && myRating && (
              <p className="mt-2 text-xs text-neutral-400">Ta note : {myRating}/5</p>
            )}
            {isSelf && (
              <p className="mt-2 text-xs text-neutral-400">
                C'est ton profil public — tu ne peux pas te noter toi-même.
              </p>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-4 text-lg font-bold text-heading">Recettes publiées</h2>

      {recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          Aucune recette publiée pour l'instant.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              id={r.id}
              title={r.title}
              imageUrl={r.imageUrl}
              authorId={profile.id}
              authorName={profile.full_name ?? profile.username}
              likesCount={0}
              isLiked={false}
              isFavorited={false}
            />
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  );
}

function renderStaticStars(average: number) {
  return Array.from({ length: 5 }).map((_, i) => {
    const filled = i < Math.round(average);
    return (
      <Star
        key={i}
        size={22}
        strokeWidth={1.5}
        className={filled ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}
      />
    );
  });
}

function renderInteractiveStars(opts: {
  value: number;
  disabled: boolean;
  onHover: (rating: number) => void;
  onLeave: () => void;
  onSelect: (rating: number) => void;
}) {
  return Array.from({ length: 5 }).map((_, i) => {
    const starValue = i + 1;
    const filled = starValue <= opts.value;
    return (
      <button
        key={i}
        type="button"
        disabled={opts.disabled}
        onMouseEnter={() => opts.onHover(starValue)}
        onMouseLeave={opts.onLeave}
        onClick={() => opts.onSelect(starValue)}
        className="p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        title={`${starValue}/5`}
      >
        <Star
          size={26}
          strokeWidth={1.5}
          className={filled ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}
        />
      </button>
    );
  });
}
