import { supabase } from './supabase';

export interface RecipeCard {
  id: number;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  likesCount: number;
  isLiked: boolean;
  isFavorited: boolean;
}

export interface RecipeSummary {
  id: number;
  title: string;
  imageUrl: string | null;
}

// ============================================================
// CACHE DES URLS SIGNÉES (image) — même principe que côté mobile
// (RecipeRepository) : sans ça, chaque fois qu'une miniature redevient
// visible après un défilement on refait un aller-retour réseau complet.
// ============================================================
const CACHE_VALIDITY_MS = 50 * 60 * 1000;
const imageUrlCache = new Map<string, { url: string; cachedAt: number }>();
const avatarUrlCache = new Map<string, { url: string; cachedAt: number }>();

async function signedUrl(
  bucket: string,
  path: string | null,
  cache: Map<string, { url: string; cachedAt: number }>,
): Promise<string | null> {
  if (!path || !path.trim()) return null;
  const key = path.trim();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_VALIDITY_MS) return cached.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 60);
  if (error || !data) {
    return null;
  }
  cache.set(key, { url: data.signedUrl, cachedAt: Date.now() });
  return data.signedUrl;
}

export async function resolveRecipeImageUrl(path: string | null): Promise<string | null> {
  return signedUrl('recipe-images', path, imageUrlCache);
}

const videoUrlCache = new Map<string, { url: string; cachedAt: number }>();

/** URL signée pour une vidéo de recette (bucket privé `recipe-videos`, comme sur mobile). */
export async function resolveRecipeVideoUrl(path: string | null): Promise<string | null> {
  return signedUrl('recipe-videos', path, videoUrlCache);
}

async function resolveAvatarUrl(path: string | null): Promise<string | null> {
  return signedUrl('avatars', path, avatarUrlCache);
}

// ============================================================
// LECTURE DES RECETTES
// ============================================================

const RECIPE_SELECT = `
  id, title, image_url, video_url, created_at, author_id, category_id,
  categories ( name ),
  profiles ( username, full_name, avatar_url )
`;

interface RawRecipeRow {
  id: number;
  title: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  author_id: string;
  category_id: number | null;
  categories: { name: string } | { name: string }[] | null;
  profiles:
    | { username: string | null; full_name: string | null; avatar_url: string | null }
    | { username: string | null; full_name: string | null; avatar_url: string | null }[]
    | null;
}

