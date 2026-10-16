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

interface MealPlanRow {
  id: number;
  plan_date: string;
  meal_type: MealType;
  recipe_id: number;
  recipe: { title: string; image_url: string | null } | null;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Toutes les entrées d'un utilisateur entre deux dates (bornes incluses). */
export async function getMealPlanEntries(
  userId: string,
  from: Date,
  to: Date,
): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('id, plan_date, meal_type, recipe_id, recipe:recipes ( title, image_url )')
    .eq('user_id', userId)
    .gte('plan_date', toDateKey(from))
    .lte('plan_date', toDateKey(to))
    .order('plan_date', { ascending: true });

  if (error) throw error;

  const mapped = ((data ?? []) as unknown as MealPlanRow[]).map((r) => ({
    id: r.id,
    planDate: r.plan_date,
    mealType: r.meal_type,
    recipeId: r.recipe_id,
    recipeTitle: r.recipe?.title ?? 'Recette supprimée',
    recipeImageUrl: r.recipe?.image_url ?? null,
  }));

  return Promise.all(
    mapped.map(async (m) => ({ ...m, recipeImageUrl: await resolveRecipeImageUrl(m.recipeImageUrl) })),
  );
}

export async function addMealPlanEntry(input: {
  userId: string;
  planDate: string;
  mealType: MealType;
  recipeId: string;
}): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .insert({
      user_id: input.userId,
      plan_date: input.planDate,
      meal_type: input.mealType,
      recipe_id: input.recipeId,
    })
    .select('id, plan_date, meal_type, recipe_id, recipes(title, image_url)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    planDate: data.plan_date,
    mealType: data.meal_type,
    recipeId: data.recipe_id,
    recipeTitle: data.recipes?.title ?? '',
    recipeImageUrl: data.recipes?.image_url ?? null,
  };
}

export async function removeMealPlanEntry(id: number) {
  const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id);
  if (error) throw error;
}
