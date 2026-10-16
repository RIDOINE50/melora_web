import { supabase } from './supabase';
import { resolveRecipeImageUrl } from './recipesApi';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
];

export interface MealPlanEntry {
  id: number;
  planDate: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: number;
  recipeTitle: string;
  recipeImageUrl: string | null;
}

/**
 * Ligne brute renvoyée par Supabase.
 * ⚠️ `recipes` est renvoyé comme un TABLEAU par Supabase
 * (même pour une relation 1-1), d'où le type `[]`.
 */
interface MealPlanRow {
  id: number;
  plan_date: string;
  meal_type: MealType;
  recipe_id: number;
  recipes: { title: string; image_url: string | null }[] | null;
}

/** Clé de date au format YYYY-MM-DD en heure LOCALE (évite le décalage UTC). */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Toutes les entrées d'un utilisateur entre deux dates (bornes incluses). */
/** Toutes les entrées d'un utilisateur entre deux dates (bornes incluses). */
export async function getMealPlanEntries(
  userId: string,
  from: Date,
  to: Date,
): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('id, plan_date, meal_type, recipe_id') // ⚠️ plus de jointure recipes(...)
    .eq('user_id', userId)
    .gte('plan_date', toDateKey(from))
    .lte('plan_date', toDateKey(to))
    .order('plan_date', { ascending: true });

  if (error) throw error;

  // Sans jointure, on n'a pas le titre ni l'image.
  // On met des valeurs par défaut (ou tu peux enrichir côté client).
  return ((data ?? []) as Array<{
    id: number;
    plan_date: string;
    meal_type: MealType;
    recipe_id: number;
  }>).map((r) => ({
    id: r.id,
    planDate: r.plan_date,
    mealType: r.meal_type,
    recipeId: r.recipe_id,
    recipeTitle: 'Recette', // ou charger le titre via un autre appel
    recipeImageUrl: null,
  }));
}

export async function addMealPlanEntry(input: {
  userId: string;
  planDate: string;
  mealType: MealType;
  recipeId: number | string;
}): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .insert({
      user_id: input.userId,
      plan_date: input.planDate,
      meal_type: input.mealType,
      recipe_id: input.recipeId,
    })
    .select('id, plan_date, meal_type, recipe_id') // ⚠️ plus de jointure
    .single();

  if (error) throw error;

  return {
    id: data.id,
    planDate: data.plan_date,
    mealType: data.meal_type,
    recipeId: data.recipe_id,
    recipeTitle: 'Recette',
    recipeImageUrl: null,
  };
}
export async function removeMealPlanEntry(id: number) {
  const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id);
  if (error) throw error;
}