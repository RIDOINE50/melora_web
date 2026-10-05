import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, Check, Plus, Send, ShoppingBag, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipePickerModal from '../components/RecipePickerModal';
import { useAuth } from '../contexts/AuthContext';
import {
  addShoppingListItem,
  deleteShoppingListItem,
  generateFromMealPlan,
  generateFromRecipe,
  getShoppingListItems,
  toggleShoppingListItem,
  type ShoppingListItem,
} from '../lib/shoppingListApi';
import type { RecipeCard as RecipeCardData } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

function currentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const weekday = (now.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - weekday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

export default function ShoppingListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);

  async function reload() {
    if (!user) return;
    setItems(await getShoppingListItems(user.id));
  }

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getShoppingListItems(user.id)
      .then((data) => {
        if (isMounted) setItems(data);
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

  async function handleAddManual(e: FormEvent) {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;
    const name = newItemName.trim();
    setNewItemName('');
    try {
      await addShoppingListItem({ userId: user.id, name });
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'ajouter l'article."));
    }
  }

  async function handleGenerateFromPlan() {
    if (!user || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const { from, to } = currentWeekRange();
      const count = await generateFromMealPlan(user.id, from, to);
      if (count === 0) {
        setError("Aucune recette planifiée cette semaine — rien à ajouter.");
      } else {
        showToast(`${count} article${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''} à la liste.`);
      }
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de générer la liste.'));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePickRecipe(recipe: RecipeCardData) {
    if (!user) return;
    setIsRecipePickerOpen(false);
    setIsGenerating(true);
    setError(null);
    try {
      const count = await generateFromRecipe(user.id, recipe.id);
      if (count === 0) {
        setError('Cette recette ne liste aucun ingrédient.');
      } else {
        showToast(`${count} article${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''} à la liste.`);
      }
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de générer la liste.'));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggle(item: ShoppingListItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isChecked: !i.isChecked } : i)),
    );
    try {
      await toggleShoppingListItem(item.id, item.isChecked);
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isChecked: item.isChecked } : i)),
      );
    }
  }

  async function handleDelete(item: ShoppingListItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await deleteShoppingListItem(item.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de supprimer.'));
      await reload();
    }
  }

  return (
    <AppLayout>
      <div className="md:max-w-xl">
      <h1 className="mb-5 text-2xl font-extrabold text-heading">Liste de courses</h1>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={handleGenerateFromPlan}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-sm font-semibold text-neutral-100 transition hover:border-neutral-700 disabled:opacity-50"
        >
          <Calendar size={16} strokeWidth={2} />
          Générer depuis le planning
        </button>
        <button
          onClick={() => setIsRecipePickerOpen(true)}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-sm font-semibold text-neutral-100 transition hover:border-neutral-700 disabled:opacity-50"
        >
          <ShoppingBag size={16} strokeWidth={2} />
          Générer depuis une recette
        </button>
      </div>

      <form onSubmit={handleAddManual} className="mb-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Plus
            size={16}
            strokeWidth={2.5}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Ajouter un article…"
            className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-9 pr-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
          />
        </div>
        <button
          type="submit"
          disabled={!newItemName.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          Ta liste de courses est vide.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5"
            >
              <button
                onClick={() => handleDelete(item)}
                className="shrink-0 rounded-full p-1 text-neutral-600 hover:text-red-400"
                title="Supprimer"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    item.isChecked ? 'text-neutral-600 line-through' : 'text-neutral-100'
                  }`}
                >
                  {item.name}
                </p>
                {(item.quantity || item.unit) && (
                  <p className="text-xs text-neutral-500">
                    {item.quantity ?? ''} {item.unit ?? ''}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleToggle(item)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  item.isChecked ? 'border-accent bg-accent' : 'border-neutral-700'
                }`}
              >
                {item.isChecked && <Check size={14} strokeWidth={3} className="text-white" />}
              </button>
            </div>
          ))}
        </div>
      )}
      </div>

      {isRecipePickerOpen && (
        <RecipePickerModal
          title="Choisir une recette"
          onClose={() => setIsRecipePickerOpen(false)}
          onSelect={handlePickRecipe}
        />
      )}
    </AppLayout>
  );
}
