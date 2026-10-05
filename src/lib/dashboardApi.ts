import { supabase } from './supabase';
import { resolveRecipeImageUrl } from './recipesApi';

export interface DashboardStats {
  recipesCount: number;
  publishedCount: number;
  followersCount: number;
  totalLikes: number;
  totalFavorites: number;
}

export async function getDashboardStats(creatorId: string): Promise<DashboardStats> {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, status')
    .eq('author_id', creatorId);
  if (recipesError) throw recipesError;

  const recipeIds = (recipes ?? []).map((r) => r.id as number);
  const publishedCount = (recipes ?? []).filter((r) => r.status === 'published').length;

  const { count: followersCount, error: followersError } = await supabase
    .from('creator_follows')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creatorId);
  if (followersError) throw followersError;

  let totalLikes = 0;
  let totalFavorites = 0;

  if (recipeIds.length > 0) {
    const [likesResult, favoritesResult] = await Promise.all([
      supabase.from('recipe_likes').select('id', { count: 'exact', head: true }).in('recipe_id', recipeIds),
      supabase
        .from('recipe_favorites')
        .select('id', { count: 'exact', head: true })
        .in('recipe_id', recipeIds),
    ]);
    if (likesResult.error) throw likesResult.error;
    if (favoritesResult.error) throw favoritesResult.error;
    totalLikes = likesResult.count ?? 0;
    totalFavorites = favoritesResult.count ?? 0;
  }

  return {
    recipesCount: recipes?.length ?? 0,
    publishedCount,
    followersCount: followersCount ?? 0,
    totalLikes,
    totalFavorites,
  };
}

export interface TrendPoint {
  label: string;
  value: number;
}

const WEEKDAY_LABELS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Nombre de likes reçus par jour sur les `days` derniers jours. */
export async function getLikesTrend(creatorId: string, days = 7): Promise<TrendPoint[]> {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id')
    .eq('author_id', creatorId);
  if (recipesError) throw recipesError;
  const recipeIds = (recipes ?? []).map((r) => r.id as number);

  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, label: WEEKDAY_LABELS[d.getDay()], value: 0 };
  });

  if (recipeIds.length === 0) {
    return buckets.map(({ label, value }) => ({ label, value }));
  }

  const { data: likes, error: likesError } = await supabase
    .from('recipe_likes')
    .select('created_at')
    .in('recipe_id', recipeIds)
    .gte('created_at', buckets[0].date.toISOString());
  if (likesError) throw likesError;

  (likes ?? []).forEach((row) => {
    const d = new Date(row.created_at as string);
    d.setHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.date.getTime() === d.getTime());
    if (bucket) bucket.value += 1;
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

export interface CreatorRecipeRow {
  id: number;
  title: string;
  imageUrl: string | null;
  status: string | null;
  createdAt: string;
  likesCount: number;
}

/** Toutes les recettes (brouillon + publiées) d'un créateur, pour "Mes recettes". */
export async function getCreatorRecipes(creatorId: string, limit?: number): Promise<CreatorRecipeRow[]> {
  let builder = supabase
    .from('recipes')
    .select('id, title, image_url, status, created_at')
    .eq('author_id', creatorId)
    .order('created_at', { ascending: false });
  if (limit) builder = builder.limit(limit);

  const { data, error } = await builder;
  if (error) throw error;
  const rows = data ?? [];
  const ids = rows.map((r) => r.id as number);

  const likeCounts = new Map<number, number>();
  if (ids.length > 0) {
    const { data: likes, error: likesError } = await supabase
      .from('recipe_likes')
      .select('recipe_id')
      .in('recipe_id', ids);
    if (likesError) throw likesError;
    (likes ?? []).forEach((l) => {
      const id = l.recipe_id as number;
      likeCounts.set(id, (likeCounts.get(id) ?? 0) + 1);
    });
  }

  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      title: r.title,
      imageUrl: await resolveRecipeImageUrl(r.image_url),
      status: r.status,
      createdAt: r.created_at,
      likesCount: likeCounts.get(r.id) ?? 0,
    })),
  );
}

export interface FollowerRow {
  id: string;
  fullName: string | null;
  followedAt: string;
}

interface FollowerRawRow {
  created_at: string;
  follower:
    | { id: string; full_name: string | null; username: string | null }
    | { id: string; full_name: string | null; username: string | null }[]
    | null;
}

export async function getFollowers(creatorId: string): Promise<FollowerRow[]> {
  const { data, error } = await supabase
    .from('creator_follows')
    .select('created_at, follower:profiles!follower_id ( id, full_name, username )')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as FollowerRawRow[]).map((row) => {
    const follower = Array.isArray(row.follower) ? row.follower[0] : row.follower;
    return {
      id: follower?.id ?? '',
      fullName: follower?.full_name ?? follower?.username ?? 'Utilisateur',
      followedAt: row.created_at,
    };
  });
}

export interface Category {
  id: number;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name').order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Envoie l'image dans le bucket privé `recipe-images` (comme côté mobile). */
export async function uploadRecipeImage(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${userId}/recipe_${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('recipe-images').upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/**
 * Crée une recette directement en base (contrairement à l'appli mobile
 * qui passe par la RPC `create_recipe_draft` pour aussi enregistrer
 * ingrédients/étapes) : la version web ne gère pas encore ces deux
 * dernières, seulement les informations principales de la recette.
 */
export async function createRecipe(params: {
  title: string;
  description: string;
  categoryId: number | null;
  imagePath: string | null;
  prepTime: number | null;
  servings: number | null;
  status: 'draft' | 'published';
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      author_id: userId,
      title: params.title,
      description: params.description || null,
      category_id: params.categoryId,
      image_url: params.imagePath,
      prep_time: params.prepTime,
      servings: params.servings,
      status: params.status,
      published_at: params.status === 'published' ? now : null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
