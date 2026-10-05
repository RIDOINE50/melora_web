import { Link } from 'react-router-dom';
import { Bookmark, Heart, UtensilsCrossed } from 'lucide-react';

export interface RecipeCardProps {
  id: number;
  title: string;
  imageUrl: string | null;
  authorId: string;
  authorName: string | null;
  likesCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;
}

/**
 * Carte de fil — image pleine largeur avec cœur en overlay (comme l'appli
 * mobile), titre et auteur en dessous. Pensée pour une grille 2 colonnes.
 */
export default function RecipeCard({
  id,
  title,
  imageUrl,
  authorId,
  authorName,
  likesCount,
  isLiked,
  isFavorited,
  onToggleLike,
  onToggleFavorite,
}: RecipeCardProps) {
  return (
    <article className="animate-fade-in overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700">
      <div className="relative">
        <Link to={`/recipe/${id}`} className="block">
          <div className="flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-600">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <UtensilsCrossed size={36} strokeWidth={1.3} />
            )}
          </div>
        </Link>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleLike?.();
            }}
            title="J'aime"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
          >
            <Heart size={16} strokeWidth={2} className={isLiked ? 'fill-red-500 text-red-500' : 'text-white'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            title="Ajouter aux favoris"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
          >
            <Bookmark
              size={16}
              strokeWidth={2}
              className={isFavorited ? 'fill-accent text-accent' : 'text-white'}
            />
          </button>
        </div>
      </div>

      <div className="p-3 pt-2">
        <Link to={`/recipe/${id}`}>
          <h3 className="mb-1.5 line-clamp-2 text-[13px] font-bold leading-snug text-neutral-50">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/creator/${authorId}`}
            className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200"
          >
            <span className="avatar-gradient flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white">
              {(authorName ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{authorName ?? 'Créateur Mealora'}</span>
          </Link>

          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-neutral-500">
            <Heart size={12} strokeWidth={2} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
            {likesCount}
          </span>
        </div>
      </div>
    </article>
  );
}
