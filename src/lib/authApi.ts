import { supabase } from './supabase';

export type AccountType = 'user' | 'cuisine' | 'nutrition';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: 'user' | 'creator' | 'admin';
  specialty: AccountType | null;
  creator_status: string | null;
  creator_document_path: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
  dietary_preferences: string[] | null;
  preferred_foods: string[] | null;
  avoided_foods: string[] | null;
  cooking_level: string | null;
  cuisine_preferences: string[] | null;
  theme_preference: string | null;
  accent_color: string | null;
}

/**
 * Inscription: crée le compte auth Supabase, puis met à jour le profil
 * (créé automatiquement par le trigger `on_auth_user_created` côté DB,
 * comme dans l'appli mobile).
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { full_name: params.fullName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Connexion/inscription via Google — même provider OAuth Supabase que
 * côté mobile. Redirige vers Google puis revient sur `redirectTo`
 * (le trigger `on_auth_user_created` crée le profil, comme pour un
 * compte créé par e-mail).
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfilePreferences(params: {
  fullName?: string;
  bio?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(params.fullName !== undefined ? { full_name: params.fullName } : {}),
      ...(params.bio !== undefined ? { bio: params.bio } : {}),
    })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Préférences alimentaires (§10 du cahier des charges côté mobile) —
 * même RPC `update_profile_food_preferences` que dans ProfileRepository
 * (appli mobile). Chaque paramètre est optionnel : seuls ceux fournis
 * sont modifiés.
 */
export async function updateFoodPreferences(params: {
  dietaryPreferences?: string[];
  preferredFoods?: string[];
  avoidedFoods?: string[];
  cookingLevel?: string | null;
  cuisinePreferences?: string[];
}) {
  const { error } = await supabase.rpc('update_profile_food_preferences', {
    p_dietary_preferences: params.dietaryPreferences ?? null,
    p_preferred_foods: params.preferredFoods ?? null,
    p_avoided_foods: params.avoidedFoods ?? null,
    p_cooking_level: params.cookingLevel ?? null,
    p_cuisine_preferences: params.cuisinePreferences ?? null,
  });
  if (error) throw error;
}

/**
 * Apparence (thème clair/sombre/système + couleur d'accent) — comme sur
 * mobile (`theme_controller.dart`), synchronisée sur le profil pour
 * suivre l'utilisateur d'un appareil à l'autre, en plus du stockage
 * local géré par ThemeContext pour un effet instantané.
 */
export async function updateAppearance(params: { themePreference?: string; accentColor?: string | null }) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(params.themePreference !== undefined ? { theme_preference: params.themePreference } : {}),
      ...(params.accentColor !== undefined ? { accent_color: params.accentColor } : {}),
    })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Upload du document PDF justifiant la qualification (comme
 * `uploadCreatorDocument` côté mobile), stocké dans le bucket privé
 * `creator-documents/<user_id>/document.pdf`.
 */
export async function uploadCreatorDocument(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const path = `${userId}/document.pdf`;
  const { error } = await supabase.storage
    .from('creator-documents')
    .upload(path, file, { upsert: true, contentType: 'application/pdf' });
  if (error) throw error;
  return path;
}

/**
 * Envoie la candidature créateur via la RPC `submit_creator_application`
 * (même fonction que côté mobile — la règle "document obligatoire en
 * nutrition" est vérifiée côté serveur en plus du contrôle ici).
 */
export async function submitCreatorApplication(params: {
  specialty: AccountType;
  applicationNote?: string | null;
  documentPath?: string | null;
}) {
  const { error } = await supabase.rpc('submit_creator_application', {
    p_specialty: params.specialty,
    p_application_note: params.applicationNote ?? null,
    p_document_path: params.documentPath ?? null,
  });
  if (error) throw error;
}
