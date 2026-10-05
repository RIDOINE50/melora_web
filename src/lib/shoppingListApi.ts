import { supabase } from './supabase';

export interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  source: string | null;
}

export async function getShoppingListItems(userId: string): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('id, name, quantity, unit, is_checked, source')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
    isChecked: r.is_checked,
    source: r.source,
  }));
}

export async function addShoppingListItem(params: {
  userId: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  source?: string;
}) {
  const { error } = await supabase.from('shopping_list_items').insert({
    user_id: params.userId,
    name: params.name,
    quantity: params.quantity ?? null,
    unit: params.unit ?? null,
    source: params.source ?? 'manual',
  });
  if (error) throw error;
}

export async function toggleShoppingListItem(id: number, isChecked: boolean) {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: !isChecked })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingListItem(id: number) {
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
  if (error) throw error;
}

interface IngredientNeed {
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface RecipeIngredientRow {
  quantity: number | null;
  unit: string | null;
  ingredient: { name: string } | null;
}

/** Additionne les quantités d'un même ingrédient (même nom + même unité). */
function aggregate(needs: IngredientNeed[]): IngredientNeed[] {
  const byKey = new Map<string, IngredientNeed>();
  for (const need of needs) {
    const key = `${need.name.toLowerCase()}__${(need.unit ?? '').toLowerCase()}`;
    const existing = byKey.get(key);
    if (existing && existing.quantity != null && need.quantity != null) {
      existing.quantity += need.quantity;
    } else if (!existing) {
      byKey.set(key, { ...need });
    }
  }
  return Array.from(byKey.values());
}

async function fetchIngredientNeeds(recipeIds: number[]): Promise<IngredientNeed[]> {
  if (recipeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('quantity, unit, ingredient:ingredients ( name )')
    .in('recipe_id', recipeIds);
  if (error) throw error;

  return ((data ?? []) as unknown as RecipeIngredientRow[])
    .filter((r) => r.ingredient?.name)
    .map((r) => ({ name: r.ingredient!.name, quantity: r.quantity, unit: r.unit }));
}

/** Génère la liste de courses à partir des recettes planifiées entre deux dates. */
export async function generateFromMealPlan(userId: string, from: string, to: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from('meal_plan_entries')
    .select('recipe_id')
    .eq('user_id', userId)
    .gte('plan_date', from)
    .lte('plan_date', to);
  if (error) throw error;

  const recipeIds = Array.from(new Set((entries ?? []).map((e) => e.recipe_id as number)));
  const needs = aggregate(await fetchIngredientNeeds(recipeIds));
  if (needs.length === 0) return 0;

  const { error: insertError } = await supabase.from('shopping_list_items').insert(
    needs.map((n) => ({
      user_id: userId,
      name: n.name,
      quantity: n.quantity,
      unit: n.unit,
      source: 'meal_plan',
    })),
  );
  if (insertError) throw insertError;
  return needs.length;
}

/** Génère la liste de courses à partir des ingrédients d'une seule recette. */
export async function generateFromRecipe(userId: string, recipeId: number): Promise<number> {
  const needs = aggregate(await fetchIngredientNeeds([recipeId]));
  if (needs.length === 0) return 0;

  const { error } = await supabase.from('shopping_list_items').insert(
    needs.map((n) => ({
      user_id: userId,
      name: n.name,
      quantity: n.quantity,
      unit: n.unit,
      source: 'recipe',
    })),
  );
  if (error) throw error;
  return needs.length;
}
