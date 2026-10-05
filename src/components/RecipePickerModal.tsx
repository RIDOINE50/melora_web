import { useEffect, useState } from 'react';
import { Search, UtensilsCrossed, X } from 'lucide-react';
import { searchRecipes, type RecipeCard as RecipeCardData } from '../lib/recipesApi';

interface RecipePickerModalProps {
  title: string;
  onClose: () => void;
  onSelect: (recipe: RecipeCardData) => void;
}

/** Petite fenêtre de recherche pour choisir une recette existante (utilisée
 * par le planificateur de repas et la liste de courses). */
export default function RecipePickerModal({ title, onClose, onSelect }: RecipePickerModalProps) {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const timeout = setTimeout(() => {
      searchRecipes({ query, limit: 30 })
        .then((data) => {
          if (isMounted) setRecipes(data);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 200);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-neutral-800 bg-neutral-950 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="text-sm font-bold text-heading">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-900">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="border-b border-neutral-800 p-4">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une recette…"
              className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && <div className="py-10 text-center text-sm text-neutral-500">Recherche…</div>}
          {!isLoading && recipes.length === 0 && (
            <div className="py-10 text-center text-sm text-neutral-500">Aucune recette trouvée.</div>
          )}
          {!isLoading &&
            recipes.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-neutral-900"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 text-neutral-600">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed size={18} strokeWidth={1.5} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-100">{r.title}</span>
                  <span className="block truncate text-xs text-neutral-500">
                    {r.authorName ?? 'Créateur Mealora'}
                  </span>
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
