/**
 * Traduit les messages d'erreur bruts de Supabase/Postgres (souvent en
 * anglais et illisibles pour un utilisateur non technique) en phrases
 * françaises compréhensibles. Les messages non reconnus sont renvoyés
 * tels quels plutôt que masqués, pour ne jamais cacher une vraie panne.
 */
export function traduireErreurSupabase(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (m.includes('email not confirmed')) {
    return "Ton e-mail n'a pas encore été confirmé. Vérifie ta boîte mail.";
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Un compte existe déjà avec cette adresse e-mail.';
  }
  if (m.includes('password should be at least')) {
    return 'Le mot de passe est trop court (6 caractères minimum).';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Impossible de contacter le serveur. Vérifie ta connexion internet.';
  }
  if (m.includes('jwt') || m.includes('non connecté') || m.includes('not authenticated')) {
    return 'Ta session a expiré — reconnecte-toi.';
  }
  if (m.includes('row-level security') || m.includes('permission denied')) {
    return "Tu n'as pas les droits nécessaires pour effectuer cette action.";
  }
  if (m.includes('duplicate key')) {
    return 'Cet élément existe déjà.';
  }

  return message;
}

/** Raccourci pour les blocs `catch (err) { ... }` : renvoie un message français prêt à afficher. */
export function getErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (err instanceof Error && err.message) {
    return traduireErreurSupabase(err.message);
  }
  return fallback;
}
