import { supabase } from './supabase';
import { resolveRecipeImageUrl } from './recipesApi';

// ============================================================
// INGRÉDIENTS — onglet "Ingrédients" (comme sur mobile)
// ============================================================

export interface RecipeIngredientItem {
  id: number;
  name: string;
  imageUrl: string | null;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

interface RawIngredientRow {
  id: number;
  quantity: number | null;
  unit: string | null;
  optional: boolean | null;
  ingredient: { id: number; name: string; image_url: string | null } | { id: number; name: string; image_url: string | null }[] | null;
}

function firstOrSelf<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredientItem[]> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('id, quantity, unit, optional, ingredient:ingredients ( id, name, image_url )')
    .eq('recipe_id', recipeId)
    .order('id', { ascending: true });
  if (error) throw error;

  return Promise.all(
    ((data ?? []) as unknown as RawIngredientRow[]).map(async (row) => {
      const ingredient = firstOrSelf(row.ingredient);
      return {
        id: row.id,
        name: ingredient?.name ?? 'Ingrédient',
        imageUrl: await resolveRecipeImageUrl(ingredient?.image_url ?? null),
        quantity: row.quantity,
        unit: row.unit,
        optional: row.optional ?? false,
      };
    }),
  );
}

// ============================================================
// ÉTAPES — préparation numérotée (comme le mode "Cuisiner" mobile)
// ============================================================

export interface RecipeStepItem {
  id: number;
  stepNumber: number;
  instruction: string;
  imageUrl: string | null;
}

export async function getRecipeSteps(recipeId: number): Promise<RecipeStepItem[]> {
  const { data, error } = await supabase
    .from('recipe_steps')
    .select('id, step_number, instruction, image_url')
    .eq('recipe_id', recipeId)
    .order('step_number', { ascending: true });
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (row) => ({
      id: row.id,
      stepNumber: row.step_number,
      instruction: row.instruction,
      imageUrl: await resolveRecipeImageUrl(row.image_url),
    })),
  );
}

// ============================================================
// NUTRITION DÉTAILLÉE — fibres/sucres (table dédiée `recipe_nutrition`,
// en complément des colonnes déjà sur `recipes` pour calories/glucides/
// lipides/protéines).
// ============================================================

export interface RecipeNutritionExtra {
  fiberG: number | null;
  sugarG: number | null;
}

export async function getRecipeNutritionExtra(recipeId: number): Promise<RecipeNutritionExtra> {
  const { data, error } = await supabase
    .from('recipe_nutrition')
    .select('fiber, sugar')
    .eq('recipe_id', recipeId)
    .maybeSingle();
  if (error) throw error;
  return { fiberG: data?.fiber ?? null, sugarG: data?.sugar ?? null };
}

// ============================================================
// NOTES (étoiles) — distinctes des likes, comme sur mobile
// ============================================================

export interface RecipeRatingSummary {
  average: number;
  count: number;
}

export async function getRecipeRatingSummary(recipeId: number): Promise<RecipeRatingSummary> {
  const { data, error } = await supabase.from('recipe_ratings').select('rating').eq('recipe_id', recipeId);
  if (error) throw error;
  const ratings = (data ?? []).map((r) => r.rating as number);
  if (ratings.length === 0) return { average: 0, count: 0 };
  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { average, count: ratings.length };
}

export async function getMyRecipeRating(recipeId: number, userId: string | null): Promise<number | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.rating ?? null;
}

/** Note une recette de 1 à 5 étoiles ; une seule note par utilisateur, modifiable. */
export async function rateRecipe(recipeId: number, rating: number): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  const { error } = await supabase
    .from('recipe_ratings')
    .upsert({ recipe_id: recipeId, user_id: userId, rating }, { onConflict: 'recipe_id,user_id' });
  if (error) throw error;
}
