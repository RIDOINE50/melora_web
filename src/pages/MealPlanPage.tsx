import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipePickerModal from '../components/RecipePickerModal';
import { useAuth } from '../contexts/AuthContext';
import {
  addMealPlanEntry,
  getMealPlanEntries,
  removeMealPlanEntry,
  MEAL_TYPES,
  type MealPlanEntry,
  type MealType,
} from '../lib/mealPlanApi';
import type { RecipeCard as RecipeCardData } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Grille de 6 semaines (lundi→dimanche) couvrant le mois affiché. */
function buildMonthGrid(month: Date): Date[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = lundi
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function MealPlanPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerMealType, setPickerMealType] = useState<MealType | null>(null);

  const monthGrid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    const from = monthGrid[0];
    const to = monthGrid[monthGrid.length - 1];
    getMealPlanEntries(user.id, from, to)
      .then((data) => {
        if (isMounted) setEntries(data);
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
  }, [user, visibleMonth]);

  const daysWithMeals = useMemo(() => new Set(entries.map((e) => e.planDate)), [entries]);
  const selectedDateKey = toDateKey(selectedDate);
  const entriesForSelectedDay = entries.filter((e) => e.planDate === selectedDateKey);

  async function handleSelectRecipe(recipe: RecipeCardData) {
    if (!user || !pickerMealType) return;
    try {
      await addMealPlanEntry({
        userId: user.id,
        planDate: selectedDateKey,
        mealType: pickerMealType,
        recipeId: recipe.id,
      });
      const from = monthGrid[0];
      const to = monthGrid[monthGrid.length - 1];
      setEntries(await getMealPlanEntries(user.id, from, to));
      showToast('Recette ajoutée au planning.');
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'ajouter cette recette."));
    } finally {
      setPickerMealType(null);
    }
  }

  async function handleRemoveEntry(entry: MealPlanEntry) {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await removeMealPlanEntry(entry.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de supprimer.'));
    }
  }

  return (
    <AppLayout>
      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="lg:w-[360px] lg:shrink-0">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-lg font-extrabold capitalize text-accent">
              {visibleMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(now);
                }}
                className="px-2 text-xs font-bold text-accent"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900"
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 lg:mb-0">
            <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold text-neutral-500">
              {WEEKDAY_LABELS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1.5 text-center text-sm">
              {monthGrid.map((day) => {
                const inMonth = day.getMonth() === visibleMonth.getMonth();
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                const hasMeals = daysWithMeals.has(toDateKey(day));
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className="flex flex-col items-center gap-0.5 py-0.5"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold transition ${
                        isSelected
                          ? 'bg-accent text-white'
                          : isToday
                            ? 'border border-accent text-accent'
                            : inMonth
                              ? 'text-neutral-200'
                              : 'text-neutral-700'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span className={`h-1 w-1 rounded-full ${hasMeals ? 'bg-accent' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
      <h2 className="mb-3 text-sm font-bold capitalize text-neutral-200">
        {selectedDate.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </h2>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 lg:grid-cols-1 lg:space-y-3">
          {MEAL_TYPES.map((meal) => {
            const mealEntries = entriesForSelectedDay.filter((e) => e.mealType === meal.value);
            return (
              <div
                key={meal.value}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-accent">
                  {meal.label}
                </h3>

                {mealEntries.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {mealEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-2"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 text-neutral-600">
                          {entry.recipeImageUrl ? (
                            <img
                              src={entry.recipeImageUrl}
                              alt={entry.recipeTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UtensilsCrossed size={16} strokeWidth={1.5} />
                          )}
                        </span>
                        <span className="flex-1 truncate text-sm font-semibold text-neutral-100">
                          {entry.recipeTitle}
                        </span>
                        <button
                          onClick={() => handleRemoveEntry(entry)}
                          className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setPickerMealType(meal.value)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-2 text-xs font-semibold text-neutral-400 transition hover:border-accent hover:text-accent"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Ajouter une recette
                </button>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>

      {pickerMealType && (
        <RecipePickerModal
          title={`Ajouter au ${MEAL_TYPES.find((m) => m.value === pickerMealType)?.label.toLowerCase()}`}
          onClose={() => setPickerMealType(null)}
          onSelect={handleSelectRecipe}
        />
      )}
    </AppLayout>
  );
}
