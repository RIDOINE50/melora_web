import { supabase } from './supabase';

export type NotificationType = 'new_follower' | 'new_recipe' | string;

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  relatedRecipeId: number | null;
  relatedUserId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: number;
  type: string;
  title: string;
  body: string | null;
  related_recipe_id: number | null;
  related_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

function mapRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedRecipeId: row.related_recipe_id,
    relatedUserId: row.related_user_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, related_recipe_id, related_user_id, is_read, created_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapRow);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: number) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function deleteNotification(id: number) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}
