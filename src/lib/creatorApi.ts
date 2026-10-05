import { supabase } from './supabase';

export interface CreatorProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'creator' | 'admin';
  specialty: string | null;
  creator_document_path: string | null;
}

export async function getCreatorProfile(creatorId: string): Promise<CreatorProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, role, specialty, creator_document_path')
    .eq('id', creatorId)
    .maybeSingle();
  if (error) throw error;
  return data as CreatorProfile | null;
}

export interface RatingSummary {
  average: number;
  count: number;
}

/**
 * Notation du créateur (comme dans l'appli mobile) : moyenne + nombre de
 * votes via la RPC `get_creator_rating_summary`. N'est appelé que si le
 * créateur est éligible (role = 'creator' ET document fourni) — la section
 * de notation n'existe pas du tout sinon.
 */
export async function getCreatorRatingSummary(creatorId: string): Promise<RatingSummary> {
  const { data, error } = await supabase
    .rpc('get_creator_rating_summary', { p_creator_id: creatorId })
    .single();
  if (error) throw error;
  const row = data as { average: number | null; rating_count: number | null };
  return { average: row.average ?? 0, count: row.rating_count ?? 0 };
}

export async function getMyRatingForCreator(creatorId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_my_rating_for_creator', {
    p_creator_id: creatorId,
  });
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function rateCreator(creatorId: string, rating: number) {
  const { error } = await supabase.rpc('rate_creator', {
    p_creator_id: creatorId,
    p_rating: rating,
  });
  if (error) throw error;
}