function firstOrSelf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function countByRecipeId(
  table: 'recipe_likes' | 'recipe_favorites',
  recipeIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (recipeIds.length === 0) return counts;
  const { data, error } = await supabase.from(table).select('recipe_id').in('recipe_id', recipeIds);
  if (error) throw error;
  (data ?? []).forEach((row) => {
    const id = row.recipe_id as number;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return counts;
}

async function myInteractionSet(
  table: 'recipe_likes' | 'recipe_favorites',
  recipeIds: number[],
  userId: string | null,
): Promise<Set<number>> {
  const set = new Set<number>();
  if (!userId || recipeIds.length === 0) return set;
  const { data, error } = await supabase
    .from(table)
    .select('recipe_id')
    .eq('user_id', userId)
    .in('recipe_id', recipeIds);
  if (error) throw error;
  (data ?? []).forEach((row) => set.add(row.recipe_id as number));
  return set;
}

async function hydrateRecipes(rows: RawRecipeRow[]): Promise<RecipeCard[]> {
  if (rows.length === 0) return [];
  const recipeIds = rows.map((r) => r.id);
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id ?? null;

  const [likeCounts, favoriteCounts, likedSet, favoritedSet] = await Promise.all([
    countByRecipeId('recipe_likes', recipeIds),
    countByRecipeId('recipe_favorites', recipeIds),
    myInteractionSet('recipe_likes', recipeIds, currentUserId),
    myInteractionSet('recipe_favorites', recipeIds, currentUserId),
  ]);
  void favoriteCounts;

  return Promise.all(
    rows.map(async (r) => {
      const category = firstOrSelf(r.categories);
      const author = firstOrSelf(r.profiles);
      return {
        id: r.id,
        title: r.title,
        imageUrl: await resolveRecipeImageUrl(r.image_url),
        videoUrl: r.video_url,
        createdAt: r.created_at,
        authorId: r.author_id,
        authorName: author?.full_name ?? author?.username ?? null,
        authorAvatarUrl: await resolveAvatarUrl(author?.avatar_url ?? null),
        categoryId: r.category_id,
        categoryName: category?.name ?? null,
        likesCount: likeCounts.get(r.id) ?? 0,
        isLiked: likedSet.has(r.id),
        isFavorited: favoritedSet.has(r.id),
      };
    }),
  );
}

/** Fil d'accueil : recettes publiées, les plus récentes en premier. */
export async function getFeedRecipes(): Promise<RecipeCard[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return hydrateRecipes((data ?? []) as unknown as RawRecipeRow[]);
}

/** Catalogue avec recherche par titre + filtre catégorie. */
export async function searchRecipes(params: {
  query?: string;
  categoryId?: number | null;
  limit?: number;
}): Promise<RecipeCard[]> {
  let builder = supabase.from('recipes').select(RECIPE_SELECT).eq('status', 'published');
  if (params.categoryId) {
    builder = builder.eq('category_id', params.categoryId);
  }
  if (params.query && params.query.trim()) {
    builder = builder.ilike('title', `%${params.query.trim()}%`);
  }
  const { data, error } = await builder.order('created_at', { ascending: false }).limit(params.limit ?? 60);
  if (error) throw error;
  return hydrateRecipes((data ?? []) as unknown as RawRecipeRow[]);
}

// ============================================================
// LIKES / FAVORIS
// ============================================================

export async function toggleLike(recipeId: number, isCurrentlyLiked: boolean) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  if (isCurrentlyLiked) {
    const { error } = await supabase
      .from('recipe_likes')
      .delete()
      .eq('recipe_id', recipeId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('recipe_likes').insert({ recipe_id: recipeId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleFavorite(recipeId: number, isCurrentlyFavorited: boolean) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  if (isCurrentlyFavorited) {
    const { error } = await supabase
      .from('recipe_favorites')
      .delete()
      .eq('recipe_id', recipeId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('recipe_favorites')
      .insert({ recipe_id: recipeId, user_id: userId });
    if (error) throw error;
  }
}

/** Recettes que l'utilisateur connecté a mises en favoris (page dédiée). */
export async function getFavoriteRecipes(userId: string): Promise<RecipeCard[]> {
  const { data, error } = await supabase
    .from('recipe_favorites')
    .select(`created_at, recipe:recipes ( ${RECIPE_SELECT} )`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = ((data ?? []) as unknown as { recipe: RawRecipeRow | RawRecipeRow[] | null }[])
    .map((r) => firstOrSelf(r.recipe))
    .filter((r): r is RawRecipeRow => r !== null);

  return hydrateRecipes(rows);
}

export interface RecipeDetail {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  instructions: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: string | null;
  dietType: string | null;
  caloriesKcal: number | null;
  carbsG: number | null;
  fatG: number | null;
  proteinG: number | null;
  sourceType: string | null;
  resolvedVideoUrl: string | null;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  likesCount: number;
  isLiked: boolean;
  isFavorited: boolean;
}

interface RawRecipeDetailRow extends RawRecipeRow {
  description: string | null;
  instructions: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  diet_type: string | null;
  calories_kcal: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  protein_g: number | null;
  source_type: string | null;
}

/** Détail complet d'une recette publiée, pour la page de consultation. */
export async function getRecipeById(id: number): Promise<RecipeDetail | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(
      `id, title, description, image_url, video_url, instructions, prep_time, cook_time,
       servings, difficulty, diet_type, calories_kcal, carbs_g, fat_g, protein_g, source_type,
       created_at, author_id, category_id,
       categories ( name ),
       profiles ( username, full_name, avatar_url )`,
    )
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [hydrated] = await hydrateRecipes([data as unknown as RawRecipeDetailRow]);
  const row = data as unknown as RawRecipeDetailRow;
  const resolvedVideoUrl = await resolveRecipeVideoUrl(row.video_url);

  return {
    ...hydrated,
    description: row.description,
    instructions: row.instructions,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    difficulty: row.difficulty,
    dietType: row.diet_type,
    caloriesKcal: row.calories_kcal,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    proteinG: row.protein_g,
    sourceType: row.source_type,
    resolvedVideoUrl,
  };
}

/** Recettes publiées d'un créateur donné (profil public / mon profil). */
export async function getRecipesByAuthor(authorId: string): Promise<RecipeSummary[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, image_url')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (r) => ({
      id: r.id,
      title: r.title,
      imageUrl: await resolveRecipeImageUrl(r.image_url),
    })),
  );
}
