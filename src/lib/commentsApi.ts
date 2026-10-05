import { supabase } from './supabase';

export interface RecipeComment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  parentCommentId: number | null;
  isHidden: boolean;
  userId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
}

interface CommentRow {
  id: number;
  content: string;
  created_at: string;
  updated_at: string | null;
  parent_comment_id: number | null;
  is_hidden: boolean;
  user_id: string;
  profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | { username: string | null; full_name: string | null; avatar_url: string | null }[] | null;
}

function firstOrSelf<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getComments(recipeId: number): Promise<RecipeComment[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select(
      'id, content, created_at, updated_at, parent_comment_id, is_hidden, user_id, profiles ( username, full_name, avatar_url )',
    )
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as CommentRow[]).map((row) => {
    const author = firstOrSelf(row.profiles);
    return {
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      parentCommentId: row.parent_comment_id,
      isHidden: row.is_hidden,
      userId: row.user_id,
      authorName: author?.full_name ?? author?.username ?? null,
      authorAvatarUrl: author?.avatar_url ?? null,
    };
  });
}

export async function addComment(params: {
  recipeId: number;
  content: string;
  parentCommentId?: number | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');
  if (!params.content.trim()) throw new Error('Le commentaire ne peut pas être vide.');

  const { error } = await supabase.from('recipe_comments').insert({
    recipe_id: params.recipeId,
    user_id: userId,
    content: params.content.trim(),
    parent_comment_id: params.parentCommentId ?? null,
  });
  if (error) throw error;
}

export async function deleteComment(commentId: number) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté.');

  const { error } = await supabase
    .from('recipe_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}
